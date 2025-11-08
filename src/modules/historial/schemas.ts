import { z } from 'zod';

// Schema para validar el parámetro de usuario
export const GetHistorialParamsSchema = z.object({
    userId: z.string().uuid('El ID del usuario debe ser un UUID válido'),
});

// Schema para el resumen de actividad
export const ResumenActividadSchema = z.object({
    cantidadBoletas: z.number().int(),
    cantidadBoletasVerdes: z.number().int(),
    cantidadBoletasAmarillas: z.number().int(),
    cantidadBoletasRojas: z.number().int(),
    co2Total: z.number(),
    co2Promedio: z.number(),
});

// Schema para compra reciente
export const CompraRecienteSchema = z.object({
    id: z.string().uuid(), // ✅ AGREGADO: ID de la boleta
    fechaBoleta: z.date().nullable(),
    logoTienda: z.string().nullable(),
    nombreTienda: z.string().nullable(),
    tipoBoleta: z.enum(['VERDE', 'AMARILLO', 'ROJO']),
    co2Boleta: z.number(),
    cantidadProductos: z.number().int(),
});

// Schema para la respuesta completa del historial
export const HistorialResponseSchema = z.object({
    resumenActividad: ResumenActividadSchema,
    comprasRecientes: z.array(CompraRecienteSchema),
});

// Exportar tipos
export type GetHistorialParams = z.infer<typeof GetHistorialParamsSchema>;
export type ResumenActividad = z.infer<typeof ResumenActividadSchema>;
export type CompraReciente = z.infer<typeof CompraRecienteSchema>;
export type HistorialResponse = z.infer<typeof HistorialResponseSchema>;

// Tipos auxiliares para el repository
export type BoletaConDetalles = {
    Id: string; 
    FechaBoleta: Date | null;
    NombreTienda: string | null;
    TipoAmbiental: any;
    Tienda: {
        Nombre: string;
        UrlLogo: string | null;
    } | null;
    Items: Array<{
        FactorCo2PorUnidad: any;
    }>;
    _count: {
        Items: number;
    };
};