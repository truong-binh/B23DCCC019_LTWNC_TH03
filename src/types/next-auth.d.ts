import type { DefaultSession } from 'next-auth';
import type { Role } from '@/types';

declare module 'next-auth' {
  interface User {
    role: Role;
  }

  interface Session {
    user: {
      role: Role;
    } & DefaultSession['user'];
  }
}

// next-auth/jwt chỉ re-export lại @auth/core/jwt nên phải mở rộng cả hai module.
declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role?: Role;
  }
}
