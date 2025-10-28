import prisma from '@/lib/clients/prisma.js';
import type { RegisterInput, UserResponse } from './schemas.js';

async function findUserByEmail(email: string): Promise<(UserResponse & { contrasena: string }) | null> {
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
    };
}

async function createUser(data: RegisterInput & { passwordHash: string }): Promise<UserResponse> {
    const user = await prisma.usuarios.create({
        data: {
            Nombre: data.nombre,
            Apellido: data.apellido,
            Correo: data.email,
            contrasena: data.passwordHash,
        },
    });
    return {
        id: user.Id,
        nombre: user.Nombre,
        apellido: user.Apellido,
        email: user.Correo,
    };
}

export const AuthRepository = {
    findUserByEmail,
    createUser,
};