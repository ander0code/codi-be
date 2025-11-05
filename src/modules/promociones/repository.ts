import prisma from '@/lib/clients/prisma.js';

async function findUserById(userId: string) {
    return await prisma.usuarios.findUnique({
        where: { Id: userId },
        select: {
            Id: true,
            PuntosVerdes: true,
        },
    });
}

async function getAllPromocionesActivas() {
    return await prisma.promociones.findMany({
        where: { Activa: true },
        include: {
            Tienda: {
                select: {
                    Nombre: true,
                    UrlLogo: true,
                },
            },
        },
        orderBy: { CreadoEn: 'desc' },
    });
}

async function getPromocionesDelUsuario(userId: string) {
    return await prisma.promocionesUsuarios.findMany({
        where: { UsuarioId: userId },
        include: {
            Promocion: {
                include: {
                    Tienda: {
                        select: {
                            Nombre: true,
                            UrlLogo: true,
                        },
                    },
                },
            },
        },
        orderBy: { CreadoEn: 'desc' },
    });
}

async function getPromocionDetalle(promocionId: string, userId: string) {
    const promocion = await prisma.promociones.findUnique({
        where: { Id: promocionId },
        include: {
            Tienda: {
                select: {
                    Nombre: true,
                    UrlLogo: true,
                },
            },
        },
    });

    if (!promocion) return null;

    const promocionUsuario = await prisma.promocionesUsuarios.findFirst({
        where: {
            PromocionId: promocionId,
            UsuarioId: userId,
        },
    });

    return { promocion, promocionUsuario };
}

async function canjearPromocion(
    userId: string,
    promocionId: string,
    puntosRequeridos: number
) {
    return await prisma.$transaction(async (tx) => {
        // 1. Descontar puntos del usuario
        const usuario = await tx.usuarios.update({
            where: { Id: userId },
            data: {
                PuntosVerdes: {
                    decrement: puntosRequeridos,
                },
            },
            select: {
                PuntosVerdes: true,
            },
        });

        // 2. Crear registro de canje
        const promocionUsuario = await tx.promocionesUsuarios.create({
            data: {
                UsuarioId: userId,
                PromocionId: promocionId,
                FechaUso: new Date(),
                Disponible: true,
            },
        });

        return {
            promocionUsuarioId: promocionUsuario.Id,
            puntosRestantes: usuario.PuntosVerdes,
            fechaCanje: promocionUsuario.FechaUso!, // ✅ Non-null assertion operator
        };
    });
}

export const PromocionesRepository = {
    findUserById,
    getAllPromocionesActivas,
    getPromocionesDelUsuario,
    getPromocionDetalle,
    canjearPromocion,
};