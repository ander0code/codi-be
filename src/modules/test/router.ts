import { Router } from 'express';

import { testController } from './controller.js';

const router = Router();

// Ahora funciona automáticamente sin asyncRoute gracias al parche
router.get('/', testController);

export default router;
