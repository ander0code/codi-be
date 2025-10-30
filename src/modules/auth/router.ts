import { Router } from 'express';
import { 
    registerController, 
    loginController, 
    refreshTokenController
} from './controller.js';
import { 
    oauthHandler 
} from './oauth.controller.js';

const router = Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/refresh-token', refreshTokenController);

// ============================================
// AUTENTICACIÓN OAUTH (Google)
// ============================================
// Auth.js maneja automáticamente estas rutas:
// - GET  /auth/signin/google     → Inicia el flujo OAuth
// - GET  /auth/callback/google   → Recibe la respuesta de Google
// - GET  /auth/session           → Obtiene la sesión actual
// - POST /auth/signout           → Cierra sesión
// - GET  /auth/csrf              → Token CSRF
router.get('/signin/:provider', oauthHandler);
router.get('/callback/:provider', oauthHandler);
router.get('/session', oauthHandler);
router.post('/signout', oauthHandler);
router.get('/csrf', oauthHandler);

export default router;