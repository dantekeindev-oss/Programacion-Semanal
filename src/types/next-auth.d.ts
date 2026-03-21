import { DefaultSession } from 'next-auth';
import { Role, WeekDay } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      firstName: string | null;
      lastName: string | null;
      role: Role;
      teamId: string | null;
      weeklyDayOff: WeekDay | null;
      isAdmin: boolean;
      teamName: string | null;
    };
  }

  interface User {
    role: Role;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: Role;
    firstName: string | null;
    lastName: string | null;
    teamId: string | null;
    weeklyDayOff: WeekDay | null;
    isAdmin: boolean;
    teamName: string | null;
  }
}
