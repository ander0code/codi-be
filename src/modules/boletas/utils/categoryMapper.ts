import { tablaMaestra } from './tablaMaestra.js';
import logger from '@/config/logger.js';

/**
 * Diccionario completo de sinónimos y variaciones de categorías por supermercado
 */
const CATEGORY_SYNONYMS: Record<string, Record<string, string[]>> = {
    'tottus': {
        'Congelados': ['congelados', 'frozen', 'helados'],
        'Desayunos y Panadería': ['desayunos', 'panaderia', 'breakfast', 'bakery', 'pan', 'galletas'],
        'Despensa': ['despensa', 'abarrotes', 'granos', 'cereales', 'enlatados'],
        'Dulces y Snacks': ['dulces', 'snacks', 'golosinas', 'candy', 'chocolates', 'chizitos'],
        'Embutidos y Quesos': ['embutidos', 'quesos', 'cheese', 'salchichas', 'jamon'],
        'Huevos': ['huevos', 'eggs'],
        'Jamón': ['jamon', 'ham'],
        'Lácteos y Frescos': ['lacteos', 'frescos', 'dairy', 'leche', 'yogurt', 'mantequilla'],
        'Aguas y Jugos': ['aguas', 'jugos', 'water', 'juice', 'bebidas'],
        'Cervezas': ['cervezas', 'beer', 'cerveza'],
        'Licores': ['licores', 'liquor', 'spirits', 'ron', 'vodka', 'whisky'],
    },
    'metro': {
        'Aves y Huevos': ['aves', 'huevos', 'poultry', 'eggs', 'pollo'],
        'Carnes': ['carnes', 'meat', 'beef', 'res', 'carne'],
        'Aves y Pescados': ['pescados', 'fish', 'salmon', 'atun', 'mariscos'],
        'Desayuno': ['desayuno', 'breakfast', 'cereales', 'avena'],
        'Embutidos y Fiambres': ['embutidos', 'fiambres', 'salchichas', 'mortadela'],
        'Frutas y Verduras': ['frutas', 'verduras', 'fruits', 'vegetables', 'produce', 'hortalizas'],
        'Lácteos': ['lacteos', 'dairy', 'leche', 'yogurt'],
        'Licores y Cervezas': ['licores', 'cervezas', 'beer', 'liquor', 'cerveza'],
        'Bebidas': ['bebidas', 'drinks', 'jugos', 'gaseosas', 'refrescos'],
        'Cuidado Personal': ['cuidado personal', 'personal care', 'higiene'],
        'Despensa': ['despensa', 'abarrotes', 'granos'],
        'Limpieza': ['limpieza', 'cleaning', 'detergente', 'jabon'],
        'Panadería y Pastelería': ['panaderia', 'pasteleria', 'bakery', 'pan', 'tortas'],
    },
    'wong': {
        'Aguas y Bebidas': ['aguas', 'bebidas', 'drinks', 'water', 'jugos', 'gaseosas'],
        'Comidas y Rostizados': ['comidas', 'rostizados', 'prepared meals', 'pollo rostizado'],
        'Embutidos y Fiambres': ['embutidos', 'fiambres', 'salchichas', 'jamon'],
        'Frutas y Verduras': ['frutas', 'verduras', 'fruits', 'vegetables', 'produce'],
        'Lácteos y Huevos': ['lacteos', 'huevos', 'dairy', 'eggs', 'leche', 'yogurt'],
        'Panadería y Pastelería': ['panaderia', 'pasteleria', 'bakery', 'pan', 'tortas'],
    },
    'plazavea': {
        'Abarrotes': ['abarrotes', 'comestibles', 'despensa', 'granos', 'cereales'],
        'Bebidas': ['bebidas', 'drinks', 'jugos', 'gaseosas', 'aguas'],
        'Carnes, Aves y Pescados': ['carnes', 'aves', 'pescados', 'meat', 'fish', 'pollo'],
        'Congelados': ['congelados', 'frozen', 'helados'],
        'Desayunos': ['desayunos', 'breakfast', 'cereales', 'avena'],
        'Frutas y Verduras': ['frutas', 'verduras', 'fruits', 'vegetables', 'produce'],
        'Limpieza': ['limpieza', 'cleaning', 'detergente', 'jabon'],
        'Lácteos y Huevos': ['lacteos', 'huevos', 'refrigerados', 'dairy', 'eggs'],
        'Panadería y Pastelería': ['panaderia', 'pasteleria', 'bakery', 'pan'],
        'Pollo Rostizado y Comidas Preparadas': ['pollo rostizado', 'comidas preparadas', 'prepared meals'],
        'Quesos y Fiambres': ['quesos', 'fiambres', 'cheese', 'embutidos'],
        'Vinos, Licores y Cervezas': ['vinos', 'licores', 'cervezas', 'wine', 'liquor', 'beer'],
    },
    'flora_y_fauna': {
        'Abarrotes': ['abarrotes', 'organicos', 'despensa', 'granos'],
        'Congelados': ['congelados', 'frozen'],
        'Cuidado Personal': ['cuidado personal', 'personal care', 'higiene'],
        'Frescos': ['frescos', 'fresh', 'refrigerados'],
        'Hogar y Limpieza': ['hogar', 'limpieza', 'cleaning', 'detergente'],
    },
    'vivanda': {
        'Abarrotes': ['abarrotes', 'despensa', 'granos'],
        'Bebidas': ['bebidas', 'drinks', 'jugos', 'gaseosas'],
        'Carnes, Aves y Pescados': ['carnes', 'aves', 'pescados', 'meat', 'fish'],
        'Congelados': ['congelados', 'frozen'],
        'Cuidado Personal y Salud': ['cuidado personal', 'salud', 'health', 'personal care'],
        'Desayunos': ['desayunos', 'breakfast', 'cereales'],
        'Frutas y Verduras': ['frutas', 'verduras', 'fruits', 'vegetables'],
        'Limpieza': ['limpieza', 'cleaning', 'detergente'],
        'Lácteos y Huevos': ['lacteos', 'huevos', 'dairy', 'eggs'],
        'Vinos, Licores y Cervezas': ['vinos', 'licores', 'cervezas', 'wine', 'liquor'],
    },
} as const;

export type Sinonimos = typeof CATEGORY_SYNONYMS;

export function normalizarCategoria(
    categoriaRaw: string,
    supermercado: string
): { original: string; normalized: string; supermercado: string; confianza: number } {
    const categoriaLower = (categoriaRaw || '').toLowerCase().trim();

    // ✅ Usar subcategorías de tabla_maestra como fuente de verdad
    const subcategoriasDisponibles = Object.keys(tablaMaestra.subcategorias);

    // 1. Buscar coincidencia exacta en tabla_maestra
    if (subcategoriasDisponibles.includes(categoriaRaw)) {
        logger.debug('✅ Coincidencia exacta de subcategoría en tabla_maestra', {
            original: categoriaRaw,
            supermercado
        });
        return {
            original: categoriaRaw,
            normalized: categoriaRaw,
            supermercado,
            confianza: 1.0,
        };
    }

    // 2. Buscar por sinónimos
    const sinonimos = CATEGORY_SYNONYMS[supermercado as keyof typeof CATEGORY_SYNONYMS] || {};
    for (const [categoriaNormalizada, variaciones] of Object.entries(sinonimos)) {
        if (variaciones.some((variacion) => categoriaLower.includes(variacion))) {
            logger.info('✅ Categoría mapeada por sinónimo', {
                original: categoriaRaw,
                normalizada: categoriaNormalizada,
                supermercado,
                confianza: 0.85
            });
            return {
                original: categoriaRaw,
                normalized: categoriaNormalizada,
                supermercado,
                confianza: 0.85,
            };
        }
    }

    // 3. Categoría desconocida
    logger.warn('⚠️ Categoría no reconocida', {
        categoria: categoriaRaw,
        supermercado
    });

    return {
        original: categoriaRaw,
        normalized: 'Sin categoría',
        supermercado,
        confianza: 0.3,
    };
}

export function esCategoriaValida(categoria: string, supermercado: string): boolean {
    // ✅ Validar contra subcategorías de tabla_maestra
    return Object.keys(tablaMaestra.subcategorias).includes(categoria);
}

export function getCategoriasDisponibles(supermercado: string): string[] {
    // ✅ Retornar subcategorías de tabla_maestra
    // Nota: tabla_maestra es global, no específica por supermercado
    return Object.keys(tablaMaestra.subcategorias);
}