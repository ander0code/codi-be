import type { Request, Response } from 'express';
import { InicioService } from './services.js';
import { customParse } from '@/lib/zod.js';
import { ValidationError } from '@/config/errors/errors.js';
import { GetInicioParamsSchema } from './schemas.js';

export async function getInicio(req: Request, res: Response) {
    const validation = customParse(GetInicioParamsSchema, { userId: req.params.userId });
    
    if (!validation.success) {
        throw new ValidationError(validation.message);
    }

    const { data, message } = await InicioService.getInicioData(validation.data);
    res.success(data, message);
}