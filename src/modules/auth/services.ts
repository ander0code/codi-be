import type { ServiceResponse } from '@/types/service.js';
import { AuthRepository } from './repository.js';
import { hashPassword, comparePassword } from '@/lib/hash.js';
import { signToken } from '@/lib/jwt.js';
import { AuthError, ConflictError } from '@/config/errors/errors.js';
import type { RegisterInput, LoginInput, AuthResponse } from './schemas.js';

async function register(input: RegisterInput): Promise<ServiceResponse<AuthResponse>> {
    const existingUser = await AuthRepository.findUserByEmail(input.email);
    if (existingUser) {
        throw new ConflictError('El correo electrónico ya está registrado');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await AuthRepository.createUser({ ...input, passwordHash });

    const token = signToken({
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido
    });

    logger.info('Usuario registrado', { userId: user.id, email: user.email });

    return {
        message: 'Usuario registrado exitosamente',
        data: { user, token },
    };
}

async function login(input: LoginInput): Promise<ServiceResponse<AuthResponse>> {
    const user = await AuthRepository.findUserByEmail(input.email);
    if (!user) {
        throw new AuthError('Credenciales inválidas');
    }

    const isPasswordValid = await comparePassword(input.password, user.contrasena);
    if (!isPasswordValid) {
        throw new AuthError('Credenciales inválidas');
    }

    const { contrasena, ...publicUser } = user;

    const token = signToken({
        id: publicUser.id,
        email: publicUser.email,
        nombre: publicUser.nombre,
        apellido: publicUser.apellido
    });

    logger.info('Usuario autenticado', { userId: publicUser.id, email: publicUser.email });

    return {
        message: 'Inicio de sesión exitoso',
        data: { user: publicUser, token },
    };
}

export const AuthService = {
    register,
    login,
};