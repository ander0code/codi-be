import type { Request, Response } from 'express';
import { HistorialService } from './services.js';
import { customParse } from '@/lib/zod.js';
import { ValidationError } from '@/config/errors/errors.js';
import { GetHistorialParamsSchema } from './schemas.js';

export async function getHistorial(req: Request, res: Response) {
    const validation = customParse(GetHistorialParamsSchema, { userId: req.params.userId });
    
    if (!validation.success) {
        throw new ValidationError(validation.message);
    }

    const { data, message } = await HistorialService.getHistorialData(validation.data);
    res.success(data, message);
}