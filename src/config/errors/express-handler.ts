import { type Request, type Response, type NextFunction } from 'express';

import logger from '../logger.js';

function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): any {
	if (res.headersSent) {
		logger.error(err.message, { stack: err.stack, method: req.method, url: req.originalUrl, headersSent: true });
		return next(err);
	}

	if (err.isOperational) {
		logger.warn(err.message, { stack: err.stack, method: req.method, url: req.originalUrl });
		return res.status(err.statusCode ?? 400).json({
			success: false,
			message: err.message,
		});
	}

	logger.error(err.message, { stack: err.stack, method: req.method, url: req.originalUrl });
	return res.status(500).json({
		success: false,
		message: 'Ha ocurrido un error interno. Intenta más tarde.',
	});
}

export default errorHandler;
