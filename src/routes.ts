import express from 'express';

import testRouter from './modules/test/router.js';
import authRouter from './modules/auth/router.js';
import inicioRouter from './modules/inicio/router.js';
import historialRouter from './modules/historial/router.js';	
import perfilRouter from './modules/Perfil/router.js';

const router = express.Router();

// Acá se añadirán todos los routers de los modules que se creen
router.use('/test', testRouter);
router.use('/perfil', perfilRouter);
router.use('/inicio', inicioRouter);
router.use('/auth', authRouter);
router.use('/historial', historialRouter);

// Health check endpoint
router.get('/health', (req, res) => {
	res.success({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
