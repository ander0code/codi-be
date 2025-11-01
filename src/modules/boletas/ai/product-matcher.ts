import { qdrantClient, QdrantClientService } from '@/lib/clients/qdrant.js';
import { EmbeddingsService } from './embeddings.service.js';
import { DeepSeekClientService } from '@/lib/clients/deepseek.js';
import logger from '@/config/logger.js';
import type { ProductoClasificado } from '../schemas.js';

const SIMILARITY_THRESHOLD = 0.75;

/**
 * Busca productos similares en Qdrant usando la colección del supermercado
 */
async function findSimilarProduct(
    productName: string,
    collectionName: string,
    validarCO2 = false // Por defecto NO validar con IA (opcional)
): Promise<ProductoClasificado | null> {
    try {
        // 1. Generar embedding del producto del OCR
        const embedding = await EmbeddingsService.generateProductEmbedding(productName);
        
        // 2. Asegurar que la colección existe
        const exists = await QdrantClientService.collectionExists(collectionName);
        
        if (!exists) {
            logger.warn(`⚠️ Colección ${collectionName} no existe en Qdrant`);
            return null;
        }
        
        // 3. Buscar en Qdrant
        const results = await qdrantClient.search(collectionName, {
            vector: embedding,
            limit: 1,
            with_payload: true,
            score_threshold: SIMILARITY_THRESHOLD,
        });
        
        if (results.length === 0) {
            logger.warn('⚠️ No se encontró producto similar en Qdrant', { 
                productName, 
                collection: collectionName 
            });
            return null;
        }
        
        const match = results[0];
        const payload = match.payload as Record<string, any>;
        
        const co2Estimado = payload.co2_estimado || payload.co2e_estimado || 0;
        const categoria = payload.categoria_principal || payload.categoria || 'Sin categoría';
        
        // 4. OPCIONAL: Validar CO2 con DeepSeek (solo si se solicita)
        if (validarCO2 && co2Estimado > 0) {
            const validacion = await DeepSeekClientService.validateCO2(
                payload.nombre,
                co2Estimado,
                categoria
            );
            
            if (!validacion.esValido) {
                logger.warn('⚠️ CO2 inconsistente detectado', {
                    producto: payload.nombre,
                    co2Original: co2Estimado,
                    co2Sugerido: validacion.co2Sugerido,
                    razon: validacion.razon
                });
                
                // Usar el CO2 sugerido si está disponible
                if (validacion.co2Sugerido) {
                    payload.co2_estimado = validacion.co2Sugerido;
                }
            }
        }
        
        logger.info('✅ Producto encontrado en Qdrant', {
            original: productName,
            matched: payload.nombre,
            score: match.score,
            collection: collectionName,
            co2: payload.co2_estimado || payload.co2e_estimado
        });
        
        // 5. Mapear payload de Qdrant a nuestro schema
        return {
            nombre: payload.nombre || productName,
            precio: 0, // Se actualizará con el precio del OCR
            cantidad: 1,
            confianza: match.score,
            categoria,
            subcategoria: payload.subcategoria,
            marcaId: undefined,
            factorCo2: payload.co2_estimado || payload.co2e_estimado || 0,
            esLocal: false,
            tieneEmpaqueEcologico: false,
        };
    } catch (error) {
        logger.error('❌ Error buscando producto en Qdrant', { productName, collectionName, error });
        return null;
    }
}

export const ProductMatcher = {
    findSimilarProduct,
};