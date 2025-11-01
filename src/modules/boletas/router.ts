import { Router } from 'express';
import multer from 'multer';
import { uploadBoleta } from './controller.js';
import { authMiddleware } from '@/middlewares/auth.js';
import { env } from '@/config/env.js';

const router = Router();

// Configurar Multer para subida de imágenes
const upload = multer({
    storage: multer.memoryStorage(), // Guardar en memoria para procesamiento
    limits: {
        fileSize: env.ocr.maxFileSize, // 10MB por defecto
    },
    fileFilter: (req, file, cb) => {
        // Validar tipos de archivo
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido. Solo JPEG, PNG o PDF'));
        }
    },
});

/**
 * POST /boletas/:userId/upload
 * Sube y procesa una boleta
 */
router.post(
    '/:userId/upload',
    authMiddleware, // Autenticación requerida
    upload.single('boleta'), // Campo 'boleta' en FormData
    uploadBoleta
);

export default router;