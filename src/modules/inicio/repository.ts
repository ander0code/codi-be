import prisma from '@/lib/clients/prisma.js';
import type { Promocion, BoletaConItems, BoletaCompletaConTienda } from './schemas.js';

async function findUserById(userId: string) {
    return await prisma.usuarios.findUnique({
        where: { Id: userId },
        select: {
            Id: true,
            PuntosVerdes: true,
        },
    });
}

async function getUltimaBoleta(userId: string): Promise<BoletaCompletaConTienda | null> {
    return await prisma.boletas.findFirst({
        where: { UsuarioId: userId },
        orderBy: { FechaBoleta: 'desc' },
        include: {
            Tienda: {
                select: {
                    Nombre: true,
                    Categoria: true,
                    UrlLogo: true,
                },
            },
            Items: {
                select: {
                    FactorCo2PorUnidad: true,
                },
            },
        },
    });
}

async function getAllBoletasWithItems(userId: string): Promise<BoletaConItems[]> {
    return await prisma.boletas.findMany({
        where: { UsuarioId: userId },
        include: {
            Items: {
                select: {
                    FactorCo2PorUnidad: true,
                },
            },
        },
    });
}

async function getPromocionesRecientes(): Promise<Promocion[]> {
    const promociones = await prisma.promociones.findMany({
        where: { Activa: true },
        orderBy: { CreadoEn: 'desc' },
        take: 2,
        select: {
            Titulo: true,
            TipoPromocion: true,
        },
    });

    return promociones.map((promo: { Titulo: string; TipoPromocion: string }): Promocion => ({
        titulo: promo.Titulo,
        tipoPromocion: promo.TipoPromocion,
    }));
}


export const InicioRepository = {
    findUserById,
    getUltimaBoleta,
    getAllBoletasWithItems,
    getPromocionesRecientes,
};