import type { Request, Response } from 'express';

import { TestSchema } from './schemas.js';
import { TestService } from './service.js';

import { ValidationError } from '@/config/errors/errors.js';
import { customParse } from '@/lib/zod.js';

export async function testController(req: Request, res: Response): Promise<void> {
	const { body } = req;

	const validation = customParse(TestSchema, body);
	if (!validation.success) throw new ValidationError(validation.message);

	const { data, message } = await TestService.getTestData(body);
	res.success(data, message);
}
