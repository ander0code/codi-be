import type { Request, Response } from 'express';
import { handleAuth } from '@/lib/clients/auth.js';

/**
 * Maneja todas las rutas de Auth.js (signin, callback, signout)
 */
export async function oauthHandler(req: Request, res: Response) {
    try {
        const protocol = req.protocol;
        const host = req.get('host') || '';
        // usar req.originalUrl para incluir todo (mount + path + query)
        const url = `${protocol}://${host}${req.originalUrl}`;

        // DEBUG: log para detectar mismatch con authConfig.basePath
        logger.request(req.method, url, { originalUrl: req.originalUrl, baseUrl: req.baseUrl, path: req.path });
        logger.debug('Auth config basePath', { basePath: (await import('@/lib/clients/auth.js')).authConfig?.basePath });

        const headersObj: Record<string, string> = {};
        for (const [k, v] of Object.entries(req.headers)) {
        if (v === undefined) continue;
        headersObj[k] = Array.isArray(v) ? v.join(',') : String(v);
        }
        headersObj['host'] = host;
        if (req.headers.cookie) headersObj['cookie'] = String(req.headers.cookie);

        const webRequest = new Request(url, {
        method: req.method,
        headers: headersObj as HeadersInit,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
        });

        logger.debug('Auth.js WebRequest', { url, headers: Object.keys(headersObj) });

        const authResponse = await handleAuth(webRequest);

        // Copiar headers de la respuesta
        authResponse.headers.forEach((value, key) => {
            res.setHeader(key, value);
        });

        res.status(authResponse.status);

        // Si es redirección, terminar aquí
        if (authResponse.status >= 300 && authResponse.status < 400) {
            return res.end();
        }

        // Para respuestas con contenido
        const contentType = authResponse.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            const data = await authResponse.json();
            return res.json(data);
        }

        const text = await authResponse.text();
        return res.send(text);

    } catch (error) {
        console.error('OAuth Error:', error);
        return res.status(500).json({ 
            error: 'Error en autenticación OAuth',
            message: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
}