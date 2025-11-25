import Tesseract from 'tesseract.js';
import { Jimp } from 'jimp';
import { env } from '@/config/env.js';
import logger from '@/config/logger.js';
import { DeepSeekClientService } from '@/lib/clients/deepseek.js';
import type { ProductoExtraido } from '../schemas.js';

const OCR_CONFIDENCE_THRESHOLD = 70;

// 🚀 OPTIMIZACIÓN #3: Preprocesamiento simplificado
async function preprocessImage(buffer: Buffer): Promise<Buffer> {
    try {
        const image = await Jimp.read(buffer);

        logger.info('📸 Imagen original:', {
            ancho: image.bitmap.width,
            alto: image.bitmap.height,
        });

        // Tesseract es robusto, no necesita tanto procesamiento previo

        // Resize si es necesario
        if (image.bitmap.width < 2000) {
            image.resize({ w: 2000 });
            logger.debug('🔧 Imagen redimensionada a 2000px');
        }

        // Transformaciones esenciales para mejorar OCR
        await image.greyscale();
        await image.normalize();
        await image.contrast(0.9);

        logger.info('✅ Imagen preprocesada (optimizado)');

        return await image.getBuffer('image/png');
    } catch (error) {
        logger.error('❌ Error preprocesando imagen', {
            error,
            mensaje: error instanceof Error ? error.message : 'Error desconocido',
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
}

// 🚀 OPTIMIZACIÓN #2: Single-pass OCR (solo PSM 4)
async function extractText(imageBuffer: Buffer): Promise<string> {
    try {
        logger.info('🚀 Iniciando OCR optimizado (single-pass)');

        const processedBuffer = await preprocessImage(imageBuffer);

        // PSM 4 (SINGLE_COLUMN) normalmente funciona mejor para boletas
        logger.debug('📊 Ejecutando OCR con PSM 4 (Columna única)...');
        const worker = await Tesseract.createWorker(env.ocr.language);
        await worker.setParameters({
            tessedit_pageseg_mode: Tesseract.PSM.SINGLE_COLUMN,
        });
        const result = await worker.recognize(processedBuffer);
        await worker.terminate();

        logger.info('✅ OCR completado:', {
            confianza: Math.round(result.data.confidence),
            lineas: result.data.text.split('\n').length,
            caracteres: result.data.text.length,
        });

        const confianzaGlobal = result.data.confidence;

        if (confianzaGlobal < OCR_CONFIDENCE_THRESHOLD) {
            logger.warn(`⚠️ Confianza baja (${Math.round(confianzaGlobal)}%), activando corrección con IA`, {
                confianza: Math.round(confianzaGlobal),
            });

            const prompt = `Eres un experto en corrección de texto OCR de boletas peruanas de supermercados (Tottus, Wong, Metro, Plaza Vea).

Texto OCR (contiene errores y basura):
${result.data.text}

Reglas ESTRICTAS:
1. Corrige errores de OCR (ej: "T0TTUS" → "TOTTUS", "R0JA" → "ROJA", "Ma\nTONI CA" → "MANZANA ROJA")
2. Elimina basura al inicio (ej: "Les TOTTUS" → "TOTTUS", "Iva. ULIO5[146," → eliminar)
3. Mantén códigos de barras de 13 dígitos intactos
4. Mantén precios con formato XX.XX o X.XX
5. Une líneas de nombres partidos en UNA sola línea
6. Separa productos diferentes con línea vacía
7. NO inventes productos ni precios

Formato esperado:
\`\`\`
TOTTUS

2500012000007 MANZANA ROJA
1.17kg 6.50 X kg 7.61

2000422769255 POP CORN
3 2.39 X UN 7.17
\`\`\`

Responde SOLO con el texto corregido:`;

            try {
                const textoCorregido = await DeepSeekClientService.chat(prompt, 0.1);

                logger.info('✅ Texto corregido con IA');
                logger.debug('📝 Texto corregido (primeras 500 chars):', {
                    texto: textoCorregido.substring(0, 500),
                });

                return textoCorregido;
            } catch (error) {
                logger.warn('⚠️ Error corrigiendo con IA, usando texto original', { error });
                return result.data.text;
            }
        }

        return result.data.text;
    } catch (error) {
        logger.error('❌ Error en OCR', { error });
        throw new Error('Error al procesar la imagen con OCR');
    }
}

function parseProductosFromText(text: string): ProductoExtraido[] {
    const productos: ProductoExtraido[] = [];

    logger.info('🔍 Iniciando parseo DINÁMICO de productos');

    const textoLimpio = text
        .replace(/\r\n/g, '\n')
        .replace(/\s{3,}/g, ' ')
        .trim();

    const lineas = textoLimpio.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    logger.info(`📄 Total de líneas válidas: ${lineas.length}`);

    let i = 0;
    while (i < lineas.length) {
        const linea = lineas[i];

        const matchCodigo = linea.match(/^(\d{13})/);

        if (matchCodigo) {
            const codigo = matchCodigo[1];
            logger.debug(`📦 Código detectado: ${codigo}`);

            let nombre = linea.replace(codigo, '').trim();
            let lineaActual = i + 1;
            let lineasAgregadas = 0;
            while (lineaActual < lineas.length && lineasAgregadas < 2) {
                const siguienteLinea = lineas[lineaActual];

                const tieneNumeros = /\d/.test(siguienteLinea);

                if (tieneNumeros) {
                    break;
                }

                if (siguienteLinea.length > 2 && /^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/.test(siguienteLinea)) {
                    nombre += ' ' + siguienteLinea;
                    lineaActual++;
                    lineasAgregadas++;
                } else {
                    break;
                }
            }

            nombre = nombre
                .replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s]/g, ' ')
                .replace(/\s{2,}/g, ' ')
                .trim()
                .substring(0, 40);

            if (nombre.length < 3) {
                logger.warn(`⚠️ Nombre muy corto: "${nombre}"`);
                i++;
                continue;
            }

            let precio: number | null = null;
            let cantidad: number = 1;
            let unidad: string = 'kg';
            let lineasExploradas = 0;

            while (lineaActual < lineas.length && lineasExploradas < 3) {
                const lineaPrecio = lineas[lineaActual];

                const matchCantidad = lineaPrecio.match(/(\d+)[.,](\d+)\s*(kg|un|l|ml|g)/i);
                if (matchCantidad) {
                    const entero = matchCantidad[1];
                    const decimal = matchCantidad[2];
                    cantidad = parseFloat(`${entero}.${decimal}`);
                    unidad = matchCantidad[3].toLowerCase();
                    logger.debug(`📏 Cantidad detectada: ${cantidad} ${unidad}`);
                }

                const preciosEncontrados = lineaPrecio.match(/\d+[.,]\d{2}/g);
                if (preciosEncontrados && preciosEncontrados.length > 0) {
                    const precioStr = preciosEncontrados[preciosEncontrados.length - 1];
                    precio = parseFloat(precioStr.replace(',', '.'));
                    logger.debug(`💰 Precio detectado: ${precio}`);
                    break;
                }

                lineaActual++;
                lineasExploradas++;
            }

            if (precio && precio > 0 && precio < 10000) {
                productos.push({
                    nombre,
                    precio,
                    cantidad,
                    unidad,
                    confianza: 0.85,
                });
                logger.debug(`✅ Producto agregado: "${nombre}" ($${precio} x${cantidad} ${unidad})`);
            } else {
                logger.warn(`⚠️ Precio inválido para: "${nombre}" (precio: ${precio})`);
            }

            i = lineaActual;
            continue;
        }

        i++;
    }

    logger.info(`🎯 Total productos extraídos: ${productos.length}`);

    if (productos.length === 0) {
        logger.warn('⚠️ No se encontraron productos válidos. Muestra de líneas:', {
            lineas: lineas.slice(0, 10),
        });
    }

    return productos;
}

export const TesseractService = {
    extractText,
    parseProductosFromText,
};