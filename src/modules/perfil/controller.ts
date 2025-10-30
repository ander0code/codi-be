import type { Request, Response } from 'express';
import { PerfilService } from './services.js';
import { customParse } from '@/lib/zod.js';
import { ValidationError } from '@/config/errors/errors.js';
import { GetPerfilParamsSchema, UpdatePerfilSchema } from './schemas.js';

export async function getPerfil(req: Request, res: Response) {
    const validation = customParse(GetPerfilParamsSchema, { userId: req.params.userId });
    
    if (!validation.success) {
        throw new ValidationError(validation.message);
    }

    const { data, message } = await PerfilService.getPerfilData(validation.data);
    res.success(data, message);
}

export async function updatePerfil(req: Request, res: Response) {
    const paramsValidation = customParse(GetPerfilParamsSchema, { userId: req.params.userId });
    
    if (!paramsValidation.success) {
        throw new ValidationError(paramsValidation.message);
    }

    const bodyValidation = customParse(UpdatePerfilSchema, req.body);
    
    if (!bodyValidation.success) {
        throw new ValidationError(bodyValidation.message);
    }

    const { data, message } = await PerfilService.updatePerfilData(
        paramsValidation.data,
        bodyValidation.data
    );
    res.success(data, message);
}