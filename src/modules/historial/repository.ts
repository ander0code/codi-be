import prisma from '@/lib/clients/prisma.js';
import type { BoletaConDetalles } from './schemas.js';

async function findUserById(userId: string) {
    return await prisma.usuarios.findUnique({
        where: { Id: userId },
        select: {
            Id: true,
        },
    });
}

async function getAllBoletasConDetalles(userId: string): Promise<BoletaConDetalles[]> {
    return await prisma.boletas.findMany({
        where: { UsuarioId: userId },
        orderBy: { FechaBoleta: 'desc' },
        select: {
            Id: true,
            FechaBoleta: true,
            NombreTienda: true,
            TipoAmbiental: true,
            Tienda: {
                select: {
                    Nombre: true,
                    UrlLogo: true,
                },
            },
            Items: {
                select: {
                    FactorCo2PorUnidad: true,
                },
            },
            _count: {
                select: {
                    Items: true,
                },
            },
        },
    });
}

export const HistorialRepository = {
    findUserById,
    getAllBoletasConDetalles,
};