import { z } from 'zod';

// Schema para validar el parámetro de usuario
export const GetPerfilParamsSchema = z.object({
    userId: z.string().uuid('El ID del usuario debe ser un UUID válido'),
});

// Schema para actualizar perfil
export const UpdatePerfilSchema = z.object({
    nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(80, 'El nombre no puede exceder 80 caracteres'),
    apellido: z.string().min(3, 'El apellido debe tener al menos 3 caracteres').max(80, 'El apellido no puede exceder 80 caracteres'),
});

// Schema para datos del usuario
export const DatosUsuarioSchema = z.object({
    nombre: z.string(),
    apellido: z.string(),
    correo: z.string(),
});

// Schema para estadísticas
export const EstadisticasPerfilSchema = z.object({
    cantidadRecibos: z.number().int(),
    cantidadRecibosVerdes: z.number().int(),
    co2Total: z.number(),
    co2Promedio: z.number(),
});

// Schema para la respuesta del perfil
export const PerfilResponseSchema = z.object({
    datosUsuario: DatosUsuarioSchema,
    estadisticas: EstadisticasPerfilSchema,
});

// Schema para la respuesta de actualización
export const UpdatePerfilResponseSchema = z.object({
    nombre: z.string(),
    apellido: z.string(),
    actualizadoEn: z.date(),
});

// Exportar tipos
export type GetPerfilParams = z.infer<typeof GetPerfilParamsSchema>;
export type UpdatePerfilInput = z.infer<typeof UpdatePerfilSchema>;
export type DatosUsuario = z.infer<typeof DatosUsuarioSchema>;
export type EstadisticasPerfil = z.infer<typeof EstadisticasPerfilSchema>;
export type PerfilResponse = z.infer<typeof PerfilResponseSchema>;
export type UpdatePerfilResponse = z.infer<typeof UpdatePerfilResponseSchema>;