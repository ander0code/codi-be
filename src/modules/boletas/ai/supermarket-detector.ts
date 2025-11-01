import { SUPERMERCADO_TO_COLLECTION, COLECCION_POR_DEFECTO } from '../constants.js';
import logger from '@/config/logger.js';

/**
 * Patrones de búsqueda para cada supermercado
 * Incluye variaciones, errores comunes del OCR y aliases
 */
const PATRONES_SUPERMERCADOS: Record<string, RegExp[]> = {
    'wong': [
        /\bwong\b/i,
        /\bw0ng\b/i, // OCR puede confundir O con 0
        /\bw.?o.?n.?g\b/i, // Espacios o caracteres raros
    ],
    'vivanda': [
        /\bvivanda\b/i,
        /\bv1vanda\b/i,
        /\bv.?i.?v.?a.?n.?d.?a\b/i,
    ],
    'tottus': [
        /\btottus\b/i,
        /\bt0ttus\b/i,
        /\bt.?o.?t.?t.?u.?s\b/i,
    ],
    'plazavea': [
        /\bplaza\s*vea\b/i,
        /\bplazavea\b/i,
        /\bp\.?\s*vea\b/i,
        /\bp.?l.?a.?z.?a.?.?v.?e.?a\b/i,
    ],
    'metro': [
        /\bmetro\b/i,
        /\bmetr0\b/i,
        /\bm.?e.?t.?r.?o\b/i,
    ],
    'flora_y_fauna': [
        /\bflora\s*y\s*fauna\b/i,
        /\bflora\s*&\s*fauna\b/i,
        /\bflora.?fauna\b/i,
        /\bf.?l.?o.?r.?a.?.?f.?a.?u.?n.?a\b/i,
    ],
};

/**
 * Detecta el supermercado usando patrones de texto (SIN IA)
 */
function detectSupermercado(textoOCR: string): string {
    logger.info('🏪 Detectando supermercado con patrones regex...');
    
    // Normalizar texto (eliminar acentos, convertir a minúsculas)
    const textoNormalizado = textoOCR
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Quitar acentos
    
    // Buscar patrones de cada supermercado
    for (const [supermercado, patrones] of Object.entries(PATRONES_SUPERMERCADOS)) {
        for (const patron of patrones) {
            if (patron.test(textoNormalizado)) {
                const coleccion = SUPERMERCADO_TO_COLLECTION[supermercado];
                logger.info('✅ Supermercado detectado', { 
                    detectado: supermercado,
                    coleccion,
                    patron: patron.source 
                });
                return coleccion;
            }
        }
    }
    
    logger.warn(`⚠️ No se detectó supermercado, usando por defecto: ${COLECCION_POR_DEFECTO}`);
    return COLECCION_POR_DEFECTO;
}

/**
 * Normaliza el nombre del supermercado a su colección correspondiente
 */
function normalizeSupermercado(nombre: string): string {
    const normalized = nombre.toLowerCase().trim();
    return SUPERMERCADO_TO_COLLECTION[normalized] || COLECCION_POR_DEFECTO;
}

export const SupermarketDetector = {
    detectSupermercado,
    normalizeSupermercado,
};