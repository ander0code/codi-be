import { z } from 'zod';

// Schema para el registro de un nuevo usuario
export const RegisterSchema = z.object({
    nombre: z.string().min(3, 'El nombre es requerido'),
    apellido: z.string().min(3, 'El apellido es requerido'),
    email: z.email('Debe ser un correo electrónico válido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

// Schema para el inicio de sesión
export const LoginSchema = z.object({
    email: z.email('Debe ser un correo electrónico válido'),
    password: z.string().min(1, 'La contraseña es requerida'),
});

// Schema para la respuesta del usuario (sin datos sensibles)
export const UserResponseSchema = z.object({
    id: z.uuid(),
    nombre: z.string(),
    apellido: z.string(),
    email: z.email(),
});

// Schema para la respuesta de autenticación completa
export const AuthResponseSchema = z.object({
    user: UserResponseSchema,
    token: z.string(),
});

// Exportar tipos para usarlos en el código
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;