import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env.js';

export interface JwtPayload {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    [key: string]: unknown;
}
const JWT_SECRET: string = String(env.jwt.secret);
const JWT_EXPIRES_IN = String(env.jwt.expiresIn) as unknown as SignOptions['expiresIn'];
const JWT_REFRESH_EXPIRES_IN = String(env.jwt.refreshExpiresIn) as unknown as SignOptions['expiresIn'];

export function signToken(payload: JwtPayload, expiresIn: SignOptions['expiresIn'] = JWT_EXPIRES_IN): string {
    const options: SignOptions = { expiresIn };
    return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken<T = JwtPayload>(token: string): T {
    return jwt.verify(token, JWT_SECRET) as T;
}

export function signRefreshToken(payload: JwtPayload, expiresIn: SignOptions['expiresIn'] = JWT_REFRESH_EXPIRES_IN): string {
    const options: SignOptions = { expiresIn };
    return jwt.sign(payload, JWT_SECRET, options);
}