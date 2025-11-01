import OpenAI from 'openai';
import { env } from '@/config/env.js';
import logger from '@/config/logger.js';

class OpenAIClientService {
    private static instance: OpenAI;
    
    static getInstance(): OpenAI {
        if (!OpenAIClientService.instance) {
            OpenAIClientService.instance = new OpenAI({
                apiKey: env.llm.openaiApiKey,
            });
            logger.info('✅ Cliente OpenAI inicializado');
        }
        return OpenAIClientService.instance;
    }
    
    /**
     * Genera un embedding para un texto
     */
    static async generateEmbedding(text: string): Promise<number[]> {
        try {
            const client = this.getInstance();
            const response = await client.embeddings.create({
                model: 'text-embedding-3-small',
                input: text,
                dimensions: 1536, // Puedes ajustar a 384 si quieres ahorrar espacio
            });
            
            return response.data[0].embedding;
        } catch (error) {
            logger.error('❌ Error generando embedding', { text, error });
            throw new Error('Error al generar embedding del producto');
        }
    }
}

export const openaiClient = OpenAIClientService.getInstance();
export { OpenAIClientService };