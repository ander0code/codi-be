import { z } from 'zod';

// Schema para validar el parámetro de usuario
export const GetInicioParamsSchema = z.object({
    userId: z.string().uuid('El ID del usuario debe ser un UUID válido'),
});

// Schema para la respuesta de la última boleta
export const UltimaBoletaSchema = z.object({
    nombreTienda: z.string().nullable(),
    categoriaTienda: z.string().nullable(),
    logoTienda: z.string().nullable(),
    co2Total: z.number(),
    fechaBoleta: z.date().nullable(),
    precioTotal: z.number().nullable(),
});

// Schema para la respuesta de promociones
export const PromocionSchema = z.object({
    titulo: z.string(),
    tipoPromocion: z.string(),
});

// Schema para la respuesta completa del inicio
export const InicioResponseSchema = z.object({
    puntosVerdes: z.number(),
    co2Acumulado: z.number(),
    ultimaBoleta: UltimaBoletaSchema.nullable(),
    promociones: z.array(PromocionSchema),
});

// Exportar tipos
export type GetInicioParams = z.infer<typeof GetInicioParamsSchema>;
export type UltimaBoleta = z.infer<typeof UltimaBoletaSchema>;
export type Promocion = z.infer<typeof PromocionSchema>;
export type InicioResponse = z.infer<typeof InicioResponseSchema>;

// Tipos auxiliares para el repository - ACTUALIZADOS para coincidir con Prisma
export type BoletaConItems = {
    Items: Array<{
        FactorCo2PorUnidad: any;
    }>;
};

export type BoletaCompletaConTienda = BoletaConItems & {
    Tienda: {
        Nombre: string;
        Categoria: string | null;
        UrlLogo: string | null;    
    } | null;
    NombreTienda: string | null;
    FechaBoleta: Date | null;
    Total: any;
};