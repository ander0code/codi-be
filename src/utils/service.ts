import type { ServiceResponse } from '@/types/service.js';
import type { z } from 'zod';

/**
 * Opciones para crear una respuesta de servicio validada
 */
interface CreateServiceResponseOptions<T> {
	/** Mensaje descriptivo de la operación */
	message: string;
	/** Datos a validar con el schema */
	data: unknown;
	/** Schema de Zod para validar los datos (puede ser array o individual) */
	schema: z.ZodSchema<T>;
}

/**
 * Crea una respuesta de servicio validando con el schema proporcionado
 * @param options Objeto con message, data y schema
 * @returns ServiceResponse con datos validados
 *
 * Para schemas de arrays usa z.array(MiSchema)
 * Para schemas individuales usa directamente el schema
 */
export function createServiceResponse<T>(options: CreateServiceResponseOptions<T>): ServiceResponse<T> {
	const { message, data, schema } = options;

	// Validamos usando el schema tal cual está definido
	// Si es un array se debe usar schema.array() o z.array(schema)
	const validatedData = schema.parse(data);

	return { message, data: validatedData };
}

/**
 * Versión segura que no lanza errores, sino que retorna el resultado de la validación
 */
export function createSafeServiceResponse<T>(options: {
	message: string;
	data: unknown;
	schema: z.ZodSchema<T>;
}): { success: true; response: ServiceResponse<T> } | { success: false; error: z.ZodError } {
	const { message, data, schema } = options;
	const result = schema.safeParse(data);

	if (!result.success) {
		return { success: false, error: result.error };
	}

	return {
		success: true,
		response: { message, data: result.data },
	};
}
