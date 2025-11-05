import { qdrantClient, QdrantClientService } from '@/lib/clients/qdrant.js';
import { EmbeddingsService } from './embeddings.service.js';
import { DeepSeekClientService } from '@/lib/clients/deepseek.js';
import { normalizarCategoria } from '../utils/categoryMapper.js';
import logger from '@/config/logger.js';
import type { ProductoClasificado } from '../schemas.js';

const SIMILARITY_THRESHOLD = 0.75;

async function findSimilarProduct(
    productName: string,
    collectionName: string,
    validarCO2 = true
): Promise<ProductoClasificado | null> {
    try {
        const embedding = await EmbeddingsService.generateProductEmbedding(productName);
        const exists = await QdrantClientService.collectionExists(collectionName);

        if (!exists) {
            logger.warn(`⚠️ Colección ${collectionName} no existe en Qdrant`);
            return null;
        }

        const results = await qdrantClient.search(collectionName, {
            vector: embedding,
            limit: 1,
            with_payload: true,
            score_threshold: SIMILARITY_THRESHOLD,
        });

        if (results.length === 0) {
            logger.warn('⚠️ No se encontró producto similar en Qdrant', {
                productName,
                collection: collectionName,
            });
            return null;
        }

        const match = results[0];
        const payload = match.payload as Record<string, any>;
        const co2Estimado = payload.co2_estimado || payload.co2e_estimado || 0;
        const categoriaRaw = payload.categoria_principal || payload.categoria || 'Sin categoría';

        const categoriaNormalizada = normalizarCategoria(categoriaRaw, collectionName);

        logger.info('✅ Producto encontrado en Qdrant', {
            original: productName,
            matched: payload.nombre,
            score: match.score,
            collection: collectionName,
            categoriaRaw,
            categoriaNormalizada: categoriaNormalizada.normalized,
            confianzaCategoria: categoriaNormalizada.confianza,
            co2: co2Estimado,
        });

        if (validarCO2 && co2Estimado > 0) {
            const validacion = await DeepSeekClientService.validateCO2(
                payload.nombre,
                co2Estimado,
                categoriaNormalizada.normalized
            );

            if (!validacion.esValido && validacion.co2Sugerido) {
                logger.warn('⚠️ CO2 inconsistente detectado', {
                    producto: payload.nombre,
                    co2Original: co2Estimado,
                    co2Sugerido: validacion.co2Sugerido,
                    razon: validacion.razon,
                });
                payload.co2_estimado = validacion.co2Sugerido;
            }
        }

        return {
            nombre: payload.nombre || productName,
            precio: 0,
            cantidad: 1,
            confianza: match.score,
            categoria: categoriaNormalizada.normalized,
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