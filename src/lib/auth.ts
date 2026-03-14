import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

// Dominio corporativo configurable
const CORPORATE_DOMAIN = process.env.CORPORATE_DOMAIN || 'example.com';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          hd: CORPORATE_DOMAIN, // Restringe al dominio corporativo
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        // Verificar que el email pertenezca al dominio corporativo
        const email = user.email;
        if (!email) {
          return false;
        }

        const domain = email.split('@')[1];
        if (domain !== CORPORATE_DOMAIN) {
          console.error(`Email ${email} no pertenece al dominio corporativo ${CORPORATE_DOMAIN}`);
          return false;
        }

        // Extraer nombre y apellido del nombre completo
        if (user.name) {
          const nameParts = user.name.split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ');

          // Actualizar el usuario con nombre y apellido
          await prisma.user.update({
            where: { email },
            data: {
              firstName,
              lastName,
              lastLoginAt: new Date(),
            },
          });
        } else {
          await prisma.user.update({
            where: { email },
            data: { lastLoginAt: new Date() },
          });
        }

        // Crear log de auditoría
        await prisma.auditLog.create({
          data: {
            user: { connect: { email } },
            action: 'LOGIN',
            entity: 'USER',
            changes: { email },
          },
        });
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        // Extender la sesión con información adicional
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { team: true },
        });

        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.role = dbUser.role;
          session.user.firstName = dbUser.firstName;
          session.user.lastName = dbUser.lastName;
          session.user.teamId = dbUser.teamId;
          session.user.teamName = dbUser.team?.name || null;
          session.user.weeklyDayOff = dbUser.weeklyDayOff;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/error',
  },
  session: {
    strategy: 'database',
  },
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
  },
});
