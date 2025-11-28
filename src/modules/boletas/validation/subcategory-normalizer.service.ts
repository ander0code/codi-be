import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from '@/config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface MapeoSubcategorias {
    version: string;
    fecha_actualizacion: string;
    descripcion: string;
    supermercados: string[];
    mapeos: Record<string, string[]>;
}

// Cargar mapeo de subcategorías
const mapeoPath = join(__dirname, '../../../json/mapeo_subcategorias.json');
const mapeoRaw = readFileSync(mapeoPath, 'utf-8');
const mapeoSubcategorias: MapeoSubcategorias = JSON.parse(mapeoRaw);

/**
 * Normaliza una subcategoría de Qdrant a su clave maestra en tabla_maestra.json
 * 
 * Busca la subcategoría en todas las listas de variantes del mapeo y retorna
 * la clave maestra correspondiente. Si no encuentra coincidencia, retorna
 * la subcategoría original.
 * 
 * @param subcategoriaOriginal - Subcategoría extraída de Qdrant
 * @returns Clave maestra que existe en tabla_maestra.json
 * 
 * @example
 * normalizarSubcategoria('Quesos Blandos') // → 'Quesos Blandos'
 * normalizarSubcategoria('Quesos Blando')  // → 'Quesos Blandos' (si está en mapeo)
 * normalizarSubcategoria('Carne de Cerdo') // → 'Cerdo'
 */
function normalizarSubcategoria(subcategoriaOriginal: string): string {
    if (!subcategoriaOriginal) {
        logger.warn('⚠️ Subcategoría vacía, retornando "Sin categoría"');
        return 'Sin categoría';
    }

    // Buscar en qué lista de variantes está la subcategoría
    for (const [claveMaestra, variantes] of Object.entries(mapeoSubcategorias.mapeos)) {
        if (variantes.includes(subcategoriaOriginal)) {
            if (claveMaestra !== subcategoriaOriginal) {
                logger.debug('✅ Subcategoría normalizada', {
                    original: subcategoriaOriginal,
                    normalizada: claveMaestra,
                });
            }
            return claveMaestra;
        }
    }

    // Si no encuentra coincidencia, retorna la original
    logger.debug('⚠️ Subcategoría no encontrada en mapeo, usando original', {
        subcategoria: subcategoriaOriginal,
    });

    return subcategoriaOriginal;
}

/**
 * Obtiene la clave maestra para una subcategoría
 * Retorna null si no encuentra coincidencia
 */
function obtenerClaveMaestra(subcategoriaOriginal: string): string | null {
    if (!subcategoriaOriginal) {
        return null;
    }

    for (const [claveMaestra, variantes] of Object.entries(mapeoSubcategorias.mapeos)) {
        if (variantes.includes(subcategoriaOriginal)) {
            return claveMaestra;
        }
    }

    return null;
}

export const SubcategoryNormalizer = {
    normalizarSubcategoria,
    obtenerClaveMaestra,
};
