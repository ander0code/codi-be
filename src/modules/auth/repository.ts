import prisma from '@/lib/clients/prisma.js';
import type { RegisterInput, UserResponse } from './schemas.js';

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

async function createUser(data: RegisterInput & { passwordHash: string }): Promise<UserResponse> {
    const user = await prisma.usuarios.create({
        data: {
            Nombre: data.nombre,
            Apellido: data.apellido,
            Correo: data.email,
            contrasena: data.passwordHash,
            ProveedorAuth: 'email', // <-- aquí
        },
    });
    return {
        id: user.Id,
        nombre: user.Nombre,
        apellido: user.Apellido,
        email: user.Correo,
        proveedorAuth: user.ProveedorAuth ?? undefined, // <-- aquí
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
    // Primero intentar encontrar por googleId
    let user = await prisma.usuarios.findUnique({
        where: { googleId: data.googleId },
    });

    // Si no existe, verificar si hay un usuario con ese email
    if (!user) {
        user = await prisma.usuarios.findUnique({
            where: { Correo: data.email },
        });

        // Si existe usuario con ese email pero sin googleId, vincular la cuenta
        if (user) {
            user = await prisma.usuarios.update({
                where: { Id: user.Id },
                data: { googleId: data.googleId },
            });
        } else {
            // Si no existe ningún usuario, crear uno nuevo
            user = await prisma.usuarios.create({
                data: {
                    Nombre: data.nombre,
                    Apellido: data.apellido,
                    Correo: data.email,
                    googleId: data.googleId,
                    contrasena: null, // Usuario OAuth no necesita contraseña
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

export const AuthRepository = {
    findUserByEmail,
    createUser,
    findUserByGoogleId,
    findOrCreateGoogleUser,
};