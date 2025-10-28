import { Router } from 'express';

/**
 * Parcha Express Router para manejar automáticamente errores async
 * Compatible con Express 5 - reemplazo directo de express-async-errors
 */

// Guarda las funciones originales
const originalRouterMethods = {
	get: Router.prototype.get,
	post: Router.prototype.post,
	put: Router.prototype.put,
	patch: Router.prototype.patch,
	delete: Router.prototype.delete,
	use: Router.prototype.use,
	all: Router.prototype.all,
};

// Función para envolver handlers
function wrapHandler(handler: any) {
    if (typeof handler !== 'function') return handler;

    // Si el handler es un error-handler (4 args), conservar la aridad
    if (handler.length === 4) {
        return function wrappedErrorHandler(this: any, err: any, req: any, res: any, next: any) {
            try {
                const result = handler.apply(this, [err, req, res, next]);
                if (result && typeof result.catch === 'function') {
                    result.catch(next);
                }
                return result;
            } catch (error) {
                if (typeof next === 'function') return next(error);
                throw error;
            }
        };
    }

    return function wrappedHandler(this: any, ...args: any[]) {
        try {
            const result = handler.apply(this, args);

            // Si es una promesa, capturar errores y pasarlos a next
            if (result && typeof result.catch === 'function') {
                const next = args[args.length - 1];
                if (typeof next === 'function') {
                    result.catch(next);
                }
            }

            return result;
        } catch (error) {
            const next = args[args.length - 1];
            if (typeof next === 'function') {
                next(error);
            } else {
                throw error;
            }
        }
    };
}

// Función para envolver todos los handlers de una ruta
function wrapHandlers(handlers: any[]): any[] {
	return handlers.map(wrapHandler);
}

// Parchar métodos HTTP
(['get', 'post', 'put', 'patch', 'delete', 'all'] as const).forEach((method) => {
	Router.prototype[method] = function (this: any, ...args: any[]) {
		const path = args[0];
		const handlers = args.slice(1);

		return originalRouterMethods[method].call(this, path, ...wrapHandlers(handlers));
	};
});

Router.prototype.use = function (this: any, ...args: any[]) {
	// Si el primer argumento es un string, es un path
	if (typeof args[0] === 'string') {
		const path = args[0];
		const handlers = args.slice(1);
		return originalRouterMethods.use.call(this, path, ...wrapHandlers(handlers));
	} else {
		// Solo handlers
		return originalRouterMethods.use.call(this, ...wrapHandlers(args));
	}
};
