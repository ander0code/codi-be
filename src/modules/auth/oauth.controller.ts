import type { Request, Response } from 'express';
import { getTempUserData } from '@/lib/clients/auth.js';
import { signToken, signRefreshToken } from '@/lib/jwt.js';
import { AuthError } from '@/config/errors/errors.js';
import logger from '@/config/logger.js';

export async function oauthSuccessController(req: Request, res: Response) {
    try {
        const userData = getTempUserData();

        if (!userData) {
            logger.error('❌ No hay datos de usuario después del OAuth');
            throw new AuthError('Error en autenticación OAuth');
        }

        logger.info('✅ Generando tokens JWT para usuario OAuth', { 
            userId: userData.id,
            email: userData.email 
        });

        const payload = {
            id: userData.id,
            email: userData.email,
            nombre: userData.nombre,
            apellido: userData.apellido,
        };

        const token = signToken(payload);
        const refreshToken = signRefreshToken(payload);

        logger.info('✅ Login OAuth exitoso', { 
            userId: userData.id,
            email: userData.email 
        });

        return res.success({
            user: {
                id: userData.id,
                nombre: userData.nombre,
                apellido: userData.apellido,
                email: userData.email,
            },
            token,
            refreshToken,
        }, 'Inicio de sesión exitoso con Google');

    } catch (error) {
        logger.error('❌ Error en oauthSuccessController', { 
            error: error instanceof Error ? error.message : error 
        });
        
        return res.error(
            error instanceof Error ? error : new Error('Error en autenticación OAuth'),
            500
        );
    }
}