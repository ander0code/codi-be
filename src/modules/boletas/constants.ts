/**
 * Mapeo de nombres de supermercados a colecciones de Qdrant
 * Cada supermercado tiene su propia colección vectorial
 */
export const SUPERMERCADO_TO_COLLECTION: Record<string, string> = {
    'wong': 'wong',
    'vivanda': 'vivanda',
    'tottus': 'tottus',
    'plazavea': 'plazavea',
    'plaza vea': 'plazavea', // Alias
    'metro': 'metro',
    'flora_y_fauna': 'flora_y_fauna',
};

/**
 * Lista de supermercados reconocidos
 */
export const SUPERMERCADOS_RECONOCIDOS = Object.keys(SUPERMERCADO_TO_COLLECTION);

/**
 * Colección por defecto si no se detecta el supermercado
 */
export const COLECCION_POR_DEFECTO = 'tottus';