import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getAdminAuthConfig, requireAdminSession } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authResult = requireAdminSession(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { adminEmail } = getAdminAuthConfig();

    const users = await prisma.user.findMany({
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      teamId: user.teamId,
      teamName: user.team?.name || null,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      isAdmin: user.email === adminEmail || user.role === Role.ADMIN,
    }));

    return NextResponse.json({ data: formattedUsers });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = requireAdminSession(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { adminEmail } = getAdminAuthConfig();
    const body = await req.json();
    const { userId, role, teamId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    if (user.email === adminEmail) {
      return NextResponse.json(
        { error: 'No se puede modificar el rol del administrador principal' },
        { status: 403 }
      );
    }

    const updateData: Record<string, string | null> = {};

    if (role && ['LEADER', 'AGENT'].includes(role)) {
      updateData.role = role;

      if (role === 'LEADER' && teamId) {
        await prisma.team.update({
          where: { id: teamId },
          data: { leaderId: userId },
        });
      }
    }

    if (teamId !== undefined) {
      updateData.teamId = teamId;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const adminUser = await prisma.user.findFirst({
      where: { email: adminEmail },
    });

    if (adminUser) {
      await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: 'USER_UPDATE',
          entity: 'USER',
          entityId: userId,
          changes: {
            previous: {
              role: user.role,
              teamId: user.teamId,
            },
            new: updateData,
          },
        },
      });
    }

    return NextResponse.json({
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        teamId: updatedUser.teamId,
        teamName: updatedUser.team?.name || null,
        isAdmin: updatedUser.email === adminEmail || updatedUser.role === Role.ADMIN,
      },
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}
