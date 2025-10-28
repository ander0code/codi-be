import type { Request, Response } from 'express';
import { AuthService } from './services.js';
import { customParse } from '../../lib/zod.js';
import { ValidationError } from '../../config/errors/errors.js';
import { RegisterSchema, LoginSchema } from './schemas.js';

export async function registerController(req: Request, res: Response) {
    const validation = customParse(RegisterSchema, req.body);
    if (!validation.success) {
        throw new ValidationError(validation.message);
    }

    const { data, message } = await AuthService.register(validation.data);
    res.success(data, message);
}

export async function loginController(req: Request, res: Response) {
    const validation = customParse(LoginSchema, req.body);
    if (!validation.success) {
        throw new ValidationError(validation.message);
    }

    const { data, message } = await AuthService.login(validation.data);
    res.success(data, message);
}