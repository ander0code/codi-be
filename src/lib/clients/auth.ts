import { Auth } from '@auth/core';
import type { AuthConfig } from '@auth/core/types';
import Google from '@auth/core/providers/google';
import { env } from '@/config/env.js';
import { AuthRepository } from '@/modules/auth/repository.js';

export const authConfig: AuthConfig = {
  
  basePath: '/auth',
  providers: [
    Google({
      clientId: env.google.clientId,
      clientSecret: env.google.clientSecret,
    }),
  ],
  secret: env.jwt.secret,
  trustHost: true,
  callbacks: {
    async jwt({ token, account, profile, trigger }) {
      // Solo se ejecuta en el primer login (cuando account existe)
      if (account && profile && trigger === 'signIn') {
        const googleId = profile.sub as string;
        const email = profile.email as string;
        const nombre = (profile.given_name as string) || 'Usuario';
        const apellido = (profile.family_name as string) || 'Codi';

        // Buscar o crear usuario en tu DB
        const user = await AuthRepository.findOrCreateGoogleUser({
          googleId,
          email,
          nombre,
          apellido,
        });

        // Agregar datos al token
        token.uid = user.id;
        token.email = user.email;
        token.nombre = user.nombre;
        token.apellido = user.apellido;
      }

      return token;
    },
    async session({ session, token }) {
      // Pasar datos del token a la sesiÃ³n
      if (token) {
        session.user = {
          ...session.user,
          id: token.uid as string,
          email: token.email as string,
          nombre: token.nombre as string,
          apellido: token.apellido as string,
        };
      }

      return session;
    },
  },
};

export async function handleAuth(request: Request) {
  return Auth(request, authConfig);
}