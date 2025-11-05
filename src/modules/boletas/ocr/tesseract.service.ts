import Tesseract from 'tesseract.js';
import { Jimp } from 'jimp';
import { env } from '@/config/env.js';
import logger from '@/config/logger.js';
import { DeepSeekClientService } from '@/lib/clients/deepseek.js';
import type { ProductoExtraido } from '../schemas.js';

/**
 * ✅ MEJORADO: Preprocesa la imagen AGRESIVAMENTE para OCR
 */
async function preprocessImage(buffer: Buffer): Promise<Buffer> {
    try {
        const image = await Jimp.read(buffer);

        // 1. Redimensionar si es muy pequeña (mínimo 1000px de ancho)
        if (image.bitmap.width < 1000) {
            image.resize({ w: 1000 }); // ✅ CORRECCIÓN: Nueva sintaxis de Jimp
        }

        // 2. Convertir a escala de grises
        image.greyscale();

        // 3. Aumentar contraste AGRESIVAMENTE
        image.contrast(0.8);

        // 4. Normalizar brillo
        image.normalize();

        // 5. Aplicar threshold (binarización) para texto blanco/negro puro
        image.threshold({ max: 128, replace: 255, autoGreyscale: false });

        // 6. Eliminar ruido con blur suave
        image.blur(1);

        logger.info('✅ Imagen preprocesada para OCR', {
            ancho: image.bitmap.width,
            alto: image.bitmap.height
        });

        // ✅ CORRECCIÓN: getBuffer() ahora acepta solo 1 argumento
        return await image.getBuffer('image/png');
    } catch (error) {
        logger.error('Error en preprocesamiento de imagen', { error });
        throw error;
    }
}

/**
 * ✅ MEJORADO: Enriquece el texto OCR corrigiendo errores comunes
 */
async function enrichOCRText(textoOCR: string): Promise<string> {
    try {
        logger.info('🔧 Enriqueciendo texto OCR con IA...');
        
        logger.debug('📝 Texto OCR ANTES de enriquecer:', { 
            texto: textoOCR.substring(0, 500)
        });

        const prompt = `Corrige errores comunes de OCR en este texto de recibo/boleta peruano.

Texto original:
${textoOCR}

Reglas estrictas:
1. Corrige letras confundidas (O→0, I→1, l→1, etc)
2. Separa correctamente líneas de productos
3. Mantén códigos de barras (13 dígitos)
4. NO cambies precios ni formato de moneda (S/)
5. NO inventes información
6. Solo corrige texto visible del OCR

Formato esperado por línea:
[CÓDIGO 13 DIGITOS] [NOMBRE PRODUCTO]     [PRECIO]

Responde SOLO con el texto corregido, sin explicaciones.`;

        const textoEnriquecido = await DeepSeekClientService.chat(prompt, 0.1);

        logger.info('✅ Texto OCR enriquecido correctamente');
        logger.debug('📝 Texto OCR DESPUÉS de enriquecer:', { 
            texto: textoEnriquecido.substring(0, 500)
        });
        
        return textoEnriquecido;
    } catch (error) {
        logger.warn('⚠️ Error enriqueciendo texto OCR, usando texto original', { error });
        return textoOCR;
    }
}

/**
 * ✅ MEJORADO: Extrae texto con configuración PSM optimizada
 */
async function extractText(imageBuffer: Buffer): Promise<string> {
    try {
        logger.info('Iniciando OCR con Tesseract');

        // Preprocesar imagen AGRESIVAMENTE
        const processedBuffer = await preprocessImage(imageBuffer);

        // ✅ CORRECCIÓN: Configuración correcta de Tesseract.js
        const result = await Tesseract.recognize(processedBuffer, env.ocr.language, {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    logger.debug(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                }
            },
        });

        const { data } = result;
        const text = data.text;
        const confidence = data.confidence;
        const linesCount = (data as any).lines?.length || 0;

        logger.info('OCR completado exitosamente', {
            confidence,
            lines: linesCount,
        });

        logger.debug('📝 Texto OCR extraído por Tesseract:', { 
            texto: text.substring(0, 800),
            longitudTotal: text.length
        });

        // ✅ SIEMPRE enriquecer con IA si confianza < 80
        if (confidence < 80 || linesCount === 0) {
            logger.warn('⚠️ Confianza del OCR baja o sin líneas, enriqueciendo texto...');
            const textoEnriquecido = await enrichOCRText(text);
            return textoEnriquecido;
        }

        return text;
    } catch (error) {
        logger.error('Error en extracción de texto OCR', { error });
        throw new Error('Error al procesar la imagen');
    }
}

/**
 * ✅ MEJORADO: Extrae productos con patrones más flexibles
 */
function parseProductosFromText(text: string): ProductoExtraido[] {
    const productos: ProductoExtraido[] = [];

    logger.debug('📝 Texto completo recibido para parseo:', { 
        texto: text,
        longitud: text.length,
        lineas: text.split('\n').length
    });

    // ✅ PATRÓN 1: Detectar líneas multi-línea de Tottus
    const patronTottusMultiLinea = /(\d{13})\s+([A-ZÁ-Ú0-9\s]+)\n(?:.*?)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s*V?/gm;

    // ✅ PATRÓN 2: Formato Tottus estándar con código
    const patronTottus = /(\d{13})\s+(.+?)\s{2,}(\d+\.?\d*)\s*$/gm;

    // ✅ PATRÓN 3: Formato con S/
    const patronEstandar = /^(.+?)\s+(?:S\/|s\/)\s*(\d+\.?\d*)/gm;

    // ✅ PATRÓN 4: Formato simple
    const patronSimple = /^([A-Z\s]{3,})\s{2,}(\d+\.?\d*)$/gm;

    let matchCount = 0;

    // Intentar patrón multi-línea primero
    let matchMulti;
    while ((matchMulti = patronTottusMultiLinea.exec(text)) !== null) {
        matchCount++;
        const codigo = matchMulti[1];
        const nombre = matchMulti[2].trim();
        const precioUnitario = parseFloat(matchMulti[3]);
        const precioTotal = parseFloat(matchMulti[4]);

        logger.debug(`🔍 Match patronTottusMultiLinea #${matchCount}:`, { 
            codigo, 
            nombre, 
            precioUnitario, 
            precioTotal 
        });

        if (
            nombre.length > 2 &&
            !nombre.toLowerCase().includes('total') &&
            !nombre.toLowerCase().includes('descuento') &&
            precioTotal > 0 &&
            precioTotal < 10000
        ) {
            productos.push({
                nombre,
                precio: precioTotal,
                cantidad: Math.round(precioTotal / precioUnitario),
                confianza: 0.95,
            });
            logger.debug(`✅ Producto agregado: ${nombre}`);
        }
    }

    if (productos.length > 0) {
        logger.info('✅ Productos extraídos con patrón multi-línea', { cantidad: productos.length });
        return productos;
    }

    // Intentar patrón Tottus estándar
    let matchTottus;
    while ((matchTottus = patronTottus.exec(text)) !== null) {
        matchCount++;
        const codigo = matchTottus[1];
        const nombre = matchTottus[2].trim();
        const precio = parseFloat(matchTottus[3]);

        logger.debug(`🔍 Match patronTottus #${matchCount}:`, { codigo, nombre, precio });

        if (
            nombre.length > 2 &&
            !nombre.toLowerCase().includes('total') &&
            !nombre.toLowerCase().includes('subtotal') &&
            !nombre.toLowerCase().includes('descuento') &&
            precio > 0 &&
            precio < 10000
        ) {
            productos.push({
                nombre,
                precio,
                cantidad: 1,
                confianza: 0.9,
            });
            logger.debug(`✅ Producto agregado: ${nombre}`);
        }
    }

    if (productos.length > 0) {
        logger.info('✅ Productos extraídos con patrón Tottus', { cantidad: productos.length });
        return productos;
    }

    // Intentar con patrón estándar S/
    let matchEstandar;
    while ((matchEstandar = patronEstandar.exec(text)) !== null) {
        matchCount++;
        const nombre = matchEstandar[1].trim();
        const precio = parseFloat(matchEstandar[2]);

        logger.debug(`🔍 Match patronEstandar #${matchCount}:`, { nombre, precio });

        if (
            nombre.length > 2 &&
            !nombre.toLowerCase().includes('total') &&
            !nombre.toLowerCase().includes('subtotal') &&
            precio > 0 &&
            precio < 10000
        ) {
            productos.push({
                nombre,
                precio,
                cantidad: 1,
                confianza: 0.8,
            });
            logger.debug(`✅ Producto agregado: ${nombre}`);
        }
    }

    if (productos.length > 0) {
        logger.info('✅ Productos extraídos con patrón estándar', { cantidad: productos.length });
        return productos;
    }

    // Último intento: patrón simple
    let matchSimple;
    while ((matchSimple = patronSimple.exec(text)) !== null) {
        matchCount++;
        const nombre = matchSimple[1].trim();
        const precio = parseFloat(matchSimple[2]);

        logger.debug(`🔍 Match patronSimple #${matchCount}:`, { nombre, precio });

        if (
            nombre.length > 3 &&
            !nombre.toLowerCase().includes('total') &&
            precio > 0 &&
            precio < 10000
        ) {
            productos.push({
                nombre,
                precio,
                cantidad: 1,
                confianza: 0.6,
            });
            logger.debug(`✅ Producto agregado: ${nombre}`);
        }
    }

    if (productos.length === 0) {
        logger.warn('⚠️ No se encontraron productos con ningún patrón', {
            totalMatches: matchCount,
            textPreview: text.substring(0, 500)
        });
    }

    logger.info('Productos extraídos del OCR', { cantidad: productos.length });

    return productos;
}

export const TesseractService = {
    extractText,
    parseProductosFromText,
};