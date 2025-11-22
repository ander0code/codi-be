import type { Request, Response } from 'express';
import { BoletasService } from './services.js';
import { customParse } from '@/lib/zod.js';
import { ValidationError } from '@/config/errors/errors.js';
import { SubirBoletaSchema, GetBoletaParamsSchema } from './schemas.js';
import logger from '@/config/logger.js';

export async function uploadBoleta(req: Request, res: Response) {
    // Validar que exista userId en params y generateSuggestions en query
    const validation = customParse(SubirBoletaSchema, {
        userId: req.params.userId,
        generateSuggestions: req.query.generateSuggestions === 'true' // ✅ Query param opcional
    });

    if (!validation.success) {
        throw new ValidationError(validation.message);
    }

    // Validar que exista archivo
    if (!req.file) {
        throw new ValidationError('No se ha subido ninguna imagen');
    }

    logger.info('📤 Procesando subida de boleta', {
        userId: validation.data.userId,
        fileName: req.file.originalname,
        size: req.file.size,
        generateSuggestions: validation.data.generateSuggestions,
    });

    // Procesar boleta
    const { data, message } = await BoletasService.procesarBoleta(
        validation.data.userId,
        req.file.buffer,
        req.file.originalname,
        validation.data.generateSuggestions // ✅ Pasar parámetro
    );

    res.success(data, message);
}

export async function getBoleta(req: Request, res: Response) {
    const validation = customParse(GetBoletaParamsSchema, {
        boletaId: req.params.boletaId
    });

    if (!validation.success) {
        throw new ValidationError(validation.message);
    }

    const { data, message } = await BoletasService.getBoletaDetalle(validation.data);
    res.success(data, message);
}