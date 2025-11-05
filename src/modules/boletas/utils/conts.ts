import { z } from 'zod';

// ✅ Schema de validación
const UmbralSchema = z.object({
    bajo: z.number().positive(),
    medio: z.number().positive(),
    alto: z.number().positive().or(z.literal(Infinity)),
});

const ReglaCategoriaSchema = z.object({
    unidad: z.string(),
    umbrales: UmbralSchema,
});

// ✅ Exportar como constante tipada con TODAS las categorías
export const huellaCarbonoPorSupermercado = {
    'tottus': {
        'Congelados': {
            unidad: 'kg CO2e/USD',
            umbrales: { bajo: 0.5, medio: 1.5, alto: Infinity },
        },
        'Desayunos y Panadería': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.0, medio: 3.0, alto: Infinity },
        },
        'Despensa': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.0, medio: 2.5, alto: Infinity },
        },
        'Dulces y Snacks': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.5, medio: 4.0, alto: Infinity },
        },
        'Embutidos y Quesos': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 3.0, medio: 10.0, alto: Infinity },
        },
        'Huevos': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 3.0, medio: 6.0, alto: Infinity },
        },
        'Jamón': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 4.0, medio: 8.0, alto: Infinity },
        },
        'Lácteos y Frescos': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.0, medio: 5.0, alto: Infinity },
        },
        'Aguas y Jugos': {
            unidad: 'kg CO2e/L',
            umbrales: { bajo: 0.1, medio: 0.5, alto: Infinity },
        },
        'Cervezas': {
            unidad: 'kg CO2e/L',
            umbrales: { bajo: 0.5, medio: 1.5, alto: Infinity },
        },
        'Espumantes y Vinos': {
            unidad: 'kg CO2e/L',
            umbrales: { bajo: 1.0, medio: 2.0, alto: Infinity },
        },
        'Licores': {
            unidad: 'kg CO2e/L',
            umbrales: { bajo: 2.0, medio: 3.5, alto: Infinity },
        },
        'Cuidado Capilar': {
            unidad: 'kg CO2e/unidad',
            umbrales: { bajo: 0.5, medio: 1.0, alto: Infinity },
        },
        'Cuidado de la Piel': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 5.0, medio: 15.0, alto: Infinity },
        },
        'Higiene Personal': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.0, medio: 3.0, alto: Infinity },
        },
        'Maquillaje': {
            unidad: 'kg CO2e/unidad',
            umbrales: { bajo: 0.1, medio: 5.0, alto: Infinity },
        },
        'Salud': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 5.0, medio: 10.0, alto: Infinity },
        },
        'Ambientales y Desinfectantes': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.5, medio: 3.5, alto: Infinity },
        },
        'Bolsas de Basura': {
            unidad: 'kg CO2e/bolsa',
            umbrales: { bajo: 0.06, medio: 0.1, alto: Infinity },
        },
        'Detergentes y Cuidado de Ropa': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.0, medio: 3.0, alto: Infinity },
        },
        'Limpiadores': {
            unidad: 'kg CO2e/L',
            umbrales: { bajo: 0.04, medio: 0.055, alto: Infinity },
        },
        'Papeles': {
            unidad: 'kg CO2e/unidad/rollo',
            umbrales: { bajo: 0.2, medio: 0.8, alto: Infinity },
        },
        'Utensilios de Aseo': {
            unidad: 'kg CO2e/unidad',
            umbrales: { bajo: 5.0, medio: 15.0, alto: Infinity },
        },
    },
    'metro': {
        'Aves y Huevos': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 2.0, medio: 3.5, alto: Infinity },
        },
        'Carnes': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 10.0, medio: 30.0, alto: Infinity },
        },
        'Aves y Pescados': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.5, medio: 3.0, alto: Infinity },
        },
        'Desayuno': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.0, medio: 2.5, alto: Infinity },
        },
        'Embutidos y Fiambres': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 5.0, medio: 8.0, alto: Infinity },
        },
        'Frutas y Verduras': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 0.6, medio: 1.5, alto: Infinity },
        },
        'Lácteos': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.5, medio: 5.0, alto: Infinity },
        },
        'Licores y Cervezas': {
            unidad: 'kg CO2e/L',
            umbrales: { bajo: 0.5, medio: 2.0, alto: Infinity },
        },
        'Bebidas': {
            unidad: 'kg CO2e/L',
            umbrales: { bajo: 0.5, medio: 1.5, alto: Infinity },
        },
        'Cuidado Personal': {
            unidad: 'kg CO2e/unidad',
            umbrales: { bajo: 0.5, medio: 5.0, alto: Infinity },
        },
        'Despensa': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.0, medio: 5.0, alto: Infinity },
        },
        'Limpieza': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.0, medio: 3.0, alto: Infinity },
        },
        'Panadería y Pastelería': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 2.0, medio: 5.0, alto: Infinity },
        },
    },
    'wong': {
        'Aguas y Bebidas': {
            unidad: 'kg CO2e/L o kg',
            umbrales: { bajo: 0.5, medio: 1.5, alto: Infinity },
        },
        'Comidas y Rostizados': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 4.0, medio: 10.0, alto: Infinity },
        },
        'Embutidos y Fiambres': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 5.0, medio: 7.0, alto: Infinity },
        },
        'Frutas y Verduras': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 0.6, medio: 1.5, alto: Infinity },
        },
        'Lácteos y Huevos': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.5, medio: 5.0, alto: Infinity },
        },
        'Panadería y Pastelería': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 2.0, medio: 5.0, alto: Infinity },
        },
    },
    'plazavea': {
        'Abarrotes': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.0, medio: 2.0, alto: Infinity },
        },
        'Bebidas': {
            unidad: 'kg CO2e/L',
            umbrales: { bajo: 0.5, medio: 1.5, alto: Infinity },
        },
        'Carnes, Aves y Pescados': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 5.0, medio: 20.0, alto: Infinity },
        },
        'Congelados': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.0, medio: 10.0, alto: Infinity },
        },
        'Desayunos': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.0, medio: 5.0, alto: Infinity },
        },
        'Frutas y Verduras': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.0, medio: 2.5, alto: Infinity },
        },
        'Limpieza': {
            unidad: 'kg CO2e/kg o USD',
            umbrales: { bajo: 0.5, medio: 2.0, alto: Infinity },
        },
        'Lácteos y Huevos': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 2.0, medio: 7.0, alto: Infinity },
        },
        'Panadería y Pastelería': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.0, medio: 3.0, alto: Infinity },
        },
        'Pollo Rostizado y Comidas Preparadas': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 4.0, medio: 8.0, alto: Infinity },
        },
        'Quesos y Fiambres': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 8.0, medio: 14.0, alto: Infinity },
        },
        'Vinos, Licores y Cervezas': {
            unidad: 'kg CO2e/L',
            umbrales: { bajo: 0.5, medio: 2.0, alto: Infinity },
        },
    },
    'flora_y_fauna': {
        'Abarrotes': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.0, medio: 5.0, alto: Infinity },
        },
        'Congelados': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.0, medio: 10.0, alto: Infinity },
        },
        'Cuidado Personal': {
            unidad: 'kg CO2e/unidad',
            umbrales: { bajo: 0.5, medio: 5.0, alto: Infinity },
        },
        'Frescos': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.0, medio: 10.0, alto: Infinity },
        },
        'Hogar y Limpieza': {
            unidad: 'kg CO2e/kg o unidad',
            umbrales: { bajo: 0.5, medio: 5.0, alto: Infinity },
        },
    },
    'vivanda': {
        'Abarrotes': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.0, medio: 5.0, alto: Infinity },
        },
        'Bebidas': {
            unidad: 'kg CO2e/L',
            umbrales: { bajo: 0.5, medio: 2.0, alto: Infinity },
        },
        'Carnes, Aves y Pescados': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 5.0, medio: 20.0, alto: Infinity },
        },
        'Congelados': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.0, medio: 10.0, alto: Infinity },
        },
        'Cuidado Personal y Salud': {
            unidad: 'kg CO2e/unidad',
            umbrales: { bajo: 0.5, medio: 5.0, alto: Infinity },
        },
        'Desayunos': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.0, medio: 10.0, alto: Infinity },
        },
        'Frutas y Verduras': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 1.0, medio: 2.5, alto: Infinity },
        },
        'Limpieza': {
            unidad: 'kg CO2e/kg o unidad',
            umbrales: { bajo: 0.5, medio: 5.0, alto: Infinity },
        },
        'Lácteos y Huevos': {
            unidad: 'kg CO2e/kg',
            umbrales: { bajo: 7.0, medio: 15.0, alto: Infinity },
        },
        'Vinos, Licores y Cervezas': {
            unidad: 'kg CO2e/L',
            umbrales: { bajo: 0.5, medio: 2.0, alto: Infinity },
        },
    },
} as const;

// ✅ Tipos inferidos automáticamente
export type HuellaCarbono = typeof huellaCarbonoPorSupermercado;
export type Supermercado = keyof HuellaCarbono;
export type Categoria<S extends Supermercado> = keyof HuellaCarbono[S];

// ✅ Función helper para obtener umbrales de forma segura
export function obtenerUmbrales(
    supermercado: string,
    categoria: string
): { unidad: string; umbrales: { bajo: number; medio: number; alto: number } } | null {
    const thresholds = huellaCarbonoPorSupermercado[supermercado as Supermercado];
    if (!thresholds) return null;
    
    const regla = thresholds[categoria as keyof typeof thresholds];
    if (!regla) return null;
    
    return regla;
}