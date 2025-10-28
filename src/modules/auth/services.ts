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

    const payload = {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
    };

    const token = signToken(payload);
    const refreshToken = signRefreshToken(payload);

    logger.info('Usuario registrado', { userId: user.id, email: user.email });

    return {
        message: 'Usuario registrado exitosamente',
        data: { user, token, refreshToken },
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

    const payload = {
        id: publicUser.id,
        email: publicUser.email,
        nombre: publicUser.nombre,
        apellido: publicUser.apellido,
    };

    const token = signToken(payload);
    const refreshToken = signRefreshToken(payload);

    logger.info('Usuario autenticado', { userId: publicUser.id, email: publicUser.email });

    return {
        message: 'Inicio de sesión exitoso',
        data: { user: publicUser, token, refreshToken },
    };
}


async function refreshToken(input: RefreshTokenInput): Promise<ServiceResponse<AuthResponse>> {
    try {
        const decoded = verifyToken(input.refreshToken);

        const user = await AuthRepository.findUserByEmail(decoded.email);
        if (!user) {
            throw new AuthError('Usuario no encontrado');
        }

        const { contrasena, ...publicUser } = user;

        const payload = {
            id: publicUser.id,
            email: publicUser.email,
            nombre: publicUser.nombre,
            apellido: publicUser.apellido,
        };

        const newAccessToken = signToken(payload);
        const newRefreshToken = signRefreshToken(payload);

        logger.info('Token refrescado para el usuario', { userId: publicUser.id });

        return {
            message: 'Token refrescado exitosamente',
            data: {
                user: publicUser,
                token: newAccessToken,
                refreshToken: newRefreshToken,
            },
        };
    } catch (error) {
        logger.warn('Intento de refrescar token inválido', { error: (error as Error).message });
        throw new AuthError('Refresh token inválido o expirado');
    }
}

export const AuthService = {
    register,
    login,
    refreshToken
};