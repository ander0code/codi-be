import Tesseract from 'tesseract.js';
import { Jimp } from 'jimp';
import { env } from '@/config/env.js';
import logger from '@/config/logger.js';
import type { ProductoExtraido } from '../schemas.js';

/**
 * Preprocesa la imagen para mejorar la precisión del OCR
 */
async function preprocessImage(buffer: Buffer): Promise<Buffer> {
    try {
        const image = await Jimp.read(buffer);
        
        // Mejorar contraste y convertir a escala de grises
        image
            .greyscale()
            .contrast(0.5)
            .normalize();
        
        // ✅ CORRECCIÓN 1: Usar getBuffer() en lugar de getBufferAsync()
        return await image.getBuffer('image/png');
    } catch (error) {
        logger.error('Error en preprocesamiento de imagen', { error });
        throw error;
    }
}

/**
 * Extrae texto de una imagen usando Tesseract
 */
async function extractText(imageBuffer: Buffer): Promise<string> {
    try {
        logger.info('Iniciando OCR con Tesseract');
        
        // Preprocesar imagen
        const processedBuffer = await preprocessImage(imageBuffer);
        
        // Ejecutar OCR
        const result = await Tesseract.recognize(
            processedBuffer,
            env.ocr.language,
            {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        logger.debug(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                    }
                },
            }
        );
        
        // ✅ CORRECCIÓN 2: Acceder correctamente a los datos de Tesseract
        const { data } = result;
        const text = data.text;
        const confidence = data.confidence;
        const linesCount = (data as any).lines?.length || 0;
        
        logger.info('OCR completado exitosamente', { 
            confidence,
            lines: linesCount 
        });
        
        return text;
    } catch (error) {
        logger.error('Error en extracción de texto OCR', { error });
        throw new Error('Error al procesar la imagen');
    }
}

/**
 * Extrae productos estructurados del texto OCR
 * Usa patrones regex para detectar productos y precios
 */
function parseProductosFromText(text: string): ProductoExtraido[] {
    const productos: ProductoExtraido[] = [];
    
    // Patrón para detectar líneas de productos (ajustable según formato peruano)
    // Ejemplo: "LECHE GLORIA 1L        S/ 4.50"
    const linePattern = /^(.+?)\s+(?:S\/|s\/)\s*(\d+\.?\d*)/gm;
    
    let match;
    while ((match = linePattern.exec(text)) !== null) {
        const nombre = match[1].trim();
        const precio = parseFloat(match[2]);
        
        // Filtrar líneas que no son productos (totales, subtotales, etc.)
        if (
            nombre.length > 2 && 
            !nombre.toLowerCase().includes('total') &&
            !nombre.toLowerCase().includes('subtotal') &&
            precio > 0 && precio < 1000 // Filtro de precio razonable
        ) {
            productos.push({
                nombre,
                precio,
                cantidad: 1,
                confianza: 0.7, // Confianza base del regex
            });
        }
    }
    
    logger.info('Productos extraídos del OCR', { cantidad: productos.length });
    
    return productos;
}

export const TesseractService = {
    extractText,
    parseProductosFromText,
};