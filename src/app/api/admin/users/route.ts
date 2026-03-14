import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ADMIN_EMAIL } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();

    // Verificar que sea el admin
    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener todos los usuarios con sus equipos
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

    // Formatear respuesta
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
      isAdmin: user.email === ADMIN_EMAIL || user.role === Role.ADMIN,
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

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    // Verificar que sea el admin
    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role, teamId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el usuario exista
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // No permitir cambiar el rol del admin
    if (user.email === ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'No se puede modificar el rol del administrador principal' },
        { status: 403 }
      );
    }

    // Actualizar usuario
    const updateData: any = {};

    if (role && ['LEADER', 'AGENT'].includes(role)) {
      updateData.role = role;

      // Si se asigna como líder y se especifica un teamId, asignarlo como líder del equipo
      if (role === 'LEADER' && teamId) {
        // Actualizar el equipo para que este usuario sea el líder
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

    // Crear log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
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
        isAdmin: updatedUser.email === ADMIN_EMAIL || updatedUser.role === Role.ADMIN,
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
