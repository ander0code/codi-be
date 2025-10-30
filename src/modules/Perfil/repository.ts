import prisma from '@/lib/clients/prisma.js';
import type { UpdatePerfilInput } from './schemas.js';

async function findUserById(userId: string) {
    return await prisma.usuarios.findUnique({
        where: { Id: userId },
        select: {
            Id: true,
            Nombre: true,
            Apellido: true,
            Correo: true,
        },
    });
}

async function getBoletasParaEstadisticas(userId: string) {
    return await prisma.boletas.findMany({
        where: { UsuarioId: userId },
        select: {
            TipoAmbiental: true,
            Items: {
                select: {
                    FactorCo2PorUnidad: true,
                },
            },
        },
    });
}

async function updateUserProfile(userId: string, data: UpdatePerfilInput) {
    return await prisma.usuarios.update({
        where: { Id: userId },
        data: {
            Nombre: data.nombre,
            Apellido: data.apellido,
            ActualizadoEn: new Date(),
        },
        select: {
            Nombre: true,
            Apellido: true,
            ActualizadoEn: true,
        },
    });
}

export const PerfilRepository = {
    findUserById,
    getBoletasParaEstadisticas,
    updateUserProfile,
};