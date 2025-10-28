import * as dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();

const envSchema = z.object({
    // Server
    PORT: z.string().default('3000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    
    // Database
    DATABASE_URL: z.string(),
    
    // Auth
    JWT_SECRET: z.string(),
    JWT_EXPIRES_IN: z.string().default('7d'),
    BCRYPT_SALT_ROUNDS: z.string().transform(Number).default(10),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    
    // LLM APIs
    DEEPSEEK_API_KEY: z.string(),
    OPENAI_API_KEY: z.string(),
});

const _env = envSchema.parse(process.env);

export const env = {
    port: _env.PORT,
    nodeEnv: _env.NODE_ENV,
    logLevel: _env.LOG_LEVEL,
    
    database: {
        url: _env.DATABASE_URL,
    },
    
    jwt: {
        secret: _env.JWT_SECRET,
        expiresIn: _env.JWT_EXPIRES_IN,
        bcryptSaltRounds: _env.BCRYPT_SALT_ROUNDS,
        refreshExpiresIn: _env.JWT_REFRESH_EXPIRES_IN,
    },
    
    llm: {
        deepseekApiKey: _env.DEEPSEEK_API_KEY,
        openaiApiKey: _env.OPENAI_API_KEY,
    },
};