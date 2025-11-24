import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from '@/config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export interface RangosCO2 {
    huella_media_kg_co2_por_kg: number;
    rango_min: number;
    rango_max: number;
    verde_hasta: number;
    amarillo_hasta: number;
    rojo_desde: number;
    fuentes: string[];
    notas: string;
}

export interface TablaMaestra {
    version: string;
    fecha_actualizacion: string;
    metodologia: string;
    subcategorias: Record<string, RangosCO2>;
}

export interface ValidacionCO2 {
    nivel: 'verde' | 'amarillo' | 'rojo';
    mensaje: string;
    co2Calculado: number;
    rangos: {
        verde_hasta: number;
        amarillo_hasta: number;
        rojo_desde: number;
        huella_media: number;
    };
    fuentes: string[];
}


const tablaMaestraPath = join(__dirname, '../../../json/tabla_maestra.json');
const tablaMaestraRaw = readFileSync(tablaMaestraPath, 'utf-8');
export const tablaMaestra: TablaMaestra = JSON.parse(tablaMaestraRaw);

export function getRangosPorSubcategoria(subcategoria: string): RangosCO2 | null {
    const rangos = tablaMaestra.subcategorias[subcategoria];

    if (!rangos) {
        logger.warn('⚠️ Subcategoría no encontrada en tabla maestra', { subcategoria });
        return null;
    }

    return rangos;
}

export function validarCO2(
    subcategoria: string,
    co2Calculado: number
): ValidacionCO2 {
    const rangos = getRangosPorSubcategoria(subcategoria);

    if (!rangos) {
        logger.warn('⚠️ Usando rangos por defecto para subcategoría desconocida', {
            subcategoria,
            co2Calculado
        });

        const rangosPorDefecto = {
            verde_hasta: 2.0,
            amarillo_hasta: 5.0,
            rojo_desde: 5.0,
            huella_media: 3.0
        };

        if (co2Calculado <= rangosPorDefecto.verde_hasta) {
            return {
                nivel: 'verde',
                mensaje: 'Bajo impacto ambiental (estimado)',
                co2Calculado,
                rangos: rangosPorDefecto,
                fuentes: ['Estimado - subcategoría no encontrada']
            };
        }

        if (co2Calculado <= rangosPorDefecto.amarillo_hasta) {
            return {
                nivel: 'amarillo',
                mensaje: 'Impacto moderado (estimado)',
                co2Calculado,
                rangos: rangosPorDefecto,
                fuentes: ['Estimado - subcategoría no encontrada']
            };
        }

        return {
            nivel: 'rojo',
            mensaje: 'Alto impacto ambiental (estimado)',
            co2Calculado,
            rangos: rangosPorDefecto,
            fuentes: ['Estimado - subcategoría no encontrada']
        };
    }

    const rangosSimplificados = {
        verde_hasta: rangos.verde_hasta,
        amarillo_hasta: rangos.amarillo_hasta,
        rojo_desde: rangos.rojo_desde,
        huella_media: rangos.huella_media_kg_co2_por_kg
    };

    if (co2Calculado <= rangos.verde_hasta) {
        logger.debug('✅ Producto clasificado como VERDE', {
            subcategoria,
            co2Calculado,
            umbral: rangos.verde_hasta
        });

        return {
            nivel: 'verde',
            mensaje: 'Bajo impacto ambiental',
            co2Calculado,
            rangos: rangosSimplificados,
            fuentes: rangos.fuentes
        };
    }

    if (co2Calculado <= rangos.amarillo_hasta) {
        logger.debug('⚠️ Producto clasificado como AMARILLO', {
            subcategoria,
            co2Calculado,
            umbral: rangos.amarillo_hasta
        });

        return {
            nivel: 'amarillo',
            mensaje: 'Impacto moderado',
            co2Calculado,
            rangos: rangosSimplificados,
            fuentes: rangos.fuentes
        };
    }

    logger.debug('🔴 Producto clasificado como ROJO', {
        subcategoria,
        co2Calculado,
        umbral: rangos.rojo_desde
    });

    return {
        nivel: 'rojo',
        mensaje: 'Alto impacto ambiental',
        co2Calculado,
        rangos: rangosSimplificados,
        fuentes: rangos.fuentes
    };
}


export function getSubcategoriasDisponibles(): string[] {
    return Object.keys(tablaMaestra.subcategorias);
}

export function buscarSubcategoria(nombreParcial: string): string[] {
    const nombreNormalizado = nombreParcial.toLowerCase();

    return Object.keys(tablaMaestra.subcategorias).filter(subcat =>
        subcat.toLowerCase().includes(nombreNormalizado)
    );
}
