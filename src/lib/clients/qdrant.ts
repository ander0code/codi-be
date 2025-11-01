import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '@/config/env.js';
import logger from '@/config/logger.js';

class QdrantClientService {
    private static instance: QdrantClient;
    
    static getInstance(): QdrantClient {
        if (!QdrantClientService.instance) {
            QdrantClientService.instance = new QdrantClient({
                url: env.qdrant.url,
                apiKey: env.qdrant.apiKey,
            });
            logger.info('✅ Cliente Qdrant inicializado', { url: env.qdrant.url });
        }
        return QdrantClientService.instance;
    }
    
    /**
     * Verifica si una colección existe
     */
    static async collectionExists(collectionName: string): Promise<boolean> {
        try {
            const client = this.getInstance();
            const collections = await client.getCollections();
            return collections.collections.some(col => col.name === collectionName);
        } catch (error) {
            logger.error('Error verificando colección', { collectionName, error });
            return false;
        }
    }
    
    /**
     * Crea una colección si no existe
     */
    static async ensureCollection(collectionName: string, vectorSize: number): Promise<void> {
        try {
            const exists = await this.collectionExists(collectionName);
            
            if (!exists) {
                const client = this.getInstance();
                await client.createCollection(collectionName, {
                    vectors: {
                        size: vectorSize,
                        distance: 'Cosine',
                    },
                });
                logger.info('✅ Colección creada en Qdrant', { collectionName, vectorSize });
            }
        } catch (error) {
            logger.error('❌ Error creando colección en Qdrant', { collectionName, error });
            throw error;
        }
    }
}

export const qdrantClient = QdrantClientService.getInstance();
export { QdrantClientService };