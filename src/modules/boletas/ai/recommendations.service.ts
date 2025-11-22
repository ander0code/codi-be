import { qdrantClient } from '@/lib/clients/qdrant.js';
import { EmbeddingsService } from './embeddings.service.js';
import logger from '@/config/logger.js';

import type { ProductoClasificado } from '../schemas.js';

interface ProductoRecomendado {
    nombre: string;
    co2: number;
    marca: string | null;
    categoria: string;
    tienda: string;
    scoreSimilitud: number;
}

async function findAlternatives(
    producto: ProductoClasificado,
    tiendaOriginal: string,
    buscarOtrasTiendas = true
): Promise<ProductoRecomendado[]> {
    try {
        const embedding = await EmbeddingsService.generateProductEmbedding(producto.nombre);

        const alternativas: ProductoRecomendado[] = [];

        // 1. Buscar en la misma tienda
        const resultsMismaTienda = await qdrantClient.search(tiendaOriginal, {
            vector: embedding,
            limit: 10,
            with_payload: true,
            score_threshold: 0.60,
            filter: {
                must: [
                    {
                        key: 'categoria_principal',
                        match: { value: producto.categoria },
                    },
                ],
            },
        });

        if (resultsMismaTienda.length > 0) {
            logger.debug(`🔍 Candidatos en ${tiendaOriginal} para "${producto.nombre}":`, {
                candidatos: resultsMismaTienda.slice(0, 5).map((r, idx) => ({
                    rank: idx + 1,
                    nombre: (r.payload as any).nombre || 'Sin nombre',
                    score: Math.round(r.score * 100) / 100,
                    co2: (r.payload as any).co2_estimado || (r.payload as any).co2e_estimado || 0,
                }))
            });
        }

        for (const match of resultsMismaTienda) {
            const payload = match.payload as Record<string, any>;
            const co2 = payload.co2_estimado || payload.co2e_estimado || 0;

            // Solo recomendar si tiene MENOR CO2
            if (co2 < producto.factorCo2 && co2 > 0) {
                alternativas.push({
                    nombre: payload.nombre || 'Producto sin nombre',
                    co2,
                    marca: payload.marca || null,
                    categoria: payload.categoria_principal || producto.categoria,
                    tienda: tiendaOriginal,
                    scoreSimilitud: match.score,
                });
            }
        }

        // 2. Buscar en otras tiendas (si está habilitado)
        if (buscarOtrasTiendas && alternativas.length < 3) {
            const otrasTiendas = ['tottus', 'wong', 'vivanda', 'plazavea', 'metro'].filter(
                t => t !== tiendaOriginal
            );

            for (const tienda of otrasTiendas) {
                try {
                    const resultsOtraTienda = await qdrantClient.search(tienda, {
                        vector: embedding,
                        limit: 5,
                        with_payload: true,
                        score_threshold: 0.65,
                        filter: {
                            must: [
                                {
                                    key: 'categoria_principal',
                                    match: { value: producto.categoria },
                                },
                            ],
                        },
                    });

                    for (const match of resultsOtraTienda) {
                        const payload = match.payload as Record<string, any>;
                        const co2 = payload.co2_estimado || payload.co2e_estimado || 0;

                        if (co2 < producto.factorCo2 && co2 > 0) {
                            alternativas.push({
                                nombre: payload.nombre || 'Producto sin nombre',
                                co2,
                                marca: payload.marca || null,
                                categoria: payload.categoria_principal || producto.categoria,
                                tienda,
                                scoreSimilitud: match.score,
                            });
                        }
                    }
                } catch (error) {
                    // Ignorar si la colección no existe
                    logger.debug(`⚠️ Colección ${tienda} no disponible`);
                }
            }
        }

        // Ordenar por mejor CO2 primero
        alternativas.sort((a, b) => a.co2 - b.co2);

        logger.info(`✅ Encontradas ${alternativas.length} alternativas para ${producto.nombre}`);

        // Retornar máximo 3 mejores alternativas
        return alternativas.slice(0, 3);
    } catch (error) {
        logger.error('❌ Error buscando alternativas', { producto: producto.nombre, error });
        return [];
    }
}

export const RecommendationsService = {
    findAlternatives,
};