import type { Request, Response } from 'express';
import { GoogleOAuthService } from './google-oauth.service.js';
import { customParse } from '@/lib/zod.js';
import { ValidationError } from '@/config/errors/errors.js';
import { z } from 'zod';

// Schema para validar el idToken
const GoogleLoginSchema = z.object({
    idToken: z.string().min(1, 'El idToken de Google es requerido'),
});

export async function googleLoginController(req: Request, res: Response) {
    const validation = customParse(GoogleLoginSchema, req.body);
    
    if (!validation.success) {
        throw new ValidationError(validation.message);
    }
    
    const { data, message } = await GoogleOAuthService.loginWithGoogle(
        validation.data.idToken
    );
    
    res.success(data, message);
}