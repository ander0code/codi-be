import type { ServiceResponse } from '@/types/service.js';
import { AuthRepository } from './repository.js';
import { hashPassword, comparePassword } from '@/lib/hash.js';
import { signToken, signRefreshToken, verifyToken } from '@/lib/jwt.js';
import logger from '@/config/logger.js';
import { AuthError, ConflictError, NotFoundError } from '@/config/errors/errors.js';
import { validateDniInReniec } from '@/lib/clients/reniec.js';
import type {
    RegisterInput,
    LoginInput,
    RefreshTokenInput,
    AuthResponse,
    GetUserByDniParams,
    UserBasicInfo
} from './schemas.js';

async function register(input: RegisterInput): Promise<ServiceResponse<AuthResponse>> {
    // 1. Validar DNI en RENIEC y obtener datos
    logger.info('Validando DNI en RENIEC', { dni: input.dni });
    const reniecValidation = await validateDniInReniec(input.dni);

    if (!reniecValidation.isValid || !reniecValidation.data) {
        logger.warn('DNI no válido en RENIEC', {
            dni: input.dni,
            error: reniecValidation.error
        });

        // Lanzar error específico según el tipo de fallo
        if (reniecValidation.statusCode === 404) {
            throw new NotFoundError('El DNI no se encuentra registrado en RENIEC');
        } else if (reniecValidation.statusCode === 400) {
            throw new AuthError('El formato del DNI es inválido');
        } else {
            throw new AuthError(reniecValidation.error || 'No se pudo validar el DNI en RENIEC');
        }
    }

    // Obtener nombres desde RENIEC
    const { nombres, apellidoPaterno, apellidoMaterno } = reniecValidation.data;

    logger.info('DNI validado exitosamente en RENIEC', {
        dni: input.dni,
        nombreCompleto: reniecValidation.data.nombreCompleto
    });

    // 2. Verificar que el email no esté registrado
    const existingUser = await AuthRepository.findUserByEmail(input.email);
    if (existingUser) {
        throw new ConflictError('El correo electrónico ya está registrado');
    }

    // 3. Verificar que el DNI no esté registrado
    const existingDni = await AuthRepository.findUserByDni(input.dni);
    if (existingDni) {
        throw new ConflictError('El DNI ya está registrado');
    }

    // 4. Crear el usuario con datos de RENIEC
    const passwordHash = await hashPassword(input.password);
    const user = await AuthRepository.createUser({
        dni: input.dni,
        nombre: nombres,
        apellido: `${apellidoPaterno} ${apellidoMaterno}`.trim(),
        email: input.email,
        passwordHash
    });

    const payload = {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
    };

    const token = signToken(payload);
    const refreshToken = signRefreshToken(payload);

    logger.info('Usuario registrado exitosamente con datos de RENIEC', {
        userId: user.id,
        email: user.email,
        dni: input.dni,
        nombreCompleto: reniecValidation.data.nombreCompleto,
        validadoReniec: true
    });

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

    if (!user.contrasena) {
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

// ✅ NUEVO: Obtener datos básicos del usuario por DNI
async function getUserByDni(params: GetUserByDniParams): Promise<ServiceResponse<UserBasicInfo>> {
    const user = await AuthRepository.findUserByDni(params.dni);

    if (!user) {
        throw new NotFoundError('Usuario no encontrado con el DNI proporcionado');
    }

    logger.info('Usuario obtenido por DNI', { dni: params.dni });

    return {
        message: 'Usuario obtenido exitosamente',
        data: user,
    };
}

export const AuthService = {
    register,
    login,
    refreshToken,
    getUserByDni, // ✅ NUEVO
};