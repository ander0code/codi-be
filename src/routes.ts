import express from 'express';

import testRouter from './modules/test/router.js';
import authRouter from './modules/auth/router.js';
import inicioRouter from './modules/inicio/router.js';
import historialRouter from './modules/historial/router.js';	
import perfilRouter from './modules/perfil/router.js';
import boletasRouter from './modules/boletas/router.js';

import { expressAuth } from './lib/clients/auth.js';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/auth', expressAuth);
router.use('/test', testRouter);
router.use('/perfil', perfilRouter);
router.use('/inicio', inicioRouter);
router.use('/auth', authRouter);
router.use('/historial', historialRouter);
router.use('/boletas', boletasRouter);



// Health check endpoint
router.get('/health', (req, res) => {
	res.success({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
