import { Router } from 'express';
import { ExpressAuth } from '@auth/express';
import Google from '@auth/express/providers/google';
import { env } from '@/config/env.js';
import { AuthRepository } from './repository.js';
import { 
    registerController, 
    loginController, 
    refreshTokenController
} from './controller.js';
import { oauthSuccessController } from './oauth.controller.js';

const router = Router();

// ============================================
// AUTENTICACIÓN TRADICIONAL (Email/Password)
// ============================================
router.post('/register', registerController);
router.post('/login', loginController);
router.post('/refresh-token', refreshTokenController);

// OAuth success endpoint (recibe la redirección después del OAuth)
router.get('/oauth/success', oauthSuccessController);

// ============================================
// AUTENTICACIÓN OAUTH (Google)
// ============================================


export default router;