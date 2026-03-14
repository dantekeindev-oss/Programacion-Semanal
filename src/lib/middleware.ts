import { auth } from './auth';
import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';

// Dominio corporativo
const CORPORATE_DOMAIN = 'konecta.com';

// Email de administrador único
const ADMIN_EMAIL = 'dantekein90151@gmail.com';

/**
 * Verifica que el usuario esté autenticado
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    return { error: 'No autenticado', status: 401 };
  }

  return { session };
}

/**
 * Verifica que el usuario tenga un rol específico
 */
export async function requireRole(roles: Role[]) {
  const authResult = await requireAuth();

  if ('error' in authResult) {
    return authResult;
  }

  const { session } = authResult;
  const userRole = session.user.role as Role;

  if (!userRole || !roles.includes(userRole)) {
    return { error: 'No autorizado', status: 403 };
  }

  return { session };
}

/**
 * Verifica que el usuario sea líder o admin
 */
export async function requireLeader() {
  return requireRole([Role.LEADER, Role.ADMIN]);
}

/**
 * Verifica que el usuario sea agente
 */
export async function requireAgent() {
  return requireRole([Role.AGENT]);
}

/**
 * Verifica que el usuario sea admin
 */
export async function requireAdmin() {
  return requireRole([Role.ADMIN]);
}

/**
 * Verifica si un usuario es administrador por email
 */
export async function isAdmin(userId: string): Promise<boolean> {
  // Verificar en base de datos si el usuario es admin
  const { prisma } = await import('./prisma');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true },
  });

  if (!user) {
    return false;
  }

  return user.email === ADMIN_EMAIL || user.role === Role.ADMIN;
}

/**
 * Verifica si el email pertenece al dominio corporativo
 */
export function isCorporateEmail(email: string): boolean {
  if (!email) return false;

  const emailDomain = email.split('@')[1]?.toLowerCase();
  return emailDomain === CORPORATE_DOMAIN;
}

/**
 * Verifica si un usuario puede acceder a cierta funcionalidad
 */
export async function canAccessAsAdmin(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const { prisma } = await import('./prisma');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true },
  });

  if (!user) {
    return { allowed: false, reason: 'Usuario no encontrado' };
  }

  const isTheAdmin = user.email === ADMIN_EMAIL || user.role === Role.ADMIN;

  if (isTheAdmin) {
    return { allowed: true };
  }

  // El usuario debe tener dominio corporativo
  if (!isCorporateEmail(user.email)) {
    return { allowed: false, reason: `Solo se permiten emails del dominio @${CORPORATE_DOMAIN}` };
  }

  return { allowed: true };
}

/**
 * Helper para responder con error
 */
export function unauthorizedResponse(message: string = 'No autorizado') {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Helper para responder con error de autenticación
 */
export function unauthenticatedResponse(message: string = 'No autenticado') {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Verifica que un usuario pueda acceder a información de otro usuario
 */
export async function requireAccessToUser(
  requesterId: string,
  targetUserId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const { prisma } = await import('./prisma');
  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { id: true, email: true, role: true, teamId: true },
  });

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true, role: true, teamId: true },
  });

  if (!requester || !target) {
    return { allowed: false, reason: 'Usuario no encontrado' };
  }

  // Admin puede acceder a todo
  const isRequesterAdmin = requester.email === ADMIN_EMAIL || requester.role === Role.ADMIN;
  if (isRequesterAdmin) {
    return { allowed: true };
  }

  // Líder puede acceder a información de su equipo
  const isRequesterLeader = requester.role === Role.LEADER;
  if (isRequesterLeader) {
    if (requester.teamId === target.teamId) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Solo puedes ver información de usuarios de tu propio equipo' };
  }

  // Usuarios regulares solo pueden ver su propia información
  if (requester.role === Role.AGENT) {
    if (requesterId === targetUserId) {
      return { allowed: true }; // Puede ver su propia información
    }
    return { allowed: false, reason: 'No tienes permisos para ver información de otros usuarios' };
  }

  return { allowed: false, reason: 'No autorizado' };
}

/**
 * Obtiene el rol de un usuario
 */
export async function getUserRole(userId: string): Promise<Role | null> {
  const { prisma } = await import('./prisma');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role || null;
}

/**
 * Obtiene información de usuario extendida
 */
export async function getUserInfo(userId: string) {
  const { prisma } = await import('./prisma');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      team: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      role: true,
      teamId: true,
      isAdmin: false, // Computed field
    },
  });

  if (!user) {
    return null;
  }

  // Verificar si es admin
  const isAdmin = user.email === ADMIN_EMAIL || user.role === Role.ADMIN;

  return {
    ...user,
    isAdmin,
    teamName: user.team?.name || null,
    hasTeam: !!user.teamId,
  };
}
