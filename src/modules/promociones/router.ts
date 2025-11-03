import { Router } from 'express';
import { getPromociones, getPromocionDetalle, canjearPromocion } from './controller.js';

const router = Router();

// GET /promociones?userId=uuid (opcional)
router.get('/', getPromociones);

// GET /promociones/:promocionId/usuario/:userId
router.get('/:promocionId/usuario/:userId', getPromocionDetalle);

// POST /promociones/canjear
router.post('/canjear', canjearPromocion);

export default router;