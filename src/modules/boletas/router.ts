import { Router } from 'express';
import multer from 'multer';
import { uploadBoleta, getBoleta, getBoletaRecommendations } from './controller.js';
import { authMiddleware } from '@/middlewares/auth.js';
import { env } from '@/config/env.js';

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: env.ocr.maxFileSize,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido. Solo JPEG, PNG o PDF'));
        }
    },
});

router.post(
    '/:userId/upload',
    authMiddleware,
    upload.single('boleta'),
    uploadBoleta
);

router.get(
    '/:boletaId',
    authMiddleware,
    getBoleta
);

router.get(
    '/:boletaId/recommendations',
    authMiddleware,
    getBoletaRecommendations
);


export default router;