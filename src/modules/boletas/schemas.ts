import { z } from 'zod';

// Schema para validar userId en params
export const SubirBoletaSchema = z.object({
    userId: z.uuid('El ID del usuario debe ser un UUID válido'),
});

// Schema para producto extraído del OCR
export const ProductoExtraidoSchema = z.object({
    nombre: z.string().min(2, 'El nombre del producto es muy corto'),
    precio: z.number().positive('El precio debe ser positivo'),
    cantidad: z.number().int().positive().default(1),
    confianza: z.number().min(0).max(1), // Confianza del OCR
});

// Schema para producto clasificado (después del matching)
export const ProductoClasificadoSchema = ProductoExtraidoSchema.extend({
    productoId: z.uuid().optional(),
    categoria: z.string(),
    subcategoria: z.string().optional(),
    marcaId: z.uuid().optional(),
    factorCo2: z.number().nonnegative(),
    esLocal: z.boolean().default(false),
    tieneEmpaqueEcologico: z.boolean().default(false),
});

// Schema para análisis de boleta
export const AnalisisBoletaSchema = z.object({
    totalProductos: z.number().int().positive(),
    productosVerdes: z.number().int().nonnegative(),
    porcentajeVerde: z.number().min(0).max(100),
    co2Total: z.number().nonnegative(),
    co2Promedio: z.number().nonnegative(),
    tipoAmbiental: z.enum(['VERDE', 'AMARILLA', 'ROJA']),
    esReciboVerde: z.boolean(),
});

// Schema para respuesta final
export const ProcesarBoletaResponseSchema = z.object({
    boletaId: z.uuid(),
    analisis: AnalisisBoletaSchema,
    productos: z.array(ProductoClasificadoSchema),
    sugerencias: z.array(z.string()),
});

// Exportar tipos
export type SubirBoletaInput = z.infer<typeof SubirBoletaSchema>;
export type ProductoExtraido = z.infer<typeof ProductoExtraidoSchema>;
export type ProductoClasificado = z.infer<typeof ProductoClasificadoSchema>;
export type AnalisisBoleta = z.infer<typeof AnalisisBoletaSchema>;
export type ProcesarBoletaResponse = z.infer<typeof ProcesarBoletaResponseSchema>;