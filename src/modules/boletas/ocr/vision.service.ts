import { googleVisionClient } from '@/lib/clients/google-vision.js';
import logger from '@/config/logger.js';
import { DeepSeekClientService } from '@/lib/clients/deepseek.js';
import type { ProductoExtraido } from '../schemas.js';
import sharp from 'sharp';

/**
 * Valida la calidad del OCR basándose en métricas de Google Vision
 */
function validarCalidadOCR(fullTextAnnotation: any): {
    esValida: boolean;
    razon?: string;
    confianza?: number;
    numProductos?: number
} {
    if (!fullTextAnnotation || !fullTextAnnotation.text || fullTextAnnotation.text.trim().length < 50) {
        return {
            esValida: false,
            razon: 'No se detectó suficiente texto en la imagen'
        };
    }

    const confianza = fullTextAnnotation.pages?.[0]?.confidence;
    if (confianza !== undefined && confianza < 0.70) {
        return {
            esValida: false,
            razon: 'La calidad de la imagen es muy baja para procesamiento confiable',
            confianza: Math.round(confianza * 100)
        };
    }

    const numBloques = fullTextAnnotation.pages?.[0]?.blocks?.length || 0;
    if (numBloques < 10) {
        return {
            esValida: false,
            razon: 'La imagen está muy borrosa o tiene muy poco contenido legible',
            confianza: confianza ? Math.round(confianza * 100) : undefined
        };
    }

    const texto = fullTextAnnotation.text;
    const codigosBarras = texto.match(/\d{13}/g);
    const numProductos = codigosBarras ? codigosBarras.length : 0;

    if (numProductos === 0) {
        return {
            esValida: false,
            razon: 'No se detectaron códigos de barras. La imagen puede estar muy borrosa o no es una boleta válida',
            confianza: confianza ? Math.round(confianza * 100) : undefined
        };
    }

    if (numProductos < 2) {
        return {
            esValida: false,
            razon: 'Se detectó muy poco contenido. Por favor, asegúrate de capturar toda la boleta',
            confianza: confianza ? Math.round(confianza * 100) : undefined,
            numProductos
        };
    }

    return {
        esValida: true,
        confianza: confianza ? Math.round(confianza * 100) : undefined,
        numProductos
    };
}

/**
 * Preprocesa la imagen para mejorar la calidad del OCR (OPTIMIZADO)
 */
async function preprocesarImagen(imageBuffer: Buffer): Promise<Buffer> {
    try {
        const processedBuffer = await sharp(imageBuffer)
            .resize({
                width: 2000,
                fit: 'inside',
                withoutEnlargement: true,
                kernel: 'mitchell'
            })
            .grayscale()
            .normalize()
            .sharpen({
                sigma: 1.2,
                m1: 1.0,
                m2: 0.5
            })
            .toBuffer();

        return processedBuffer;
    } catch (error) {
        logger.warn('⚠️ Error en preprocesamiento, usando imagen original');
        return imageBuffer;
    }
}

interface TextBlock {
    text: string;
    x: number;
    y: number;
}

async function extractText(imageBuffer: Buffer): Promise<string> {
    try {
        logger.info('🚀 Iniciando OCR con Google Cloud Vision API');

        // Preprocesar imagen para mejorar calidad
        const processedBuffer = await preprocesarImagen(imageBuffer);

        // Obtener resultado completo de Google Vision (con bounding boxes)
        const client = googleVisionClient.getClient();
        const [result] = await client.documentTextDetection({
            image: { content: processedBuffer },
        });

        const fullTextAnnotation = result.fullTextAnnotation;

        if (!fullTextAnnotation?.pages?.[0]) {
            throw new Error('No se pudo extraer texto de la imagen');
        }

        // Validar calidad del OCR
        const validacion = validarCalidadOCR(fullTextAnnotation);

        if (!validacion.esValida) {
            logger.error('❌ Calidad de imagen insuficiente', {
                razon: validacion.razon,
                confianza: validacion.confianza
            });

            throw new Error(JSON.stringify({
                message: validacion.razon,
                confianza: validacion.confianza,
                recomendaciones: [
                    'Asegúrate de que la boleta esté bien iluminada',
                    'Mantén la boleta completamente plana (sin arrugas)',
                    'Toma la foto perpendicular a la boleta (no en ángulo)',
                    'Asegúrate de que todo el texto esté enfocado',
                    'Usa el flash si es necesario',
                    'Evita sombras sobre la boleta'
                ]
            }));
        }

        logger.info('✅ Calidad de imagen aceptable', {
            confianza: validacion.confianza,
            numProductos: validacion.numProductos
        });

        // Extraer bloques de texto con bounding boxes
        const textBlocks: TextBlock[] = [];
        const page = fullTextAnnotation.pages[0];

        if (page.blocks) {
            for (const block of page.blocks) {
                if (!block.paragraphs) continue;

                for (const paragraph of block.paragraphs) {
                    if (!paragraph.words) continue;

                    const paragraphText = paragraph.words
                        .map((word: any) =>
                            word.symbols?.map((symbol: any) => symbol.text).join('') || ''
                        )
                        .join(' ');

                    if (paragraph.boundingBox?.vertices) {
                        const vertices = paragraph.boundingBox.vertices;
                        const x = vertices.reduce((sum: number, v: any) => sum + (v.x || 0), 0) / vertices.length;
                        const y = vertices.reduce((sum: number, v: any) => sum + (v.y || 0), 0) / vertices.length;

                        if (paragraphText.trim()) {
                            textBlocks.push({ text: paragraphText.trim(), x, y });
                        }
                    }
                }
            }
        }

        // Ordenar bloques por posición (Y primero, luego X)
        const TOLERANCE_Y = 10;
        textBlocks.sort((a, b) => {
            if (Math.abs(a.y - b.y) < TOLERANCE_Y) {
                return a.x - b.x;
            }
            return a.y - b.y;
        });

        // Agrupar en líneas
        const lineas: string[] = [];
        let lineaActual = '';
        let yActual = textBlocks[0]?.y || 0;

        for (const block of textBlocks) {
            if (Math.abs(block.y - yActual) < TOLERANCE_Y) {
                lineaActual += (lineaActual ? ' ' : '') + block.text;
            } else {
                if (lineaActual) lineas.push(lineaActual);
                lineaActual = block.text;
                yActual = block.y;
            }
        }
        if (lineaActual) lineas.push(lineaActual);

        const textoOrdenado = lineas.join('\n');

        logger.info('✅ OCR completado con bounding boxes:', {
            lineas: lineas.length,
            caracteres: textoOrdenado.length,
        });

        return textoOrdenado;
    } catch (error) {
        logger.error('❌ Error en OCR con Google Vision', { error });
        throw error;
    }
}

/**
 * Parsea productos del texto extraído de boletas
 * 
 * Algoritmo mejorado con bounding boxes:
 * 1. Detecta productos por código de 13 dígitos
 * 2. Busca cantidades en líneas cercanas (evitando compartir líneas)
 * 3. Extrae precios en 3 formatos diferentes
 * 4. Asigna precios por proximidad y cálculo matemático
 */
function parseProductosFromText(text: string): ProductoExtraido[] {
    logger.info('🔍 Iniciando parseo optimizado de productos');

    const textoLimpio = text
        .replace(/\r\n/g, '\n')
        .replace(/\s{3,}/g, ' ')
        .trim();

    const lineas = textoLimpio.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    logger.info(`📄 Total de líneas válidas: ${lineas.length}`);

    // PASO 1: Detectar productos
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

    // PASO 2: Buscar cantidades (evitando líneas compartidas)
    const lineasCantidadUsadas = new Set<number>();

    for (const producto of productosTemp) {
        const lineaProducto = lineas[producto.lineaIndex];

        // Intentar extraer de la misma línea del producto
        const matchEnLinea = lineaProducto.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|ko|un)\s+(\d+[.,]\d{2})\s+X\s+/i);

        if (matchEnLinea) {
            producto.cantidad = parseFloat(matchEnLinea[1].replace(',', '.'));
            producto.unidad = (matchEnLinea[2] || 'un').toLowerCase().replace('ko', 'kg');
            producto.precioUnitario = parseFloat(matchEnLinea[3].replace(',', '.'));
            lineasCantidadUsadas.add(producto.lineaIndex);
            continue;
        }

        // Buscar en las siguientes 2 líneas
        for (let offset = 1; offset <= 2; offset++) {
            const nextLineIndex = producto.lineaIndex + offset;
            if (nextLineIndex >= lineas.length) break;
            if (lineasCantidadUsadas.has(nextLineIndex)) continue;

            const nextLinea = lineas[nextLineIndex];
            const matchCantidad = nextLinea.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|ko|un)?\s+(\d+[.,]\d{2})\s+X\s+/i);

            if (matchCantidad) {
                producto.cantidad = parseFloat(matchCantidad[1].replace(',', '.'));
                producto.unidad = (matchCantidad[2] || 'un').toLowerCase().replace('ko', 'kg');
                producto.precioUnitario = parseFloat(matchCantidad[3].replace(',', '.'));
                lineasCantidadUsadas.add(nextLineIndex);
                break;
            }
        }
    }

    // PASO 3: Extraer precios (3 formatos)
    const preciosSueltos: number[] = [];
    const preciosConLinea: Map<number, number> = new Map();
    let dentroDeProductos = false;

    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i];

        if (/^\d{13}/.test(linea)) {
            dentroDeProductos = true;
        }

        if (dentroDeProductos) {
            // Formato 1: Precio suelto
            const matchPrecioSuelto = linea.match(/^(\d+[.,]\d{2})$/);

            // Formato 2: Precio en línea de producto
            const matchPrecioEnProducto = linea.match(/^\d{13}\s+.+\s+(\d+[.,]\d{2})$/);

            // Formato 3: Precio en línea de cantidad (más flexible)
            // Ejemplos: "2.256kg 1.19 X kg 2.68" o "3 2.39 X UN 7.17"
            const matchPrecioEnCantidad = linea.match(/\d+(?:[.,]\d+)?(?:kg|g|ml|l)?\s+\d+[.,]\d{2}\s+X\s+(?:UN|KG|G|ML|L)\s+(\d+[.,]\d{2})$/i);

            if (matchPrecioSuelto) {
                const precio = parseFloat(matchPrecioSuelto[1].replace(',', '.'));
                if (precio >= 0.10 && precio < 1000) {
                    preciosSueltos.push(precio);
                    preciosConLinea.set(i, precio);
                }
            } else if (matchPrecioEnProducto) {
                const precio = parseFloat(matchPrecioEnProducto[1].replace(',', '.'));
                if (precio >= 0.10 && precio < 1000) {
                    preciosSueltos.push(precio);
                    preciosConLinea.set(i, precio);
                }
            } else if (matchPrecioEnCantidad) {
                const precio = parseFloat(matchPrecioEnCantidad[1].replace(',', '.'));
                if (precio >= 0.10 && precio < 1000) {
                    preciosSueltos.push(precio);
                    preciosConLinea.set(i, precio);
                }
            }

            if (linea.includes('Descuento') || linea.includes('TOTAL') || linea.includes('SUB TOTAL')) {
                break;
            }
        }
    }

    logger.info(`💰 Precios extraídos: ${preciosSueltos.length}`);

    // PASO 4: Asignar precios por proximidad
    const preciosUsados = new Array(preciosSueltos.length).fill(false);
    const preciosArray = Array.from(preciosConLinea.entries());

    logger.debug('🔍 Iniciando asignación de precios...');
    logger.debug(`Precios disponibles: ${preciosSueltos.join(', ')}`);

    // Fase 1: Asignar precios calculados
    logger.debug('📊 Fase 1: Asignando precios calculados...');
    for (const producto of productosTemp) {
        if (producto.precioUnitario) {
            const precioEsperado = producto.cantidad * producto.precioUnitario;
            let mejorMatch = -1;
            let menorDiferencia = Infinity;

            logger.debug(`  Producto: ${producto.nombre}`, {
                precioEsperado: precioEsperado.toFixed(2),
                cantidad: producto.cantidad,
                precioUnitario: producto.precioUnitario
            });

            for (let j = 0; j < preciosSueltos.length; j++) {
                if (preciosUsados[j]) continue;
                const diferencia = Math.abs(preciosSueltos[j] - precioEsperado);

                logger.debug(`    Comparando con precio[${j}] = ${preciosSueltos[j]}, diferencia = ${diferencia.toFixed(3)}`);

                if (diferencia < menorDiferencia && diferencia < 0.05) {
                    menorDiferencia = diferencia;
                    mejorMatch = j;
                    logger.debug(`      ✅ Mejor match actualizado: índice ${j}`);
                }
            }

            if (mejorMatch !== -1) {
                producto.precioTotal = preciosSueltos[mejorMatch];
                preciosUsados[mejorMatch] = true;
                logger.debug(`  ✅ Asignado: ${preciosSueltos[mejorMatch]}`);
            } else {
                logger.debug(`  ⚠️ No se encontró precio calculado (diferencia > 0.05)`);
            }
        }
    }

    // Fase 2: Asignar precios restantes por proximidad
    logger.debug('📍 Fase 2: Asignando precios por proximidad...');
    for (const producto of productosTemp) {
        if (producto.precioTotal === null) {
            let mejorMatch = -1;
            let menorDistancia = Infinity;

            logger.debug(`  Producto sin precio: ${producto.nombre} (línea ${producto.lineaIndex})`);

            for (let j = 0; j < preciosArray.length; j++) {
                if (preciosUsados[j]) continue;
                const [lineaPrecio, precio] = preciosArray[j];
                const distancia = Math.abs(lineaPrecio - producto.lineaIndex);

                logger.debug(`    Precio[${j}] = ${precio} en línea ${lineaPrecio}, distancia = ${distancia}`);

                if (lineaPrecio >= producto.lineaIndex && distancia <= 5 && distancia < menorDistancia) {
                    menorDistancia = distancia;
                    mejorMatch = j;
                    logger.debug(`      ✅ Mejor match por proximidad: línea ${lineaPrecio}`);
                }
            }

            if (mejorMatch !== -1) {
                producto.precioTotal = preciosSueltos[mejorMatch];
                preciosUsados[mejorMatch] = true;
                logger.debug(`  ✅ Asignado por proximidad: ${preciosSueltos[mejorMatch]}`);
            } else {
                logger.debug(`  ⚠️ No se encontró precio por proximidad`);
            }
        }
    }

    // Convertir a formato final
    const productos: ProductoExtraido[] = [];

    for (const producto of productosTemp) {
        // 🔍 DEBUG: Log todos los productos antes de filtrar
        logger.debug(`🔍 Producto candidato: ${producto.nombre}`, {
            precioTotal: producto.precioTotal,
            precioUnitario: producto.precioUnitario,
            cantidad: producto.cantidad,
            unidad: producto.unidad
        });

        if (producto.precioTotal && producto.precioTotal > 0 && producto.precioTotal < 10000) {
            productos.push({
                nombre: producto.nombre,
                precio: producto.precioTotal,
                precioUnitario: producto.precioUnitario || undefined,
                cantidad: producto.cantidad,
                unidad: producto.unidad,
                confianza: 0.95,
            });
        } else {
            logger.warn(`⚠️ Producto filtrado (sin precio válido): ${producto.nombre}`, {
                precioTotal: producto.precioTotal,
                lineaIndex: producto.lineaIndex
            });
        }
    }

    logger.info(`🎯 Total productos extraídos: ${productos.length}`);

    if (productos.length > 0) {
        logger.info('📋 Resumen de productos extraídos:');
        productos.forEach((p, index) => {
            logger.info(`   ${index + 1}. ${p.nombre} - ${p.cantidad} ${p.unidad} - S/ ${p.precio.toFixed(2)}`);
        });
    }

    return productos;
}

/**
 * Extrae identificadores únicos de la boleta para detección de duplicados
 */
function extraerIdentificadorBoleta(text: string): {
    serie: string | null;
    correlativo: string | null;
} {
    const lineas = text.split('\n');

    let serie: string | null = null;
    let correlativo: string | null = null;

    for (const linea of lineas) {
        // SERIE (ej: "SERIE : BV12")
        if (!serie) {
            const match = linea.match(/SERIE\s*:\s*([A-Z0-9]+)/i);
            if (match) {
                serie = match[1].trim();
            }
        }

        // CORRELATIVO (ej: "CORRELATIVO : 00035036")
        if (!correlativo) {
            const match = linea.match(/CORRELATIVO\s*:\s*(\d+)/i);
            if (match) {
                correlativo = match[1].trim();
            }
        }

        // Si ya tenemos ambos, salir del loop
        if (serie && correlativo) break;
    }

    logger.debug('📋 Identificadores extraídos', { serie, correlativo });

    return { serie, correlativo };
}

export const VisionService = {
    extractText,
    parseProductosFromText,
    extraerIdentificadorBoleta,
};
