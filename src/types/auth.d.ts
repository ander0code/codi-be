import '@auth/core/types';
import '@auth/core/jwt';

declare module '@auth/core/types' {
  interface Session {
    user: {
      id: string;
      email: string;
      nombre: string;
      apellido: string;
    };
  }

  interface User {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    uid?: string;
    email?: string;
    nombre?: string;
    apellido?: string;
  }
}
