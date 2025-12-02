/**
 * Helper para obtener rangos ambientales desde la tabla maestra
 * Usado para mostrar visualización de rangos verde/amarillo/rojo
 */

import tablaMaestra from '@/json/tabla_maestra.json' with { type: 'json' };
import logger from '@/config/logger.js';

export interface RangosAmbientales {
    subcategoria: string;
    huella_media_kg_co2_por_kg: number;
    rango_min: number;
    rango_max: number;
    rangos: {
        verde: {
            min: number;
            max: number;
            label: string;
            color: string;
        };
        amarillo: {
            min: number;
            max: number;
            label: string;
            color: string;
        };
        rojo: {
            min: number;
            max: number | null;
            label: string;
            color: string;
        };
    };
    tuPosicion: {
        valor: number;
        zona: 'VERDE' | 'AMARILLO' | 'ROJO';
        porcentajeEnZona: number;
        mensaje: string;
    };
}

/**
 * Obtiene los rangos ambientales de una subcategoría y calcula la posición del producto
 */
export function obtenerRangosAmbientales(
    subcategoria: string | null,
    co2PorKg: number
): RangosAmbientales | null {
    if (!subcategoria) {
        logger.warn('Subcategoría no proporcionada para obtener rangos');
        return null;
    }

    // Buscar en tabla maestra
    const datosSubcategoria = (tablaMaestra as any).subcategorias[subcategoria];

    if (!datosSubcategoria) {
        logger.warn('Subcategoría no encontrada en tabla maestra', { subcategoria });
        return null;
    }

    // Determinar en qué zona está el producto
    let zona: 'VERDE' | 'AMARILLO' | 'ROJO';
    let mensaje: string;
    let porcentajeEnZona: number;

    if (co2PorKg <= datosSubcategoria.verde_hasta) {
        zona = 'VERDE';
        mensaje = '¡Excelente elección! Este producto tiene un bajo impacto ambiental';
        porcentajeEnZona = (co2PorKg / datosSubcategoria.verde_hasta) * 100;
    } else if (co2PorKg <= datosSubcategoria.amarillo_hasta) {
        zona = 'AMARILLO';
        mensaje = 'Este producto tiene un impacto ambiental moderado';
        const rangoAmarillo = datosSubcategoria.amarillo_hasta - datosSubcategoria.verde_hasta;
        const posicionEnAmarillo = co2PorKg - datosSubcategoria.verde_hasta;
        porcentajeEnZona = (posicionEnAmarillo / rangoAmarillo) * 100;
    } else {
        zona = 'ROJO';
        mensaje = 'Este producto tiene un alto impacto ambiental. Considera alternativas más sostenibles';
        const rangoRojo = datosSubcategoria.rango_max - datosSubcategoria.rojo_desde;
        const posicionEnRojo = co2PorKg - datosSubcategoria.rojo_desde;
        porcentajeEnZona = Math.min((posicionEnRojo / rangoRojo) * 100, 100);
    }

    return {
        subcategoria,
        huella_media_kg_co2_por_kg: datosSubcategoria.huella_media_kg_co2_por_kg,
        rango_min: datosSubcategoria.rango_min,
        rango_max: datosSubcategoria.rango_max,
        rangos: {
            verde: {
                min: 0,
                max: datosSubcategoria.verde_hasta,
                label: 'Bajo impacto',
                color: '#22c55e'
            },
            amarillo: {
                min: datosSubcategoria.verde_hasta,
                max: datosSubcategoria.amarillo_hasta,
                label: 'Impacto moderado',
                color: '#eab308'
            },
            rojo: {
                min: datosSubcategoria.rojo_desde,
                max: null,
                label: 'Alto impacto',
                color: '#ef4444'
            }
        },
        tuPosicion: {
            valor: co2PorKg,
            zona,
            porcentajeEnZona: Math.round(porcentajeEnZona * 10) / 10,
            mensaje
        }
    };
}
