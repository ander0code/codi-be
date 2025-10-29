import { Router } from 'express';
import { getInicio } from './controller.js';

const router = Router();

router.get('/:userId', getInicio);

export default router;