import { googleVisionClient } from '@/lib/clients/google-vision.js';
import logger from '@/config/logger.js';
import { DeepSeekClientService } from '@/lib/clients/deepseek.js';
import type { ProductoExtraido } from '../schemas.js';

async function extractText(imageBuffer: Buffer): Promise<string> {
    try {
        logger.info('🚀 Iniciando OCR con Google Cloud Vision API');

        // Usar Google Vision para detectar texto (ya usa documentTextDetection)
        const rawText = await googleVisionClient.detectText(imageBuffer);

        logger.info('✅ OCR completado:', {
            lineas: rawText.split('\n').length,
            caracteres: rawText.length,
        });

        return rawText;
    } catch (error) {
        logger.error('❌ Error en OCR con Google Vision', { error });
        throw new Error('Error al procesar la imagen con OCR');
    }
}

/**
 * Parsea productos del texto extraído de boletas
 * 
 * Estrategia mejorada:
 * 1. Extrae todos los productos (líneas con código de 13 dígitos)
 * 2. Para cada producto, busca cantidad/precio unitario en la línea siguiente
 * 3. Extrae el bloque de precios totales (líneas con solo números)
 * 4. Asocia precios a productos en orden de aparición
 * 
 * Formato de Tottus:
 * - Línea 1: CÓDIGO (13 dígitos) NOMBRE_PRODUCTO
 * - Línea 2 (opcional): CANTIDAD UNIDAD PRECIO_UNITARIO X UNIDAD
 * - Precios totales aparecen en bloque separado después de todos los productos
 */
function parseProductosFromText(text: string): ProductoExtraido[] {
    logger.info('🔍 Iniciando parseo optimizado de productos');

    const textoLimpio = text
        .replace(/\r\n/g, '\n')
        .replace(/\s{3,}/g, ' ')
        .trim();

    const lineas = textoLimpio.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    logger.info(`📄 Total de líneas válidas: ${lineas.length}`);

    // PASO 1: Extraer todos los productos (con código de 13 dígitos)
    interface ProductoTemp {
        lineaIndex: number;
        codigo: string;
        nombre: string;
        cantidad: number;
        unidad: string;
        precioUnitario: number | null;
        precioTotal: number | null;
    }

    const productosTemp: ProductoTemp[] = [];

    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i];
        const matchCodigo = linea.match(/^(\d{13})\s+(.+)/);

        if (matchCodigo) {
            const codigo = matchCodigo[1];
            let nombre = matchCodigo[2]
                .replace(/\s+\d+[.,]\d{2}$/, '')
                .replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s0-9]/g, ' ')
                .replace(/\s{2,}/g, ' ')
                .trim()
                .substring(0, 40);

            if (nombre.length >= 3) {
                productosTemp.push({
                    lineaIndex: i,
                    codigo,
                    nombre,
                    cantidad: 1,
                    unidad: 'un',
                    precioUnitario: null,
                    precioTotal: null,
                });
            }
        }
    }

    logger.info(`📦 Productos detectados: ${productosTemp.length}`);

    // PASO 2: Para cada producto, buscar cantidad/precio unitario en la siguiente línea
    for (const producto of productosTemp) {
        const lineaProducto = producto.lineaIndex;

        if (lineaProducto + 1 < lineas.length) {
            const lineaSig = lineas[lineaProducto + 1];

            // No es otro producto
            if (!/^\d{13}/.test(lineaSig)) {
                // Buscar patrón de cantidad: "1.17kg 6.50 X kg" o "3 2.39 X UN" o "2 2.20 X UN"
                // Patrón flexible que maneja errores OCR como "ko" en lugar de "kg"
                const matchCantidad = lineaSig.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|ko|un)?\s+(\d+[.,]\d{2})\s+X\s+/i);

                if (matchCantidad) {
                    producto.cantidad = parseFloat(matchCantidad[1].replace(',', '.'));
                    producto.unidad = (matchCantidad[2] || 'un').toLowerCase().replace('ko', 'kg');
                    producto.precioUnitario = parseFloat(matchCantidad[3].replace(',', '.'));
                }
            }
        }
    }

    // PASO 3: Extraer bloque de precios (líneas que solo tienen números con 2 decimales)
    const preciosSueltos: number[] = [];

    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i];

        // Línea que solo tiene un precio (ej: "7.60", "5.70")
        if (/^\d+[.,]\d{2}$/.test(linea)) {
            const precio = parseFloat(linea.replace(',', '.'));

            // Ignorar precios muy grandes (probablemente son totales, descuentos, etc)
            if (precio < 100) {
                preciosSueltos.push(precio);
            }
        }
    }

    logger.info(`💰 Precios sueltos encontrados: ${preciosSueltos.length}`);

    // PASO 4: Asociar precios a productos en orden
    const productos: ProductoExtraido[] = [];
    let indicePrecio = 0;

    for (let i = 0; i < productosTemp.length; i++) {
        const producto = productosTemp[i];

        logger.debug(`\n${i + 1}. ${producto.nombre}`);
        logger.debug(`   Código: ${producto.codigo}`);
        logger.debug(`   Cantidad: ${producto.cantidad} ${producto.unidad}`);

        if (producto.precioUnitario) {
            logger.debug(`   Precio unitario: S/ ${producto.precioUnitario.toFixed(2)}`);
        }

        // Asignar precio del bloque de precios
        if (indicePrecio < preciosSueltos.length) {
            producto.precioTotal = preciosSueltos[indicePrecio];
            logger.debug(`   Precio total: S/ ${producto.precioTotal.toFixed(2)}`);
            indicePrecio++;
        } else {
            logger.warn(`   ⚠️ Sin precio total disponible para: ${producto.nombre}`);
        }

        // Solo agregar productos con precio total
        if (producto.precioTotal && producto.precioTotal > 0 && producto.precioTotal < 10000) {
            productos.push({
                nombre: producto.nombre,
                precio: producto.precioTotal, // Precio total
                precioUnitario: producto.precioUnitario || undefined, // Precio unitario (si existe)
                cantidad: producto.cantidad,
                unidad: producto.unidad,
                confianza: 0.95,
            });
            logger.debug(`   ✅ PRODUCTO AGREGADO`);
        } else {
            logger.warn(`   ⚠️ PRODUCTO NO AGREGADO (sin precio válido)`);
        }
    }

    logger.info(`\n🎯 Total productos extraídos: ${productos.length}`);

    if (productos.length === 0) {
        logger.warn('⚠️ No se encontraron productos válidos. Muestra de líneas:', {
            lineas: lineas.slice(0, 15),
        });
    } else {
        logger.info('📋 Resumen de productos extraídos:');
        productos.forEach((p, index) => {
            logger.info(`   ${index + 1}. ${p.nombre} - ${p.cantidad} ${p.unidad} - S/ ${p.precio.toFixed(2)}`);
        });
    }

    return productos;
}

export const VisionService = {
    extractText,
    parseProductosFromText,
};
