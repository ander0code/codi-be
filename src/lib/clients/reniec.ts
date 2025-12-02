/**
 * Cliente para la API de RENIEC (CODART)
 * Permite validar DNI y obtener datos de personas naturales en Perú
 */

import logger from '@/config/logger.js';

const RENIEC_API_BASE_URL = process.env.RENIEC_API_BASE_URL || 'https://api.codart.cgrt.net/api/v1/consultas/reniec/dni';
const RENIEC_API_TOKEN = process.env.RENIEC_API_TOKEN;

/**
 * Respuesta de la API de RENIEC
 */
export interface ReniecApiResponse {
    success: boolean;
    source: string;
    result: {
        first_name: string;
        first_last_name: string;
        second_last_name: string;
        full_name: string;
        tipo_documento: string;
        document_number: string;
        birth_date: string;
        gender: string;
        nationality: string;
        address: string;
        district: string;
        province: string;
        department: string;
        phone: string;
        email: string;
    };
}

/**
 * Datos procesados de RENIEC
 */
export interface ReniecData {
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    nombreCompleto: string;
    dni: string;
    nacionalidad: string;
}

/**
 * Resultado de la validación
 */
export interface ReniecValidationResult {
    isValid: boolean;
    data?: ReniecData;
    error?: string;
    statusCode?: number;
}

/**
 * Valida un DNI en RENIEC y obtiene los datos de la persona
 * 
 * @param dni - Número de DNI a validar (8 dígitos)
 * @returns Resultado de la validación con los datos de la persona
 */
export async function validateDniInReniec(dni: string): Promise<ReniecValidationResult> {
    try {
        // Validar que el token esté configurado
        if (!RENIEC_API_TOKEN) {
            logger.error('RENIEC_API_TOKEN no está configurado en las variables de entorno');
            return {
                isValid: false,
                error: 'Servicio de validación de DNI no disponible',
                statusCode: 500
            };
        }

        // Validar formato de DNI
        if (!/^\d{8}$/.test(dni)) {
            logger.warn('Formato de DNI inválido', { dni });
            return {
                isValid: false,
                error: 'El DNI debe tener exactamente 8 dígitos numéricos',
                statusCode: 400
            };
        }

        const url = `${RENIEC_API_BASE_URL}/${dni}`;

        logger.info('Validando DNI en RENIEC', { dni, url });

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RENIEC_API_TOKEN}`
            }
        });

        const data: ReniecApiResponse = await response.json();

        // Manejar errores HTTP
        if (!response.ok) {
            const errorMessage = (data as any).message || 'Error al consultar RENIEC';

            if (response.status === 404) {
                logger.warn('DNI no encontrado en RENIEC', { dni });
                return {
                    isValid: false,
                    error: 'DNI no encontrado en RENIEC',
                    statusCode: 404
                };
            }

            if (response.status === 400) {
                logger.warn('Formato de DNI inválido según RENIEC', { dni });
                return {
                    isValid: false,
                    error: 'Formato de DNI inválido',
                    statusCode: 400
                };
            }

            logger.error('Error al consultar RENIEC', {
                dni,
                status: response.status,
                error: errorMessage
            });

            return {
                isValid: false,
                error: errorMessage,
                statusCode: response.status
            };
        }

        // Validar que la respuesta tenga los datos esperados
        if (!data.success || !data.result) {
            logger.error('Respuesta inválida de RENIEC', { dni, data });
            return {
                isValid: false,
                error: 'Respuesta inválida del servicio de RENIEC',
                statusCode: 500
            };
        }

        // Procesar y retornar los datos
        const reniecData: ReniecData = {
            nombres: data.result.first_name,
            apellidoPaterno: data.result.first_last_name,
            apellidoMaterno: data.result.second_last_name,
            nombreCompleto: data.result.full_name,
            dni: data.result.document_number,
            nacionalidad: data.result.nationality
        };

        logger.info('DNI validado exitosamente en RENIEC', {
            dni,
            nombreCompleto: reniecData.nombreCompleto
        });

        return {
            isValid: true,
            data: reniecData
        };

    } catch (error) {
        logger.error('Error al validar DNI en RENIEC', {
            dni,
            error: error instanceof Error ? error.message : 'Error desconocido'
        });

        return {
            isValid: false,
            error: 'Error al conectar con el servicio de validación de DNI',
            statusCode: 500
        };
    }
}

/**
 * Verifica si los datos proporcionados coinciden con los de RENIEC
 * 
 * @param dni - DNI a validar
 * @param nombres - Nombres proporcionados por el usuario
 * @param apellidoPaterno - Apellido paterno proporcionado
 * @param apellidoMaterno - Apellido materno proporcionado (opcional)
 * @returns true si los datos coinciden, false en caso contrario
 */
export async function verifyPersonData(
    dni: string,
    nombres: string,
    apellidoPaterno: string,
    apellidoMaterno?: string
): Promise<{ matches: boolean; reniecData?: ReniecData; error?: string }> {
    const validation = await validateDniInReniec(dni);

    if (!validation.isValid || !validation.data) {
        return {
            matches: false,
            error: validation.error || 'No se pudo validar el DNI'
        };
    }

    // Normalizar strings para comparación (mayúsculas, sin tildes, sin espacios extra)
    const normalize = (str: string) =>
        str.toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();

    const nombresMatch = normalize(nombres) === normalize(validation.data.nombres);
    const apellidoPaternoMatch = normalize(apellidoPaterno) === normalize(validation.data.apellidoPaterno);

    let apellidoMaternoMatch = true;
    if (apellidoMaterno) {
        apellidoMaternoMatch = normalize(apellidoMaterno) === normalize(validation.data.apellidoMaterno);
    }

    const matches = nombresMatch && apellidoPaternoMatch && apellidoMaternoMatch;

    if (!matches) {
        logger.warn('Los datos proporcionados no coinciden con RENIEC', {
            dni,
            proporcionado: { nombres, apellidoPaterno, apellidoMaterno },
            reniec: validation.data
        });
    }

    return {
        matches,
        reniecData: validation.data
    };
}

export default {
    validateDniInReniec,
    verifyPersonData
};
