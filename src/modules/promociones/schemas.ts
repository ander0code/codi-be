import { z } from 'zod';

// Schema para query params del getAll
export const GetPromocionesQuerySchema = z.object({
    userId: z.string().uuid('El ID del usuario debe ser un UUID válido').optional(),
});

// Schema para params del getDetalle
export const GetPromocionDetalleParamsSchema = z.object({
    promocionId: z.string().uuid('El ID de la promoción debe ser un UUID válido'),
    userId: z.string().uuid('El ID del usuario debe ser un UUID válido'),
});

// Schema para canjear promoción
export const CanjearPromocionSchema = z.object({
    userId: z.string().uuid('El ID del usuario debe ser un UUID válido'),
    promocionId: z.string().uuid('El ID de la promoción debe ser un UUID válido'),
});

// Schema para promoción en lista
export const PromocionItemSchema = z.object({
    id: z.string().uuid(),
    titulo: z.string(),
    descripcion: z.string().nullable(),
    tipoPromocion: z.string(),
    boletasRequeridas: z.number().int(),
    validezInicio: z.date().nullable(),
    validezFin: z.date().nullable(),
    activa: z.boolean(),
    tienda: z.object({
        nombre: z.string(),
        urlLogo: z.string().nullable(),
    }).nullable(),
});

// Schema para detalle de promoción
export const PromocionDetalleSchema = PromocionItemSchema.extend({
    disponible: z.boolean(),
    fechaUso: z.date().nullable(),
    detalles: z.string().nullable(),
});

// Schema para respuesta de getAll
export const GetPromocionesResponseSchema = z.object({
    puntosUsuario: z.number().int().optional(),
    promociones: z.array(PromocionItemSchema),
});

// Schema para respuesta de canjear
export const CanjearPromocionResponseSchema = z.object({
    promocionUsuarioId: z.string().uuid(),
    puntosRestantes: z.number().int(),
    fechaCanje: z.date(),
});

// Exportar tipos
export type GetPromocionesQuery = z.infer<typeof GetPromocionesQuerySchema>;
export type GetPromocionDetalleParams = z.infer<typeof GetPromocionDetalleParamsSchema>;
export type CanjearPromocionInput = z.infer<typeof CanjearPromocionSchema>;
export type PromocionItem = z.infer<typeof PromocionItemSchema>;
export type PromocionDetalle = z.infer<typeof PromocionDetalleSchema>;
export type GetPromocionesResponse = z.infer<typeof GetPromocionesResponseSchema>;
export type CanjearPromocionResponse = z.infer<typeof CanjearPromocionResponseSchema>;