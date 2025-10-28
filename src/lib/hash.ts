import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, env.jwt.bcryptSaltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}