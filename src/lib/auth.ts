import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import { prisma } from './prisma';

const CORPORATE_DOMAIN = process.env.CORPORATE_DOMAIN || 'konecta.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'dantekein90151@gmail.com';
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
const GOOGLE_CLIENT_ID = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';

export const authConfig = {
  trustHost: true,
  secret: AUTH_SECRET,
  debug: process.env.NODE_ENV !== 'production',
  logger: {
    error(error: unknown) {
      console.error('Auth.js error:', error);
    },
    warn(code: string) {
      console.warn('Auth.js warning:', code);
    },
    debug(code: string, metadata: unknown) {
      console.debug('Auth.js debug:', code, metadata);
    },
  },
  providers: [
    Google({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      authorization: {
        url: 'https://accounts.google.com/o/oauth2/v2/auth',
        params: {
          scope: 'openid email profile',
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
      token: 'https://oauth2.googleapis.com/token',
      userinfo: 'https://openidconnect.googleapis.com/v1/userinfo',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        const email = user.email;

        if (!email) {
          return false;
        }

        const isAdmin = email === ADMIN_EMAIL;
        const emailDomain = email.split('@')[1]?.toLowerCase();

        if (!isAdmin && emailDomain !== CORPORATE_DOMAIN) {
          console.error(`Email ${email} no pertenece al dominio corporativo ${CORPORATE_DOMAIN}`);
          throw new Error(`Solo se permiten emails del dominio @${CORPORATE_DOMAIN}. Contacta a soporte si necesitas acceso.`);
        }

        let firstName = '';
        let lastName = '';

        if (user.name) {
          const nameParts = user.name.split(' ');

          if (nameParts.length >= 2) {
            lastName = nameParts.slice(0, -1).join(' ');
            firstName = nameParts[nameParts.length - 1];
          } else if (nameParts.length === 1) {
            firstName = nameParts[0];
          } else {
            firstName = email.split('@')[0];
          }
        }

        // Buscar usuario existente
        const existingUser = await prisma.user.findUnique({
          where: { email },
          include: { team: true },
        });

        if (!existingUser) {
          // Si es nuevo usuario, asignar rol AGENT por defecto
          // El rol LEADER se asignará desde el panel de admin
          const role: 'LEADER' | 'AGENT' | 'ADMIN' = isAdmin ? 'ADMIN' : 'AGENT';

          await prisma.user.create({
            data: {
              email,
              name: user.name,
              firstName,
              lastName,
              image: user.image,
              role,
              lastLoginAt: new Date(),
            },
          });
        } else {
          // Si el usuario ya existe, mantener su rol actual
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              firstName: firstName || existingUser.firstName,
              lastName: lastName || existingUser.lastName,
              lastLoginAt: new Date(),
              // Mantener el rol existente, no sobrescribir
            },
          });
        }

        return true;
      }

      return true;
    },
    async session({ session }) {
      if (session?.user) {
        const sessionEmail = session.user.email;

        if (!sessionEmail) {
          return session;
        }

        const dbUser = await prisma.user.findUnique({
          where: { email: sessionEmail },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            firstName: true,
            lastName: true,
            role: true,
            teamId: true,
            weeklyDayOff: true,
            team: {
              select: {
                name: true,
              },
            },
          },
        });

        if (dbUser) {
          session.user = {
            ...session.user,
            ...dbUser,
            isAdmin: dbUser.email === ADMIN_EMAIL,
            teamName: dbUser.team?.name || null,
          };
        }
      }

      return session;
    },
    async jwt({ token, user }) {
      const email = user?.email || token.email;

      if (!email) {
        return token;
      }

      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          firstName: true,
          lastName: true,
          role: true,
          teamId: true,
          weeklyDayOff: true,
          team: {
            select: {
              name: true,
            },
          },
        },
      });

      if (dbUser) {
        token.sub = dbUser.id;
        token.email = dbUser.email;
        token.name = dbUser.name;
        token.picture = dbUser.image;
        token.role = dbUser.role;
        token.teamId = dbUser.teamId;
        token.weeklyDayOff = dbUser.weeklyDayOff;
        token.firstName = dbUser.firstName;
        token.lastName = dbUser.lastName;
        token.isAdmin = dbUser.email === ADMIN_EMAIL;
        token.teamName = dbUser.team?.name || null;
      }

      return token;
    },
  },
  pages: {
    signIn: '/',
    error: '/error',
  },
} satisfies NextAuthConfig;

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
