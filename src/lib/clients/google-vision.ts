import vision from '@google-cloud/vision';
import { env } from '@/config/env.js';
import logger from '@/config/logger.js';

/**
 * Google Cloud Vision API Client
 * Configurado con API Key para autenticación
 */
class GoogleVisionClient {
    private client: vision.ImageAnnotatorClient;
    private static instance: GoogleVisionClient;

    private constructor() {
        logger.info('🔧 Inicializando Google Cloud Vision API client');

        // Configurar cliente con API key
        this.client = new vision.ImageAnnotatorClient({
            apiKey: env.ocr.googleVisionApiKey,
        });

        logger.info('✅ Google Cloud Vision API client inicializado correctamente');
    }

    /**
     * Obtener instancia singleton del cliente
     */
    public static getInstance(): GoogleVisionClient {
        if (!GoogleVisionClient.instance) {
            GoogleVisionClient.instance = new GoogleVisionClient();
        }
        return GoogleVisionClient.instance;
    }

    /**
     * Obtener el cliente de Vision API
     */
    public getClient(): vision.ImageAnnotatorClient {
        return this.client;
    }

    /**
     * Detectar texto en una imagen usando Google Cloud Vision
     * Usa documentTextDetection para mejor estructura en boletas
     * @param imageBuffer Buffer de la imagen
     * @returns Texto detectado
     */
    public async detectText(imageBuffer: Buffer): Promise<string> {
        try {
            logger.debug('📸 Enviando imagen a Google Cloud Vision API');

            // Usar documentTextDetection para mejor estructura
            const [result] = await this.client.documentTextDetection({
                image: { content: imageBuffer },
            });

            const fullTextAnnotation = result.fullTextAnnotation;

            if (!fullTextAnnotation || !fullTextAnnotation.text) {
                logger.warn('⚠️ No se detectó texto en la imagen');
                return '';
            }

            // El texto completo ya viene bien estructurado
            const fullText = fullTextAnnotation.text;

            logger.info('✅ Texto detectado exitosamente', {
                caracteres: fullText.length,
                lineas: fullText.split('\n').length,
                bloques: fullTextAnnotation.pages?.[0]?.blocks?.length || 0,
                confianza: Math.round((fullTextAnnotation.pages?.[0]?.confidence || 0) * 100),
            });

            return fullText;
        } catch (error) {
            logger.error('❌ Error al detectar texto con Google Vision', {
                error,
                mensaje: error instanceof Error ? error.message : 'Error desconocido',
            });
            throw new Error('Error al procesar la imagen con Google Cloud Vision');
        }
    }
}

// Exportar instancia singleton
export const googleVisionClient = GoogleVisionClient.getInstance();
