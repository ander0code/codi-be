import prisma from '@/lib/clients/prisma.js';
import { Prisma } from '@prisma/client';
import logger from '@/config/logger.js';
import type { BoletaTipoAmbiental } from '@prisma/client';

async function createBoleta(data: {
    usuarioId: string;
    nombreTienda?: string;
    tiendaId?: string;
    fechaBoleta: Date;
    total: number;
    tipoAmbiental: BoletaTipoAmbiental;
    urlImagen?: string;
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
    precioUnitario: number;
    factorCo2: number;
    categoriaId?: string;
    subcategoriaId?: string;
    marcaId?: string;
}>) {
    try {
        const productosCreados = await prisma.productos.createMany({
            data: items.map(item => ({
                BoletaId: boletaId,
                NombreProducto: item.nombreProducto,
                Cantidad: new Prisma.Decimal(item.cantidad),
                PrecioUnitario: new Prisma.Decimal(item.precioUnitario),
                PrecioTotal: new Prisma.Decimal(item.precioUnitario * item.cantidad),
                FactorCo2PorUnidad: new Prisma.Decimal(item.factorCo2),
                CategoriaId: item.categoriaId,
                SubcategoriaId: item.subcategoriaId,
                MarcaId: item.marcaId,
                Coincidido: true,
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
                        // ✅ NUEVO: Incluir recomendaciones del producto
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
                                PorcentajeMejora: 'desc', // Mejores recomendaciones primero
                            },
                            take: 3, // Máximo 3 recomendaciones por producto
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


export const BoletasRepository = {
    createBoleta,
    createBoletaItems,
    createRecomendaciones,
    getProductosByBoletaId,
    getBoletaById,
    updatePuntosVerdes,
};