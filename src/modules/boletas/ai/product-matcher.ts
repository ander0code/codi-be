import { qdrantClient, QdrantClientService } from "@/lib/clients/qdrant.js";
import { EmbeddingsService } from "./embeddings.service.js";
import { DeepSeekClientService } from "@/lib/clients/deepseek.js";
import { CategoryInferenceService } from './category-inference.service.js';
import { normalizarCategoria } from "../utils/categoryMapper.js";
import logger from "@/config/logger.js";
import type { ProductoClasificado } from "../schemas.js";

const SIMILARITY_THRESHOLD = 0.6;

async function findSimilarProduct(
    productName: string,
    collectionName: string,
    validarCO2 = true
): Promise<ProductoClasificado | null> {
    try {
        // ✅ PASO 1: Inferir categoría ANTES de buscar
        const categoriaInferida = await CategoryInferenceService.inferirCategoria(
            productName,
            collectionName
        );

        logger.info('🔍 Buscando producto con filtro de categoría', {
            producto: productName,
            categoriaInferida: categoriaInferida.categoria,
            confianzaCategoria: categoriaInferida.confianza,
        });

        // ✅ PASO 2: Generar embedding
        const embedding = await EmbeddingsService.generateProductEmbedding(productName);
        const exists = await QdrantClientService.collectionExists(collectionName);

        if (!exists) {
            logger.warn(`⚠️ Colección ${collectionName} no existe en Qdrant`);
            return null;
        }

        // ✅ PASO 3: Búsqueda CON filtro de categoría (si confianza >= 0.6)
        const usarFiltroCategoría =
            categoriaInferida.confianza >= 0.6 &&
            categoriaInferida.categoria !== 'Sin categoría';

        const searchParams: any = {
            vector: embedding,
            limit: 5,
            with_payload: true,
            score_threshold: 0.50,
        };

        if (usarFiltroCategoría) {
            searchParams.filter = {
                must: [
                    {
                        key: 'categoria_principal',
                        match: { value: categoriaInferida.categoria },
                    },
                ],
            };
            logger.debug('✅ Aplicando filtro de categoría en búsqueda', {
                categoria: categoriaInferida.categoria,
            });
        } else {
            logger.debug('⚠️ Búsqueda sin filtro de categoría (confianza baja)', {
                confianza: categoriaInferida.confianza,
            });
        }

        const results = await qdrantClient.search(collectionName, searchParams);

        // ✅ PASO 4: Loggear candidatos
        if (results.length > 0) {
            logger.info(`🔍 Top ${results.length} candidatos para "${productName}":`, {
                categoriaFiltrada: usarFiltroCategoría ? categoriaInferida.categoria : 'Todas',
                candidatos: results.map((r, idx) => ({
                    rank: idx + 1,
                    nombre: (r.payload as any).nombre || 'Sin nombre',
                    score: Math.round(r.score * 100) / 100,
                    categoria: (r.payload as any).categoria_principal || 'Sin categoría',
                    co2: (r.payload as any).co2_estimado || (r.payload as any).co2e_estimado || 0,
                }))
            });
        } else {
            logger.warn('⚠️ NO se encontraron candidatos', {
                productName,
                collection: collectionName,
                categoriaFiltrada: usarFiltroCategoría ? categoriaInferida.categoria : 'Ninguna',
            });
            return null;
        }

        // ✅ PASO 5: Validar umbral de similitud
        const candidatosValidos = results.filter(r => r.score >= SIMILARITY_THRESHOLD);

        if (candidatosValidos.length === 0) {
            logger.warn('⚠️ Candidatos encontrados pero score < umbral', {
                productName,
                mejorScore: results[0]?.score,
                umbralRequerido: SIMILARITY_THRESHOLD,
            });
            return null;
        }

        // ✅ PASO 6: Tomar mejor candidato
        const match = candidatosValidos[0];
        const payload = match.payload as Record<string, any>;
        const co2Estimado = payload.co2_estimado || payload.co2e_estimado || 0;
        const categoriaRaw = payload.categoria_principal || payload.categoria || 'Sin categoría';

        const categoriaNormalizada = normalizarCategoria(categoriaRaw, collectionName);

        logger.info('✅ Producto encontrado en Qdrant', {
            original: productName,
            matched: payload.nombre,
            score: Math.round(match.score * 100) / 100,
            categoriaInferidaIA: categoriaInferida.categoria,
            categoriaQdrant: categoriaNormalizada.normalized,
            coincideCategoria: categoriaInferida.categoria === categoriaNormalizada.normalized,
            co2: co2Estimado,
        });


        // ✅ CO2 validation is now handled by tabla_maestra.json in services.ts
        // No need for AI validation here (redundant and costly)

        return {
            nombre: payload.nombre || productName,
            precio: 0,
            cantidad: 1,
            unidad: 'kg', // ✅ Unidad por defecto
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
