import { OpenAIClientService } from '@/lib/clients/openai.js';
import logger from '@/config/logger.js';

export class EmbeddingsService {

    static async generateProductEmbedding(productName: string): Promise<number[]> {
        const normalizedName = this.normalizeProductName(productName);
        logger.debug('Generando embedding', { original: productName, normalized: normalizedName });
        
        return await OpenAIClientService.generateEmbedding(normalizedName);
    }
    
    private static normalizeProductName(name: string): string {
        return name
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s\dáéíóúñ]/gi, '');
    }
}