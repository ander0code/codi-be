import { Router } from 'express';
import { 
    registerController, 
    loginController, 
    refreshTokenController,
    getUserByDniController // ✅ NUEVO
} from './controller.js';
import { oauthSuccessController } from './oauth.controller.js';
import { googleLoginController } from './google-oauth.controller.js';

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
router.post('/google', googleLoginController);
router.get('/oauth/success', oauthSuccessController);

// ============================================
// CONSULTAS DE USUARIOS
// ============================================
// ✅ NUEVO: Obtener datos básicos del usuario por DNI
router.get('/user/dni/:dni', getUserByDniController);

export default router;