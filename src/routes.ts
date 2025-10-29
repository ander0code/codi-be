import express from 'express';

import testRouter from './modules/test/router.js';
import authRouter from './modules/auth/router.js';
import inicioRouter from './modules/inicio/router.js';

const router = express.Router();

// Acá se añadirán todos los routers de los modules que se creen
router.use('/test', testRouter);
router.use('/inicio', inicioRouter);
router.use('/auth', authRouter);

// Health check endpoint
router.get('/health', (req, res) => {
	res.success({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
