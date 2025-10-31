import { ExpressAuth } from '@auth/express';
import Google from '@auth/express/providers/google';
import { env } from '@/config/env.js';
import { AuthRepository } from '@/modules/auth/repository.js';
import logger from '@/config/logger.js';


// Variable temporal para almacenar datos del usuario después del OAuth
let tempUserData: { id: string; email: string; nombre: string; apellido: string , authProvider: string } | null = null;


export const expressAuth = ExpressAuth({
    providers: [
        Google({
            clientId: env.google.clientId,
            clientSecret: env.google.clientSecret,
        }),
    ],
    secret: env.jwt.secret,
    trustHost: true,
    debug: true,
    
    callbacks: {
        async redirect({ url, baseUrl }) {
            logger.info('🔀 Redirect callback', { url, baseUrl });
            
            // Redirigir a nuestro endpoint personalizado que devolverá JSON
            const redirectUrl = `${baseUrl}/auth/oauth/success`;
            logger.info('✅ Redirigiendo a:', { redirectUrl });
            
            return redirectUrl;
        },
        
        async jwt({ token, account, profile, trigger }) {
            logger.info('🔑 JWT callback ejecutado', { 
                trigger, 
                hasAccount: !!account, 
                hasProfile: !!profile 
            });
            
            if (account && profile && trigger === 'signIn') {
                const googleId = profile.sub as string;
                const email = profile.email as string;
                const nombre = (profile.given_name as string) || 'Usuario';
                const apellido = (profile.family_name as string) || 'Codi';

                logger.info('👤 Datos de Google recibidos', { 
                    googleId, 
                    email, 
                    nombre, 
                    apellido 
                });

                try {
                    const user = await AuthRepository.findOrCreateGoogleUser({
                        googleId,
                        email,
                        nombre,
                        apellido,
                        proveedorAuth: 'google',
                    });

                    logger.info('✅ Usuario creado/encontrado en DB', { 
                        userId: user.id,
                        email: user.email 
                    });
                                        // Guardar datos temporalmente para usarlos en el endpoint /oauth/success
                    tempUserData = {
                        id: user.id,
                        email: user.email,
                        nombre: user.nombre,
                        apellido: user.apellido,
                        authProvider: user.proveedorAuth ?? 'google',
                    };


                    // Guardar en el token de Auth.js para poder recuperarlo
                    token.uid = user.id;
                    token.email = user.email;
                    token.nombre = user.nombre;
                    token.apellido = user.apellido;
                    token.authProvider = user.proveedorAuth;
                } catch (error) {
                    logger.error('❌ Error en findOrCreateGoogleUser', { 
                        error: error instanceof Error ? error.message : error 
                    });
                    throw error;
                }
            }
            
            return token;
        },
        
        async session({ session, token }) {
            logger.info('📦 Session callback ejecutado', { 
                hasToken: !!token,
                tokenUid: token?.uid 
            });
            
            if (token) {
                session.user = {
                    ...session.user,
                    id: token.uid as string,
                    email: token.email as string,
                    nombre: token.nombre as string,
                    apellido: token.apellido as string,
                    authProvider: token.authProvider as string,
                };
                
                logger.info('✅ Sesión creada', { 
                    userId: session.user.id,
                    email: session.user.email 
                });
            }
            
            return session;
        },
        
        async signIn({ user, account, profile }) {
            logger.info('🚪 SignIn callback ejecutado', {
                hasUser: !!user,
                hasAccount: !!account,
                hasProfile: !!profile,
                provider: account?.provider
            });
            
            return true;
        },
    },
    
    events: {
        async signIn(message) {
            logger.info('✅ Evento: Usuario inició sesión', {
                userId: message.user.id,
                provider: message.account?.provider
            });
        },
        async signOut(message) {
            logger.info('🚪 Evento: Usuario cerró sesión', {
                token: 'token' in message && message.token ? 'exists' : 'none'
            });
        },
        async createUser(message) {
            logger.info('👤 Evento: Usuario creado', {
                userId: message.user.id
            });
        },
        async linkAccount(message) {
            logger.info('🔗 Evento: Cuenta vinculada', {
                userId: message.user.id,
                provider: message.account.provider
            });
        },
    },
});


// Función para obtener y limpiar los datos temporales del usuario
export function getTempUserData() {
    const data = tempUserData;
    tempUserData = null; // Limpiar después de obtener
    return data;
}