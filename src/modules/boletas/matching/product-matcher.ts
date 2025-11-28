import { qdrantClient, QdrantClientService } from "@/lib/clients/qdrant.js";
import { EmbeddingsService } from "./embeddings.service.js";
import { AdvancedMatcherService } from "./advanced-matcher.service.js";
import { SubcategoryInferenceService } from "../ai/subcategory-inference.service.js";
import { SubcategoryNormalizer } from "../validation/subcategory-normalizer.service.js";
import logger from "@/config/logger.js";
import type { ProductoClasificado } from "../schemas.js";

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

        logger.info('🔍 Buscando producto por similitud (sin filtro de categoría)', {
            producto: productName,
            collection: collectionName,
        });

        const searchParams: any = {
            vector: embedding,
            limit: 10,
            with_payload: true,
        };

        const results = await qdrantClient.search(collectionName, searchParams);

        if (results.length > 0) {
            logger.info(`🔍 Top ${results.length} candidatos para "${productName}":`, {
                candidatos: results.map((r, idx) => ({
                    rank: idx + 1,
                    nombre: (r.payload as any).nombre || 'Sin nombre',
                    score: Math.round(r.score * 100) / 100,
                    categoria: (r.payload as any).categoria || 'Sin categoría',
                    subcategoria: (r.payload as any).subcategoria || 'Sin subcategoría',
                    co2: (r.payload as any).huella_categoria || (r.payload as any).co2_estimado || 0,
                }))
            });
        } else {
            logger.warn('⚠️ NO se encontraron candidatos', {
                productName,
                collection: collectionName,
            });
            return null;
        }

        const mejorMatch = AdvancedMatcherService.encontrarMejorMatch(
            productName,
            results as any,
            0.65
        );

        if (!mejorMatch) {
            logger.warn('⚠️ No se encontró match con búsqueda híbrida, infiriendo subcategoría...', {
                productName,
                candidatosEvaluados: results.length,
            });

            const inferencia = await SubcategoryInferenceService.inferirSubcategoria(productName);

            return {
                nombre: productName,
                precio: 0,
                cantidad: 1,
                unidad: 'kg',
                confianza: inferencia.confianza,
                categoria: 'Sin categoría',
                subcategoria: inferencia.subcategoria,
                marcaId: undefined,
                factorCo2: inferencia.huella_categoria,
                esLocal: false,
                tieneEmpaqueEcologico: false,
            };
        }

        const payload = mejorMatch.payload as Record<string, any>;

        const categoria = payload.categoria || 'Sin categoría';
        const subcategoriaOriginal = payload.subcategoria || categoria;

        // Normalizar subcategoría usando mapeo_subcategorias.json
        const subcategoriaNormalizada = SubcategoryNormalizer.normalizarSubcategoria(subcategoriaOriginal);

        const huella_categoria = payload.huella_categoria || payload.co2_estimado || payload.co2e_estimado || 5.0;

        logger.info('✅ Producto encontrado con búsqueda híbrida', {
            original: productName,
            matched: payload.nombre,
            scoreEmbedding: Math.round(mejorMatch.score * 100) / 100,
            scoreTokens: Math.round(mejorMatch.scoreTokens * 100) / 100,
            scoreFuzzy: Math.round(mejorMatch.scoreFuzzy * 100) / 100,
            scoreCombinado: Math.round(mejorMatch.scoreCombinado * 100) / 100,
            categoria: categoria,
            subcategoriaOriginal: subcategoriaOriginal,
            subcategoriaNormalizada: subcategoriaNormalizada,
            huella_categoria: huella_categoria,
        });


        return {
            nombre: payload.nombre || productName,
            precio: 0,
            cantidad: 1,
            unidad: 'kg',
            confianza: mejorMatch.scoreCombinado,
            categoria: categoria,
            subcategoria: subcategoriaNormalizada, // ✅ Usar subcategoría normalizada
            marca: payload.marca || null,
            marcaId: undefined,
            factorCo2: huella_categoria,
            esLocal: payload.esLocal || false,
            tieneEmpaqueEcologico: payload.tieneEmpaqueEcologico || false,
        };
    } catch (error) {
        logger.error('❌ Error buscando producto en Qdrant', { productName, collectionName, error });
        return null;
    }
}

export const ProductMatcher = {
    findSimilarProduct,
};
