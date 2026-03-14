import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

// Dominio corporativo
const CORPORATE_DOMAIN = 'konecta.com';

// Email de administrador único
const ADMIN_EMAIL = 'dantekein90151@gmail.com';

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
          hd: CORPORATE_DOMAIN, // Restringir al dominio corporativo
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const email = user.email;

        // Validar que sea un email permitido
        if (!email) {
          return false;
        }

        // El admin puede tener cualquier email
        const isAdmin = email === ADMIN_EMAIL;

        // Los demás usuarios deben tener dominio corporativo
        const emailDomain = email.split('@')[1]?.toLowerCase();
        if (!isAdmin && emailDomain !== CORPORATE_DOMAIN) {
          console.error(`Email ${email} no pertenece al dominio corporativo ${CORPORATE_DOMAIN}`);
          throw new Error(`Solo se permiten emails del dominio @${CORPORATE_DOMAIN}. Contacta a soporte si necesitas acceso.`);
        }

        // Extraer nombre y apellido del nombre completo
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
            firstName = user.email.split('@')[0];
          }
        }

        // Determinar rol: ADMIN si es el email específico, sino AGENT por defecto
        // Nota: El rol LEADER se asigna cuando el usuario se crea en un equipo
        let role: 'LEADER' | 'AGENT' | 'ADMIN' = isAdmin ? 'ADMIN' : 'AGENT';

        // Buscar si ya existe el usuario
        const existingUser = await prisma.user.findUnique({
          where: { email },
          include: { team: true, role: true },
        });

        let userId = existingUser?.id;

        // Si no existe, crearlo
        if (!existingUser) {
          // Verificar si existe un equipo donde este email es el líder
          // (esto se maneja en la carga de Excel)
          const newUser = await prisma.user.create({
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
          userId = newUser.id;
        } else {
          // Si existe, actualizar datos básicos y último login
          const updates: any = {
            lastLoginAt: new Date(),
          };

          // Solo actualizar nombre/apellido si son nulos o vacíos
          if (!existingUser.firstName || !existingUser.lastName) {
            updates.firstName = firstName;
            updates.lastName = lastName;
          }

          await prisma.user.update({
            where: { id: existingUser.id },
            data: updates,
          });
        }

        // Crear log de auditoría
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'LOGIN',
            entity: 'USER',
            changes: {
              email,
              role,
              isAdmin,
              domain: emailDomain,
            },
          },
        });

        return true;
      }
      return true;
    },
    async session({ session, user }) {
      if (session?.user && user) {
        // Extender la sesión con información adicional
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
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
    session: {
      strategy: 'database',
    },
    pages: {
      signIn: '/login',
      error: '/error',
    },
    events: {
      async signIn({ user }) {
        console.log(`Usuario autenticado: ${user.email}, Rol: ${user.role}, Admin: ${user.email === ADMIN_EMAIL}`);
      },
    },
  },
});
