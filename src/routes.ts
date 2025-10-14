import express from 'express';

import testRouter from './modules/test/router.js';

const router = express.Router();

// Acá se añadirán todos los routers de los modules que se creen
router.use('/test', testRouter);

// Health check endpoint
router.get('/health', (req, res) => {
	res.success({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
