import { z } from 'zod';

// Schema para validar userId en params
export const SubirBoletaSchema = z.object({
    userId: z.uuid('El ID del usuario debe ser un UUID válido'),
    generateSuggestions: z.boolean().optional().default(false), // ✅ Sugerencias opcionales
});

// Schema para validad boletaId en params
export const GetBoletaParamsSchema = z.object({
    boletaId: z.uuid('El ID de la boleta debe ser un UUID válido'),
});

// Schema para producto extraído del OCR
export const ProductoExtraidoSchema = z.object({
    nombre: z.string().min(2, 'El nombre del producto es muy corto'),
    precio: z.number().positive('El precio debe ser positivo'),
    cantidad: z.number().positive().default(1),
    unidad: z.string().default('kg'), // ✅ Unidad de medida (kg, g, l, ml, un)
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
    // ✅ NUEVO: Validación con tabla_maestra
    validacion: z.object({
        nivel: z.enum(['verde', 'amarillo', 'rojo']),
        mensaje: z.string(),
        co2Calculado: z.number(),
        rangos: z.object({
            verde_hasta: z.number(),
            amarillo_hasta: z.number(),
            rojo_desde: z.number(),
            huella_media: z.number(),
        }),
        fuentes: z.array(z.string()),
    }).optional(),
});

// Schema para análisis de boleta
export const AnalisisBoletaSchema = z.object({
    totalProductos: z.number().int().positive(),
    productosVerdes: z.number().int().nonnegative(),
    porcentajeVerde: z.number().min(0).max(100),
    co2Total: z.number().nonnegative(),
    co2Promedio: z.number().nonnegative(),
    // ✅ CORRECCIÓN: Cambiar "AMARILLA" → "AMARILLO"
    tipoAmbiental: z.enum(['VERDE', 'AMARILLO', 'ROJO']),
    esReciboVerde: z.boolean(),
});

// Schema para respuesta final
export const ProcesarBoletaResponseSchema = z.object({
    boletaId: z.uuid(),
    analisis: AnalisisBoletaSchema,
    productos: z.array(ProductoClasificadoSchema),
    sugerencias: z.array(z.string()),
});

// Schema para item de producto en detalle de boleta
export const ProductoDetalleSchema = z.object({
    id: z.uuid(),
    nombre: z.string().nullable(), // ✅ Permitir null desde la BD
    cantidad: z.number(),
    precioUnitario: z.number(),
    precioTotal: z.number(),
    factorCo2: z.number(),
    categoria: z.string().nullable(),
    subcategoria: z.string().nullable(),
    marca: z.string().nullable(),
});

export const RecomendacionItemSchema = z.object({
    id: z.uuid(),
    productoOriginal: z.object({
        id: z.uuid(),
        nombre: z.string(),
        co2: z.number(),
    }),
    productoRecomendado: z.object({
        nombre: z.string(),
        marca: z.string().nullable(),
        categoria: z.string().nullable(),
        tienda: z.string(),
        co2: z.number(),
    }),
    mejora: z.object({
        porcentaje: z.number(), // Ej: 35.50
        co2Ahorrado: z.number(), // kg CO2e ahorrados
    }),
    tipo: z.enum([
        'ALTERNATIVA_MISMA_TIENDA',
        'ALTERNATIVA_OTRA_TIENDA',
        'PRODUCTO_ECO_EQUIVALENTE',
        'MARCA_SOSTENIBLE',
    ]),
    scoreSimilitud: z.number().min(0).max(1),
});


// Schema para respuesta de detalle de boleta
export const DetalleBoletaResponseSchema = z.object({
    id: z.uuid(),
    fechaBoleta: z.date().nullable(),
    nombreTienda: z.string().nullable(),
    logoTienda: z.string().nullable(),
    total: z.number(),
    tipoAmbiental: z.enum(['VERDE', 'AMARILLO', 'ROJO']),
    urlImagen: z.string().nullable(),
    productos: z.array(ProductoDetalleSchema),
    analisis: z.object({
        totalProductos: z.number().int(),
        co2Total: z.number(),
        co2Promedio: z.number(),
    }),
    // ✅ NUEVO: Recomendaciones
    recomendaciones: z.array(RecomendacionItemSchema),
    resumenRecomendaciones: z.object({
        totalRecomendaciones: z.number().int(),
        co2TotalAhorrable: z.number(),
        porcentajeMejoraPromedio: z.number(),
    }),
});

// Exportar tipos
export type SubirBoletaInput = z.infer<typeof SubirBoletaSchema>;
export type GetBoletaParams = z.infer<typeof GetBoletaParamsSchema>;
export type ProductoExtraido = z.infer<typeof ProductoExtraidoSchema>;
export type ProductoClasificado = z.infer<typeof ProductoClasificadoSchema>;
export type AnalisisBoleta = z.infer<typeof AnalisisBoletaSchema>;
export type ProcesarBoletaResponse = z.infer<typeof ProcesarBoletaResponseSchema>;
export type ProductoDetalle = z.infer<typeof ProductoDetalleSchema>;
export type DetalleBoletaResponse = z.infer<typeof DetalleBoletaResponseSchema>;
export type RecomendacionItem = z.infer<typeof RecomendacionItemSchema>;