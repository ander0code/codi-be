import logger from '@/config/logger.js';

/**
 * Mapeo de nombres de colecciones de Qdrant a nombres oficiales de tiendas en DB
 */
const STORE_NAMES: Record<string, string> = {
    'tottus': 'Tottus',
    'wong': 'Wong',
    'vivanda': 'Vivanda',
    'plazavea': 'Plaza Vea',
    'metro': 'Metro',
};


function normalizarNombreTienda(collectionName: string): string {
    const nombreNormalizado = STORE_NAMES[collectionName.toLowerCase()];

    if (!nombreNormalizado) {
        logger.warn('⚠️ Nombre de tienda no reconocido, usando original', {
            collectionName
        });
        return collectionName;
    }

    logger.debug('✅ Nombre de tienda normalizado', {
        original: collectionName,
        normalizado: nombreNormalizado
    });

    return nombreNormalizado;
}

export const StoreNormalizer = {
    normalizarNombreTienda,
};
