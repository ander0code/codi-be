declare global {
	interface Error {
		statusCode?: number;
		isOperational?: boolean;
		options?: {
			retryable?: boolean;
			status?: number;
			meta?: unknown;
		};
	}

	var logger: {
		trace: (message: string, meta?: any) => void;
		debug: (message: string, meta?: any) => void;
		info: (message: string, meta?: any) => void;
		warn: (message: string, meta?: any) => void;
		error: (message: string, meta?: any) => void;
		fatal: (message: string, meta?: any) => void;
		log: (message: string, ...args: any[]) => void;
		success: (message: string, meta?: any) => void;
		request: (method: string, url: string, meta?: any) => void;
		response: (method: string, url: string, statusCode: number, meta?: any) => void;
	};
}
export {};
