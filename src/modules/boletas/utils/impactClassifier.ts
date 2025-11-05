import { huellaCarbonoPorSupermercado, obtenerUmbrales } from './conts.js';
import logger from '@/config/logger.js';

// ✅ MEJORADO: Tipo estricto
export interface ImpactoProducto {
    nivel: 'bajo' | 'medio' | 'alto';
    esEco: boolean;
    umbralUsado: { bajo: number; medio: number; alto: number };
    co2ePorKg: number;
}

/**
 * Clasifica el impacto ambiental de un producto según su CO2 y categoría
 * ✅ MEJORADO: Manejo de errores y logs
 */
export function clasificarImpactoProducto(
    supermercado: string,
    categoria: string,
    co2ePorKg: number
): ImpactoProducto {
    // Obtener umbrales de forma segura
    const regla = obtenerUmbrales(supermercado, categoria);
    
    if (!regla) {
        logger.warn('⚠️ No se encontró regla de clasificación, usando umbral por defecto', { 
            supermercado, 
            categoria 
        });
        
        // Umbral por defecto
        const umbralDefault = { bajo: 3.0, medio: 7.0, alto: Infinity };
        
        if (co2ePorKg <= umbralDefault.bajo) {
            return { nivel: 'bajo', esEco: true, umbralUsado: umbralDefault, co2ePorKg };
        }
        if (co2ePorKg <= umbralDefault.medio) {
            return { nivel: 'medio', esEco: false, umbralUsado: umbralDefault, co2ePorKg };
        }
        return { nivel: 'alto', esEco: false, umbralUsado: umbralDefault, co2ePorKg };
    }
    
    const { umbrales } = regla;
    
    // Clasificar según umbrales
    if (co2ePorKg <= umbrales.bajo) {
        logger.debug('✅ Producto clasificado como bajo impacto', { 
            supermercado, 
            categoria, 
            co2ePorKg, 
            umbral: umbrales.bajo 
        });
        return { nivel: 'bajo', esEco: true, umbralUsado: umbrales, co2ePorKg };
    }
    
    if (co2ePorKg <= umbrales.medio) {
        logger.debug('⚠️ Producto clasificado como medio impacto', { 
            supermercado, 
            categoria, 
            co2ePorKg, 
            umbral: umbrales.medio 
        });
        return { nivel: 'medio', esEco: false, umbralUsado: umbrales, co2ePorKg };
    }
    
    logger.debug('🔴 Producto clasificado como alto impacto', { 
        supermercado, 
        categoria, 
        co2ePorKg, 
        umbral: umbrales.medio 
    });
    return { nivel: 'alto', esEco: false, umbralUsado: umbrales, co2ePorKg };
}