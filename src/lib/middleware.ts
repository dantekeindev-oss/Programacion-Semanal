import { auth } from './auth';
import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';

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

  if (!session.user.role || !roles.includes(session.user.role as Role)) {
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
 * Verifica que un usuario pueda acceder a información de otro usuario
 * Solo el propio usuario o su líder pueden acceder
 */
export async function requireAccessToUser(
  requesterId: string,
  targetUserId: string
) {
  // Si es el propio usuario, permitir
  if (requesterId === targetUserId) {
    return { allowed: true };
  }

  // Si es el líder del usuario, permitir
  const { prisma } = await import('./prisma');
  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { role: true },
  });

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { leaderId: true },
  });

  if (!requester || !targetUser) {
    return { allowed: false, error: 'Usuario no encontrado' };
  }

  if (requester.role === Role.LEADER && targetUser.leaderId === requesterId) {
    return { allowed: true };
  }

  if (requester.role === Role.ADMIN) {
    return { allowed: true };
  }

  return { allowed: false, error: 'No autorizado' };
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
