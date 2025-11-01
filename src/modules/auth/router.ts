import { Router } from 'express';
import { 
    registerController, 
    loginController, 
    refreshTokenController
} from './controller.js';
import { oauthSuccessController } from './oauth.controller.js';
import { googleLoginController } from './google-oauth.controller.js'; // ✅ NUEVO

const router = Router();

// ============================================
// AUTENTICACIÓN TRADICIONAL (Email/Password)
// ============================================
router.post('/register', registerController);
router.post('/login', loginController);
router.post('/refresh-token', refreshTokenController);

// ============================================
// AUTENTICACIÓN OAUTH
// ============================================

// ✅ NUEVO: Endpoint para aplicación móvil
router.post('/google', googleLoginController);

// OAuth Web (mantener para web)
router.get('/oauth/success', oauthSuccessController);

export default router;