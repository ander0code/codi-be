export class AppError extends Error {
	statusCode: number;
	isOperational: boolean;
	public readonly options?: { retryable?: boolean; status?: number; meta?: unknown };

	constructor(message: string, statusCode = 400) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = true;

		Error.captureStackTrace(this, this.constructor);
	}
}

export class ValidationError extends AppError {
	constructor(message: string) {
		super(message, 400);
		this.isOperational = true;
	}
}

export class AuthError extends AppError {
	constructor(message = 'No autorizado') {
		super(message, 401);
		this.isOperational = true;
	}
}

export class NotFoundError extends AppError {
	constructor(message = 'Recurso no encontrado') {
		super(message, 404);
		this.isOperational = true;
	}
}


export class ConflictError extends AppError {
    constructor(message = 'Conflicto de recursos') {
        super(message, 409);
        this.isOperational = true;
    }
}