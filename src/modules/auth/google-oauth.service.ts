import { OAuth2Client } from 'google-auth-library';
import { env } from '@/config/env.js';
import { AuthRepository } from './repository.js';
import { AuthError } from '@/config/errors/errors.js';
import { signToken, signRefreshToken } from '@/lib/jwt.js';
import logger from '@/config/logger.js';
import type { ServiceResponse } from '@/types/service.js';
import type { AuthResponse } from './schemas.js';

const client = new OAuth2Client(env.google.clientId);

interface GoogleUserInfo {
    email: string;
    nombre: string;
    apellido: string;
    googleId: string;
}

/**
 * Verifica el idToken de Google y extrae información del usuario
 */
async function verifyGoogleToken(idToken: string): Promise<GoogleUserInfo> {
    try {
        logger.info('🔍 Verificando token de Google...');
        
        const ticket = await client.verifyIdToken({
            idToken,
            audience: env.google.clientId,
        });
        
        const payload = ticket.getPayload();
        
        if (!payload) {
            throw new AuthError('Token de Google inválido: payload vacío');
        }
        
        if (!payload.email) {
            throw new AuthError('Token de Google no contiene email');
        }
        
        logger.info('✅ Token de Google verificado', { 
            email: payload.email,
            sub: payload.sub 
        });
        
        return {
            email: payload.email,
            nombre: payload.given_name || 'Usuario',
            apellido: payload.family_name || 'Codi',
            googleId: payload.sub,
        };
    } catch (error) {
        logger.error('❌ Error verificando token de Google', { error });
        throw new AuthError('Token de Google inválido o expirado');
    }
}

/**
 * Procesa el login con Google desde aplicación móvil
 */
async function loginWithGoogle(idToken: string): Promise<ServiceResponse<AuthResponse>> {
    try {
        // 1. Verificar token con Google
        const googleUser = await verifyGoogleToken(idToken);
        
        // 2. Buscar o crear usuario
        logger.info('👤 Buscando o creando usuario...', { email: googleUser.email });
        
        const user = await AuthRepository.findOrCreateGoogleUser({
            googleId: googleUser.googleId,
            email: googleUser.email,
            nombre: googleUser.nombre,
            apellido: googleUser.apellido,
            proveedorAuth: 'google',
        });
        
        logger.info('✅ Usuario encontrado/creado', { userId: user.id });
        
        // 3. Generar tokens JWT propios
        const payload = {
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            apellido: user.apellido,
        };
        
        const token = signToken(payload);
        const refreshToken = signRefreshToken(payload);
        
        logger.info('✅ Login con Google exitoso (móvil)', { 
            userId: user.id,
            email: user.email 
        });
        
        return {
            message: 'Inicio de sesión exitoso con Google',
            data: {
                user: {
                    id: user.id,
                    nombre: user.nombre,
                    apellido: user.apellido,
                    email: user.email,
                    proveedorAuth: user.proveedorAuth || 'google',
                },
                token,
                refreshToken,
            },
        };
    } catch (error) {
        if (error instanceof AuthError) {
            throw error;
        }
        logger.error('❌ Error en login con Google', { error });
        throw new AuthError('Error al procesar login con Google');
    }
}

export const GoogleOAuthService = {
    verifyGoogleToken,
    loginWithGoogle,
};