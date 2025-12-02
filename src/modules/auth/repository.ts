import prisma from '@/lib/clients/prisma.js';
import type { RegisterInput, UserResponse, UserBasicInfo } from './schemas.js';

async function findUserByEmail(email: string): Promise<(UserResponse & { contrasena: string | null }) | null> {
    const user = await prisma.usuarios.findUnique({
        where: { Correo: email },
    });
    if (!user) return null;
    return {
        id: user.Id,
        nombre: user.Nombre,
        apellido: user.Apellido,
        email: user.Correo,
        contrasena: user.contrasena,
        proveedorAuth: user.ProveedorAuth ?? undefined,
    };
}

async function createUser(data: Omit<RegisterInput, 'password'> & { nombre: string; apellido: string; passwordHash: string }): Promise<UserResponse> {
    const user = await prisma.usuarios.create({
        data: {
            Dni: data.dni,
            Nombre: data.nombre,
            Apellido: data.apellido,
            Correo: data.email,
            contrasena: data.passwordHash,
            ProveedorAuth: 'email',
        },
    });
    return {
        id: user.Id,
        nombre: user.Nombre,
        apellido: user.Apellido,
        email: user.Correo,
        proveedorAuth: user.ProveedorAuth ?? undefined,
    };
}

async function findUserByGoogleId(googleId: string): Promise<UserResponse | null> {
    const user = await prisma.usuarios.findUnique({
        where: { googleId: googleId },
    });
    if (!user) return null;
    return {
        id: user.Id,
        nombre: user.Nombre,
        apellido: user.Apellido,
        email: user.Correo,
    };
}

async function findOrCreateGoogleUser(data: {
    googleId: string;
    email: string;
    nombre: string;
    apellido: string;
    proveedorAuth: string;
}): Promise<UserResponse> {
    let user = await prisma.usuarios.findUnique({
        where: { googleId: data.googleId },
    });

    if (!user) {
        user = await prisma.usuarios.findUnique({
            where: { Correo: data.email },
        });

        if (user) {
            user = await prisma.usuarios.update({
                where: { Id: user.Id },
                data: { googleId: data.googleId },
            });
        } else {
            user = await prisma.usuarios.create({
                data: {
                    Nombre: data.nombre,
                    Apellido: data.apellido,
                    Correo: data.email,
                    googleId: data.googleId,
                    contrasena: null,
                    ProveedorAuth: data.proveedorAuth,
                },
            });
        }
    }

    return {
        id: user.Id,
        nombre: user.Nombre,
        apellido: user.Apellido,
        email: user.Correo,
        proveedorAuth: user.ProveedorAuth ?? undefined,
    };
}

// ✅ NUEVO: Buscar usuario por DNI y retornar solo datos básicos
async function findUserByDni(dni: string): Promise<UserBasicInfo | null> {
    const user = await prisma.usuarios.findUnique({
        where: { Dni: dni },
        select: {
            Nombre: true,
            Apellido: true,
            Dni: true,
        },
    });

    if (!user) return null;

    return {
        nombre: user.Nombre,
        apellido: user.Apellido,
        dni: user.Dni ?? '',
    };
}

export const AuthRepository = {
    findUserByEmail,
    createUser,
    findUserByGoogleId,
    findOrCreateGoogleUser,
    findUserByDni, // ✅ NUEVO
};