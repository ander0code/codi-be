import prisma from '@/lib/clients/prisma.js';
import { Prisma } from '@prisma/client';
import logger from '@/config/logger.js';
import type { BoletaTipoAmbiental } from '@prisma/client';

async function verificarBoletaDuplicada(
    userId: string,
    hashImagen: string,
    serie: string | null,
    correlativo: string | null
): Promise<{
    esDuplicada: boolean;
    motivo?: 'hash' | 'identificador';
    boletaExistente?: any;
}> {

    const duplicadoPorHash = await prisma.boletas.findFirst({
        where: {
            UsuarioId: userId,
            HashImagen: hashImagen
        },
        select: {
            Id: true,
            Serie: true,
            Correlativo: true,
            CreadoEn: true
        }
    });

    if (duplicadoPorHash) {
        logger.warn('🚫 Boleta duplicada detectada por hash de imagen', {
            boletaId: duplicadoPorHash.Id,
            hashImagen
        });

        return {
            esDuplicada: true,
            motivo: 'hash',
            boletaExistente: duplicadoPorHash
        };
    }

    if (serie && correlativo) {
        const duplicadoPorIdentificador = await prisma.boletas.findFirst({
            where: {
                UsuarioId: userId,
                Serie: serie,
                Correlativo: correlativo
            },
            select: {
                Id: true,
                Serie: true,
                Correlativo: true,
                CreadoEn: true
            }
        });

        if (duplicadoPorIdentificador) {
            logger.warn('🚫 Boleta duplicada detectada por identificador', {
                boletaId: duplicadoPorIdentificador.Id,
                serie,
                correlativo
            });

            return {
                esDuplicada: true,
                motivo: 'identificador',
                boletaExistente: duplicadoPorIdentificador
            };
        }
    }

    logger.info('✅ Boleta no duplicada, puede procesarse', {
        hashImagen,
        serie,
        correlativo
    });

    return { esDuplicada: false };
}

async function createBoleta(data: {
    usuarioId: string;
    nombreTienda?: string;
    tiendaId?: string;
    fechaBoleta: Date;
    total: number;
    tipoAmbiental: BoletaTipoAmbiental;
    urlImagen?: string;
    hashImagen?: string;
    serie?: string | null;
    correlativo?: string | null;
}) {
    try {
        const boleta = await prisma.boletas.create({
            data: {
                UsuarioId: data.usuarioId,
                NombreTienda: data.nombreTienda,
                TiendaId: data.tiendaId,
                FechaBoleta: data.fechaBoleta,
                Total: new Prisma.Decimal(data.total),
                TipoAmbiental: data.tipoAmbiental,
                UrlImagen: data.urlImagen,
                HashImagen: data.hashImagen,
                Serie: data.serie,
                Correlativo: data.correlativo,
            },
        });

        logger.info('✅ Boleta creada en DB', { boletaId: boleta.Id });
        return boleta;
    } catch (error) {
        logger.error('❌ Error creando boleta', { error });
        throw error;
    }
}

async function createBoletaItems(boletaId: string, items: Array<{
    nombreProducto: string;
    cantidad: number;
    unidad?: string;
    precioUnitario: number;
    precioTotal?: number;
    factorCo2: number;
    categoriaId?: string;
    subcategoriaId?: string;
    marcaId?: string;
    coincidido?: boolean;
    puntajeCoincidencia?: number;
}>) {
    try {
        const productosCreados = await prisma.productos.createMany({
            data: items.map(item => ({
                BoletaId: boletaId,
                NombreProducto: item.nombreProducto,
                Cantidad: new Prisma.Decimal(item.cantidad),
                Unidad: item.unidad,
                PrecioUnitario: new Prisma.Decimal(item.precioUnitario),
                PrecioTotal: item.precioTotal ? new Prisma.Decimal(item.precioTotal) : new Prisma.Decimal(item.precioUnitario * item.cantidad),
                FactorCo2PorUnidad: new Prisma.Decimal(item.factorCo2),
                CategoriaId: item.categoriaId,
                SubcategoriaId: item.subcategoriaId,
                MarcaId: item.marcaId,
                Coincidido: item.coincidido ?? true,
                PuntajeCoincidencia: item.puntajeCoincidencia ? new Prisma.Decimal(item.puntajeCoincidencia) : null,
            })),
        });

        logger.info('✅ Productos de boleta creados', {
            boletaId,
            cantidad: productosCreados.count
        });

        return productosCreados;
    } catch (error) {
        logger.error('❌ Error creando productos de boleta', { boletaId, error });
        throw error;
    }
}

async function getBoletaById(boletaId: string) {
    try {
        const boleta = await prisma.boletas.findUnique({
            where: { Id: boletaId },
            include: {
                Items: {
                    include: {
                        Marca: {
                            select: {
                                Nombre: true,
                            },
                        },
                        Categoria: {
                            select: {
                                Nombre: true,
                            },
                        },
                        Subcategoria: {
                            select: {
                                Nombre: true,
                            },
                        },
                        Recomendaciones: {
                            include: {
                                Marca: {
                                    select: {
                                        Nombre: true,
                                    },
                                },
                                Categoria: {
                                    select: {
                                        Nombre: true,
                                    },
                                },
                            },
                            orderBy: {
                                PorcentajeMejora: 'desc',
                            },
                            take: 3,
                        },
                    },
                },
                Tienda: {
                    select: {
                        Nombre: true,
                        UrlLogo: true,
                    },
                },
            },
        });

        if (boleta) {
            logger.info('✅ Boleta obtenida de DB con recomendaciones', { boletaId });
        } else {
            logger.warn('⚠️ Boleta no encontrada', { boletaId });
        }

        return boleta;
    } catch (error) {
        logger.error('❌ Error obteniendo boleta', { boletaId, error });
        throw error;
    }
}

async function updatePuntosVerdes(usuarioId: string, puntos: number) {
    try {
        await prisma.usuarios.update({
            where: { Id: usuarioId },
            data: {
                PuntosVerdes: {
                    increment: puntos,
                },
            },
        });

        logger.info('✅ Puntos verdes actualizados', { usuarioId, puntos });
    } catch (error) {
        logger.error('❌ Error actualizando puntos verdes', { usuarioId, error });
        throw error;
    }
}

async function createRecomendaciones(
    boletaId: string,
    recomendaciones: Array<{
        productoOriginalId: string;
        productoRecomendadoNombre: string;
        productoRecomendadoMarcaId?: string;
        productoRecomendadoCategoriaId?: string;
        tiendaOrigen: string;
        co2Original: number;
        co2Recomendado: number;
        porcentajeMejora: number;
        tipoRecomendacion: 'ALTERNATIVA_MISMA_TIENDA' | 'ALTERNATIVA_OTRA_TIENDA' | 'PRODUCTO_ECO_EQUIVALENTE' | 'MARCA_SOSTENIBLE';
        scoreSimilitud: number;
    }>
) {
    try {
        const recomendacionesCreadas = await prisma.recomendaciones.createMany({
            data: recomendaciones.map(rec => ({
                BoletaId: boletaId,
                ProductoOriginalId: rec.productoOriginalId,
                ProductoRecomendadoNombre: rec.productoRecomendadoNombre,
                ProductoRecomendadoMarcaId: rec.productoRecomendadoMarcaId,
                ProductoRecomendadoCategoriaId: rec.productoRecomendadoCategoriaId,
                TiendaOrigen: rec.tiendaOrigen,
                Co2Original: new Prisma.Decimal(rec.co2Original),
                Co2Recomendado: new Prisma.Decimal(rec.co2Recomendado),
                PorcentajeMejora: new Prisma.Decimal(rec.porcentajeMejora),
                TipoRecomendacion: rec.tipoRecomendacion,
                ScoreSimilitud: new Prisma.Decimal(rec.scoreSimilitud),
            })),
        });

        logger.info('✅ Recomendaciones guardadas', {
            boletaId,
            cantidad: recomendacionesCreadas.count,
        });

        return recomendacionesCreadas;
    } catch (error) {
        logger.error('❌ Error guardando recomendaciones', { boletaId, error });
        throw error;
    }
}

async function getProductosByBoletaId(boletaId: string) {
    try {
        const productos = await prisma.productos.findMany({
            where: { BoletaId: boletaId },
            select: {
                Id: true,
                NombreProducto: true,
                FactorCo2PorUnidad: true,
                Cantidad: true,
                Unidad: true,
                MarcaId: true,
                Marca: {
                    select: {
                        Nombre: true
                    }
                },
                Categoria: {
                    select: {
                        Nombre: true
                    }
                },
                Subcategoria: {
                    select: {
                        Nombre: true
                    }
                },
            },
        });

        logger.info('✅ Productos obtenidos de boleta', {
            boletaId,
            cantidad: productos.length
        });

        return productos;
    } catch (error) {
        logger.error('❌ Error obteniendo productos de boleta', { boletaId, error });
        throw error;
    }
}

async function findOrCreateMarca(nombreMarca: string | null | undefined): Promise<string | undefined> {
    if (!nombreMarca || nombreMarca === 'Sin marca') return undefined;

    try {
        const marca = await prisma.marcas.upsert({
            where: { Nombre: nombreMarca },
            update: {},
            create: { Nombre: nombreMarca },
        });

        return marca.Id;
    } catch (error) {
        logger.warn('⚠️ Error creando/buscando marca', { nombreMarca, error });
        return undefined;
    }
}

async function findOrCreateCategoria(nombreCategoria: string | null | undefined): Promise<string | undefined> {
    if (!nombreCategoria || nombreCategoria === 'Sin categoría') return undefined;

    try {
        const categoria = await prisma.categorias.upsert({
            where: { Nombre: nombreCategoria },
            update: {},
            create: { Nombre: nombreCategoria },
        });

        return categoria.Id;
    } catch (error) {
        logger.warn('⚠️ Error creando/buscando categoría', { nombreCategoria, error });
        return undefined;
    }
}

async function findOrCreateSubcategoria(
    nombreSubcategoria: string | null | undefined,
    categoriaId: string | undefined
): Promise<string | undefined> {
    if (!nombreSubcategoria || nombreSubcategoria === 'Sin subcategoría' || nombreSubcategoria === 'Sin categoría') {
        return undefined;
    }

    try {
        const existing = await prisma.subcategorias.findFirst({
            where: {
                Nombre: nombreSubcategoria,
                CategoriaId: categoriaId || null,
            },
        });

        if (existing) {
            return existing.Id;
        }

        const subcategoria = await prisma.subcategorias.create({
            data: {
                Nombre: nombreSubcategoria,
                CategoriaId: categoriaId,
            },
        });

        return subcategoria.Id;
    } catch (error) {
        logger.warn('⚠️ Error creando/buscando subcategoría', { nombreSubcategoria, error });
        return undefined;
    }
}

async function findOrCreateTienda(nombreTienda: string): Promise<string | undefined> {
    if (!nombreTienda) return undefined;

    try {
        const tienda = await prisma.tiendas.findUnique({
            where: { Nombre: nombreTienda },
        });

        if (tienda) {
            logger.info('✅ Tienda encontrada en DB', { tienda: nombreTienda, id: tienda.Id });
            return tienda.Id;
        }
        const tiendaSimilar = await prisma.tiendas.findFirst({
            where: {
                Nombre: {
                    equals: nombreTienda,
                    mode: 'insensitive',
                },
            },
        });

        if (tiendaSimilar) {
            logger.info('✅ Tienda encontrada por similitud', {
                buscado: nombreTienda,
                encontrado: tiendaSimilar.Nombre,
                id: tiendaSimilar.Id,
            });
            return tiendaSimilar.Id;
        }

        logger.warn('⚠️ Tienda no encontrada en DB', { tienda: nombreTienda });
        return undefined;
    } catch (error) {
        logger.error('❌ Error buscando tienda', { nombreTienda, error });
        return undefined;
    }
}

export const BoletasRepository = {
    verificarBoletaDuplicada,
    createBoleta,
    createBoletaItems,
    createRecomendaciones,
    getProductosByBoletaId,
    getBoletaById,
    updatePuntosVerdes,
    findOrCreateMarca,
    findOrCreateCategoria,
    findOrCreateSubcategoria,
    findOrCreateTienda,

};