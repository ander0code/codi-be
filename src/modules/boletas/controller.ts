import type { Request, Response } from 'express';
import { BoletasService } from './services.js';
import { customParse } from '@/lib/zod.js';
import { ValidationError } from '@/config/errors/errors.js';
import { SubirBoletaSchema } from './schemas.js';
import logger from '@/config/logger.js';

export async function uploadBoleta(req: Request, res: Response) {
    // Validar que exista userId en params
    const validation = customParse(SubirBoletaSchema, { 
        userId: req.params.userId 
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
    });
    
    // Procesar boleta
    const { data, message } = await BoletasService.procesarBoleta(
        validation.data.userId,
        req.file.buffer,
        req.file.originalname
    );
    
    res.success(data, message);
}