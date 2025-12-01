import { qdrantClient } from '@/lib/clients/qdrant.js';
import { EmbeddingsService } from '../matching/embeddings.service.js';
import logger from '@/config/logger.js';

import type { ProductoClasificado } from '../schemas.js';
import type { TipoRecomendacion } from '@prisma/client';

interface ProductoRecomendado {
    nombre: string;
    co2: number;
    marca: string | null;
    categoria: string;
    tienda: string;
    scoreSimilitud: number;
    tipo: TipoRecomendacion;
    esEco?: boolean;
}

async function buscarProductosEco(
    embedding: number[],
    tienda: string,
    categoria: string,
    co2Original: number
): Promise<ProductoRecomendado[]> {
    try {
        const results = await qdrantClient.search(tienda, {
            vector: embedding,
            limit: 5,
            with_payload: true,
            score_threshold: 0.55,
            filter: {
                must: [
                    {
                        key: 'categoria_principal',
                        match: { value: categoria },
                    },
                ],
                should: [
                    {
                        key: 'nombre',
                        match: { text: 'organico' },
                    },
                    {
                        key: 'nombre',
                        match: { text: 'ecologico' },
                    },
                    {
                        key: 'nombre',
                        match: { text: 'eco' },
                    },
                    {
                        key: 'nombre',
                        match: { text: 'natural' },
                    },
                ],
            },
        });

        const alternativas: ProductoRecomendado[] = [];

        for (const match of results) {
            const payload = match.payload as Record<string, any>;
            const co2 = payload.co2_estimado || payload.co2e_estimado || 0;

            if (co2 > 0 && co2 < co2Original) {
                alternativas.push({
                    nombre: payload.nombre || 'Producto sin nombre',
                    co2,
                    marca: payload.marca || null,
                    categoria: payload.categoria_principal || categoria,
                    tienda,
                    scoreSimilitud: match.score,
                    tipo: 'PRODUCTO_ECO_EQUIVALENTE',
                    esEco: true,
                });
            }
        }

        return alternativas;
    } catch (error) {
        logger.debug(`⚠️ Error buscando productos eco en ${tienda}`);
        return [];
    }
}

async function buscarMarcasSostenibles(
    embedding: number[],
    tienda: string,
    categoria: string,
    co2Original: number,
    marcaOriginal?: string
): Promise<ProductoRecomendado[]> {
    try {
        const results = await qdrantClient.search(tienda, {
            vector: embedding,
            limit: 10,
            with_payload: true,
            score_threshold: 0.60,
            filter: {
                must: [
                    {
                        key: 'categoria_principal',
                        match: { value: categoria },
                    },
                ],
            },
        });

        const marcasConCO2: Record<string, { co2Promedio: number; productos: any[] }> = {};

        for (const match of results) {
            const payload = match.payload as Record<string, any>;
            const marca = payload.marca;
            const co2 = payload.co2_estimado || payload.co2e_estimado || 0;

            if (marca && co2 > 0 && marca !== marcaOriginal) {
                if (!marcasConCO2[marca]) {
                    marcasConCO2[marca] = { co2Promedio: 0, productos: [] };
                }
                marcasConCO2[marca].productos.push({ payload, score: match.score, co2 });
            }
        }

        for (const marca in marcasConCO2) {
            const productos = marcasConCO2[marca].productos;
            const co2Promedio = productos.reduce((sum, p) => sum + p.co2, 0) / productos.length;
            marcasConCO2[marca].co2Promedio = co2Promedio;
        }

        const marcasSostenibles = Object.entries(marcasConCO2)
            .filter(([_, data]) => data.co2Promedio < co2Original * 0.7)
            .sort(([_, a], [__, b]) => a.co2Promedio - b.co2Promedio)
            .slice(0, 2);

        const alternativas: ProductoRecomendado[] = [];

        for (const [marca, data] of marcasSostenibles) {
            const mejorProducto = data.productos.sort((a, b) => a.co2 - b.co2)[0];
            alternativas.push({
                nombre: mejorProducto.payload.nombre || 'Producto sin nombre',
                co2: mejorProducto.co2,
                marca,
                categoria: mejorProducto.payload.categoria_principal || categoria,
                tienda,
                scoreSimilitud: mejorProducto.score,
                tipo: 'MARCA_SOSTENIBLE',
            });
        }

        return alternativas;
    } catch (error) {
        logger.debug(`⚠️ Error buscando marcas sostenibles en ${tienda}`);
        return [];
    }
}

async function findAlternatives(
    producto: ProductoClasificado,
    tiendaOriginal: string,
    buscarOtrasTiendas = true
): Promise<ProductoRecomendado[]> {
    const effectiveCategory = producto.categoria && producto.categoria !== 'Sin categoría'
        ? producto.categoria
        : (producto.subcategoria ?? '');

    try {
        const embedding = await EmbeddingsService.generateProductEmbedding(producto.nombre);
        const alternativas: ProductoRecomendado[] = [];

        const todasLasTiendas = ['tottus', 'vivanda', 'plazavea', 'wong'];

        const tiendaNormalizada = tiendaOriginal.toLowerCase();

        const tiendasOrdenadas = [
            tiendaNormalizada,
            ...todasLasTiendas.filter(t => t !== tiendaNormalizada)
        ];

        logger.info(`🔍 Buscando alternativas para "${producto.nombre}"`, {
            co2Original: producto.factorCo2,
            categoria: effectiveCategory,
            subcategoria: producto.subcategoria,
            tiendaOriginal: tiendaOriginal,
            tiendaNormalizada: tiendaNormalizada,
            tiendas: tiendasOrdenadas
        });

        for (const tienda of tiendasOrdenadas) {
            if (alternativas.length >= 5) break;

            try {
                logger.info(`  🏪 Buscando en tienda: ${tienda}...`);

                const results = await qdrantClient.search(tienda, {
                    vector: embedding,
                    limit: 20,
                    with_payload: true,
                    score_threshold: 0.50,
                });

                logger.info(`  📊 Resultados en ${tienda}: ${results.length} productos encontrados`);

                for (const match of results) {
                    if (alternativas.length >= 5) break;

                    const payload = match.payload as Record<string, any>;
                    const co2 = payload.co2_estimado || payload.co2e_estimado || 0;

                    if (co2 > 0 && co2 < producto.factorCo2) {
                        alternativas.push({
                            nombre: payload.nombre || 'Producto sin nombre',
                            co2,
                            marca: payload.marca || null,
                            categoria: payload.categoria_principal || effectiveCategory,
                            tienda,
                            scoreSimilitud: match.score,
                            tipo: tienda === tiendaOriginal
                                ? 'ALTERNATIVA_MISMA_TIENDA'
                                : 'ALTERNATIVA_OTRA_TIENDA',
                        });

                        logger.debug(`  ✅ ${payload.nombre} - CO2: ${co2} (${tienda})`);
                    }
                }
            } catch (error) {
                logger.debug(`⚠️ Error buscando en ${tienda}:`, error);
                continue;
            }
        }

        alternativas.sort((a, b) => a.co2 - b.co2);

        const mejoresAlternativas = alternativas.slice(0, 5);

        logger.info(`✅ Encontradas ${mejoresAlternativas.length} alternativas para "${producto.nombre}"`);

        return mejoresAlternativas;
    } catch (error) {
        logger.error(`❌ Error buscando alternativas para "${producto.nombre}":`, error);
        return [];
    }
}

export const RecommendationsService = {
    findAlternatives,
};