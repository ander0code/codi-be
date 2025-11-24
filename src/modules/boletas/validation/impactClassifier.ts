import { getRangosPorSubcategoria } from '../validation/tablaMaestra.js';
import logger from '@/config/logger.js';

export interface ImpactoProducto {
    nivel: 'bajo' | 'medio' | 'alto';
    esEco: boolean;
    umbralUsado: { bajo: number; medio: number; alto: number };
    co2ePorKg: number;
}


export function clasificarImpactoProducto(
    supermercado: string,
    categoria: string,
    co2ePorKg: number
): ImpactoProducto {

    const rangos = getRangosPorSubcategoria(categoria);

    if (!rangos) {
        logger.warn('⚠️ No se encontró subcategoría en tabla_maestra, usando umbral por defecto', {
            categoria
        });

        const umbralDefault = { bajo: 2.0, medio: 5.0, alto: Infinity };

        if (co2ePorKg <= umbralDefault.bajo) {
            return { nivel: 'bajo', esEco: true, umbralUsado: umbralDefault, co2ePorKg };
        }
        if (co2ePorKg <= umbralDefault.medio) {
            return { nivel: 'medio', esEco: false, umbralUsado: umbralDefault, co2ePorKg };
        }
        return { nivel: 'alto', esEco: false, umbralUsado: umbralDefault, co2ePorKg };
    }

    const umbrales = {
        bajo: rangos.verde_hasta,
        medio: rangos.amarillo_hasta,
        alto: Infinity
    };

    if (co2ePorKg <= umbrales.bajo) {
        logger.debug('✅ Producto clasificado como bajo impacto', {
            categoria,
            co2ePorKg,
            umbral: umbrales.bajo
        });
        return { nivel: 'bajo', esEco: true, umbralUsado: umbrales, co2ePorKg };
    }

    if (co2ePorKg <= umbrales.medio) {
        logger.debug('⚠️ Producto clasificado como medio impacto', {
            categoria,
            co2ePorKg,
            umbral: umbrales.medio
        });
        return { nivel: 'medio', esEco: false, umbralUsado: umbrales, co2ePorKg };
    }

    logger.debug('🔴 Producto clasificado como alto impacto', {
        categoria,
        co2ePorKg,
        umbral: umbrales.medio
    });
    return { nivel: 'alto', esEco: false, umbralUsado: umbrales, co2ePorKg };
}