import { Router } from 'express';
import { getPerfil, updatePerfil } from './controller.js';

const router = Router();

router.get('/:userId', getPerfil);
router.put('/:userId', updatePerfil);

export default router;