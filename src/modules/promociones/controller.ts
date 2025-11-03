import type { Request, Response } from 'express';
import { PromocionesService } from './services.js';
import { customParse } from '@/lib/zod.js';
import { ValidationError } from '@/config/errors/errors.js';
import {
    GetPromocionesQuerySchema,
    GetPromocionDetalleParamsSchema,
    CanjearPromocionSchema,
} from './schemas.js';

export async function getPromociones(req: Request, res: Response) {
    const validation = customParse(GetPromocionesQuerySchema, {
        userId: req.query.userId as string | undefined,
    });

    if (!validation.success) {
        throw new ValidationError(validation.message);
    }

    const { data, message } = await PromocionesService.getPromociones(validation.data);
    res.success(data, message);
}

export async function getPromocionDetalle(req: Request, res: Response) {
    const validation = customParse(GetPromocionDetalleParamsSchema, {
        promocionId: req.params.promocionId,
        userId: req.params.userId,
    });

    if (!validation.success) {
        throw new ValidationError(validation.message);
    }

    const { data, message } = await PromocionesService.getPromocionDetalle(validation.data);
    res.success(data, message);
}

export async function canjearPromocion(req: Request, res: Response) {
    const validation = customParse(CanjearPromocionSchema, req.body);

    if (!validation.success) {
        throw new ValidationError(validation.message);
    }

    const { data, message } = await PromocionesService.canjearPromocion(validation.data);
    res.success(data, message);
}