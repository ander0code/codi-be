import { Router } from 'express';
import { getHistorial } from './controller.js';

const router = Router();

router.get('/:userId', getHistorial);

export default router;