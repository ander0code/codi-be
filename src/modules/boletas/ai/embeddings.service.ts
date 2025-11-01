import { OpenAIClientService } from '@/lib/clients/openai.js';
import logger from '@/config/logger.js';

export class EmbeddingsService {
    /**
     * Genera embedding para un nombre de producto
     */
    static async generateProductEmbedding(productName: string): Promise<number[]> {
        const normalizedName = this.normalizeProductName(productName);
        logger.debug('Generando embedding', { original: productName, normalized: normalizedName });
        
        return await OpenAIClientService.generateEmbedding(normalizedName);
    }
    
    /**
     * Normaliza el nombre del producto para mejor matching
     */
    private static normalizeProductName(name: string): string {
        return name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')      // Múltiples espacios → 1 espacio
            .replace(/[^\w\s]/g, '');  // Eliminar caracteres especiales
    }
}