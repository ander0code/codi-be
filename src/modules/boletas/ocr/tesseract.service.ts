import Tesseract from 'tesseract.js';
import { Jimp } from 'jimp';
import { env } from '@/config/env.js';
import logger from '@/config/logger.js';
import { DeepSeekClientService } from '@/lib/clients/deepseek.js';
import type { ProductoExtraido } from '../schemas.js';

// ✅ Umbral de confianza OCR configurable (antes hardcodeado en 70)
const OCR_CONFIDENCE_THRESHOLD = 70; // Ajustar según necesidad por supermercado

/**
 * Analiza calidad de imagen (brillo promedio)
 */
function analyzeImageQuality(image: typeof Jimp.prototype): {
    brilloPromedio: number;
    esOscura: boolean;
    esMuyClara: boolean;
} {
    let totalBrillo = 0;
    let pixelCount = 0;

    // Tipar el callback explícitamente
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (
        this: typeof Jimp.prototype,
        x: number,
        y: number,
        idx: number
    ) {
        const red = this.bitmap.data[idx + 0];
        const green = this.bitmap.data[idx + 1];
        const blue = this.bitmap.data[idx + 2];
        const brillo = (red + green + blue) / 3;
        totalBrillo += brillo;
        pixelCount++;
    });

    const brilloPromedio = totalBrillo / pixelCount;

    return {
        brilloPromedio,
        esOscura: brilloPromedio < 100,
        esMuyClara: brilloPromedio > 200,
    };
}

/**
 * Preprocesamiento adaptativo según calidad de imagen
 */
async function preprocessImage(buffer: Buffer): Promise<Buffer> {
    try {
        const image = await Jimp.read(buffer);

        logger.info('📸 Imagen original:', {
            ancho: image.bitmap.width,
            alto: image.bitmap.height,
        });

        //  Analizar calidad de imagen
        const calidad = analyzeImageQuality(image);
        logger.info('📊 Calidad detectada:', {
            brilloPromedio: Math.round(calidad.brilloPromedio),
            esOscura: calidad.esOscura,
            esMuyClara: calidad.esMuyClara,
        });

        //  1. Redimensionar (siempre)
        if (image.bitmap.width < 2000) {
            image.resize({ w: 2000 });
            logger.debug('🔧 Imagen redimensionada a 2000px');
        }

        // ✅ 2. Escala de grises (siempre)
        await image.greyscale();


        //  3. Ajuste de brillo ADAPTATIVO
        if (calidad.esOscura) {
            await image.brightness(0.3);
            await image.contrast(1.0);
            logger.debug('🔧 Corrección para imagen oscura aplicada');
        } else if (calidad.esMuyClara) {
            await image.brightness(-0.2);
            await image.contrast(0.7);
            logger.debug('🔧 Corrección para imagen muy clara aplicada');
        } else {
            await image.contrast(0.9);
            logger.debug('🔧 Corrección estándar aplicada');
        }


        // ✅ 4. Normalizar (siempre)
        await image.normalize();

        // ✅ 5. Threshold ADAPTATIVO (SINTAXIS CORREGIDA)
        const thresholdValue = calidad.esOscura ? 120 : 140;

        // ✅ CORRECCIÓN: Tipar explícitamente el callback
        await image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (
            this: typeof Jimp.prototype, // ✅ Tipo explícito para 'this'
            x: number,
            y: number,
            idx: number
        ) {
            const gray = this.bitmap.data[idx]; // Ya está en escala de grises

            if (gray > thresholdValue) {
                this.bitmap.data[idx] = 255;     // R
                this.bitmap.data[idx + 1] = 255; // G
                this.bitmap.data[idx + 2] = 255; // B
            } else {
                this.bitmap.data[idx] = 0;       // R
                this.bitmap.data[idx + 1] = 0;   // G
                this.bitmap.data[idx + 2] = 0;   // B
            }
        });

        logger.debug(`🔧 Threshold aplicado: ${thresholdValue}`);

        // ✅ 6. Blur suave (siempre)
        await image.blur(1); // ✅ CORRECCIÓN: blur(0.5) no existe, usar blur(1)

        // ✅ 7. Sharpen (solo si NO es oscura) - SINTAXIS CORREGIDA
        if (!calidad.esOscura) {
            await image.convolute({
                kernel: [
                    [0, -1, 0],
                    [-1, 5, -1],
                    [0, -1, 0],
                ],
            }); // ✅ CORRECCIÓN: Nueva sintaxis de convolute
            logger.debug('🔧 Sharpen aplicado');
        } else {
            logger.debug('⏭️ Sharpen omitido (imagen oscura)');
        }

        logger.info('✅ Imagen preprocesada adaptativamente');

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

/**
 * Corrige SOLO palabras con baja confianza usando IA
 */
async function corregirPalabrasProblematicas(
    textoCompleto: string,
    palabrasProblematicas: Array<{ texto: string; confianza: number }>
): Promise<string> {
    if (palabrasProblematicas.length === 0) {
        return textoCompleto;
    }

    const prompt = `Eres un experto en corrección de texto OCR de boletas peruanas.

Texto OCR (contiene errores):
${textoCompleto}

Palabras sospechosas detectadas:
${palabrasProblematicas.map((p) => `- "${p.texto}" (confianza: ${p.confianza}%)`).join('\n')}

Reglas ESTRICTAS:
1. Corrige SOLO errores evidentes de OCR (ej: "T0TTUS" → "TOTTUS", "R0JA" → "ROJA")
2. Mantén códigos de barras de 13 dígitos intactos
3. Mantén precios con formato XX.XX o X.XX
4. Une líneas de nombres partidos (ej: "Ma\nTONI CA" → "MANZANA ROJA")
5. Elimina basura al inicio (ej: "Les TOTTUS" → "TOTTUS")
6. NO inventes productos ni precios

Responde SOLO con el texto corregido, sin explicaciones:`;

    try {
        const textoCorregido = await DeepSeekClientService.chat(prompt, 0.1);

        logger.info('✅ Texto corregido con IA');
        logger.debug('📝 Texto corregido (primeras 500 chars):', {
            texto: textoCorregido.substring(0, 500),
        });

        return textoCorregido;
    } catch (error) {
        logger.warn('⚠️ Error corrigiendo con IA, usando texto original', { error });
        return textoCompleto;
    }
}

/**
 * OCR Multi-Pass con análisis de confianza por palabra
 */
async function extractText(imageBuffer: Buffer): Promise<string> {
    try {
        logger.info('🚀 Iniciando OCR Multi-Pass PROFESIONAL');

        const processedBuffer = await preprocessImage(imageBuffer);

        // PASADA 1: PSM 6 (SINGLE_BLOCK - boletas estándar)
        logger.debug('📊 Ejecutando Pasada 1 (PSM 6 - Bloque único)...');
        const worker1 = await Tesseract.createWorker(env.ocr.language);
        await worker1.setParameters({
            tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
        });
        const result1 = await worker1.recognize(processedBuffer);
        await worker1.terminate();

        // PASADA 2: PSM 4 (SINGLE_COLUMN - boletas largas)
        logger.debug('📊 Ejecutando Pasada 2 (PSM 4 - Columna única)...');
        const worker2 = await Tesseract.createWorker(env.ocr.language);
        await worker2.setParameters({
            tessedit_pageseg_mode: Tesseract.PSM.SINGLE_COLUMN,
        });
        const result2 = await worker2.recognize(processedBuffer);
        await worker2.terminate();

        logger.info(' OCR Multi-Pass completado:', {
            confianzaPSM6: Math.round(result1.data.confidence),
            confianzaPSM4: Math.round(result2.data.confidence),
            lineasPSM6: result1.data.text.split('\n').length,
            lineasPSM4: result2.data.text.split('\n').length,
        });

        // Elegir mejor resultado basado en confianza
        const mejorResultado =
            result1.data.confidence > result2.data.confidence ? result1 : result2;
        const psmUsado =
            mejorResultado === result1 ? 'PSM 6 (SINGLE_BLOCK)' : 'PSM 4 (SINGLE_COLUMN)';

        logger.info(`📊 Usando resultado de ${psmUsado}`, {
            confianza: Math.round(mejorResultado.data.confidence),
            caracteres: mejorResultado.data.text.length,
        });

        // ✅ Usar IA si confianza < umbral configurable
        const confianzaGlobal = mejorResultado.data.confidence;

        if (confianzaGlobal < OCR_CONFIDENCE_THRESHOLD) {
            logger.warn(`⚠️ Confianza baja (${Math.round(confianzaGlobal)}%), activando corrección con IA`, {
                confianza: Math.round(confianzaGlobal),
            });

            // ✅ SIMPLIFICADO: Corregir directamente sin extraer palabras individuales
            const prompt = `Eres un experto en corrección de texto OCR de boletas peruanas de supermercados (Tottus, Wong, Metro, Plaza Vea).

Texto OCR (contiene errores y basura):
${mejorResultado.data.text}

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
                return mejorResultado.data.text;
            }
        }

        return mejorResultado.data.text;
    } catch (error) {
        logger.error('❌ Error en OCR Multi-Pass', { error });
        throw new Error('Error al procesar la imagen con OCR');
    }
}

/**
 * Parseo con regex mejorados (named groups + validación)
 */
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

        // ✅ ETAPA 1: Detectar código de barras (13 dígitos al inicio de línea)
        const matchCodigo = linea.match(/^(\d{13})/);

        if (matchCodigo) {
            const codigo = matchCodigo[1];
            logger.debug(`📦 Código detectado: ${codigo}`);

            // ✅ ETAPA 2: Extraer nombre del producto (LÍMITE ESTRICTO: máximo 2 líneas SIN números)
            let nombre = linea.replace(codigo, '').trim();
            let lineaActual = i + 1;
            let lineasAgregadas = 0;

            // ✅ LÍMITE REDUCIDO: Máximo 2 líneas Y sin números
            while (lineaActual < lineas.length && lineasAgregadas < 2) {
                const siguienteLinea = lineas[lineaActual];

                // ✅ STOP si encuentra CUALQUIER número (precio, cantidad, o código siguiente)
                const tieneNumeros = /\d/.test(siguienteLinea);

                if (tieneNumeros) {
                    break; // ✅ STOP inmediato
                }

                // ✅ Agregar SOLO si es texto puro (sin números ni caracteres raros)
                if (siguienteLinea.length > 2 && /^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/.test(siguienteLinea)) {
                    nombre += ' ' + siguienteLinea;
                    lineaActual++;
                    lineasAgregadas++;
                } else {
                    break;
                }
            }

            // ✅ Limpiar nombre (eliminar TODO excepto letras y espacios)
            nombre = nombre
                .replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s]/g, ' ')
                .replace(/\s{2,}/g, ' ')
                .trim()
                .substring(0, 40); // ✅ Reducido de 50 a 40

            if (nombre.length < 3) {
                logger.warn(`⚠️ Nombre muy corto: "${nombre}"`);
                i++;
                continue;
            }

            // ✅ ETAPA 3: Buscar precio y cantidad (hasta 3 líneas adelante)
            let precio: number | null = null;
            let cantidad: number = 1;
            let lineasExploradas = 0;

            while (lineaActual < lineas.length && lineasExploradas < 3) {
                const lineaPrecio = lineas[lineaActual];

                // ✅ Buscar cantidad
                const matchCantidad = lineaPrecio.match(/(\d+)[.,](\d+)\s*(kg|un|l|g)/i);
                if (matchCantidad) {
                    const entero = matchCantidad[1];
                    const decimal = matchCantidad[2];
                    cantidad = parseFloat(`${entero}.${decimal}`);
                    logger.debug(`📏 Cantidad detectada: ${cantidad}`);
                }

                // ✅ Buscar precio (último número con 2 decimales en la línea)
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

            // ✅ ETAPA 4: Validar y agregar producto
            if (precio && precio > 0 && precio < 10000) {
                productos.push({
                    nombre,
                    precio,
                    cantidad,
                    confianza: 0.85,
                });
                logger.debug(`✅ Producto agregado: "${nombre}" ($${precio} x${cantidad})`);
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