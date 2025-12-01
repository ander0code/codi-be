import crypto from 'crypto';

/**
 * Calcula el hash SHA-256 de un buffer de imagen
 * Usado para detectar duplicados exactos de imágenes
 */
export function calcularHashImagen(imageBuffer: Buffer): string {
    return crypto
        .createHash('sha256')
        .update(imageBuffer)
        .digest('hex');
}
