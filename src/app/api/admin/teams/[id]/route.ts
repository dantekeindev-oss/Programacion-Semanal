import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ADMIN_EMAIL } from '@/lib/auth';

// GET - Obtener detalles de un equipo específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    // Verificar que sea el admin
    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        leader: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        members: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            role: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Equipo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: team.id,
        name: team.name,
        description: team.description,
        leaderId: team.leaderId,
        leader: team.leader,
        memberCount: team.members.length,
        members: team.members,
        createdAt: team.createdAt,
      },
    });
  } catch (error) {
    console.error('Error al obtener equipo:', error);
    return NextResponse.json(
      { error: 'Error al obtener equipo' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar el líder de un equipo
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    // Verificar que sea el admin
    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { leaderEmail } = body;

    if (!leaderEmail) {
      return NextResponse.json(
        { error: 'El email del líder es requerido' },
        { status: 400 }
      );
    }

    // Buscar al usuario que será el nuevo líder
    const newLeader = await prisma.user.findUnique({
      where: { email: leaderEmail },
      include: {
        team: true,
      },
    });

    if (!newLeader) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // No permitir usar el email del admin como líder de equipo
    if (newLeader.email === ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'El administrador principal no puede ser asignado como líder de equipo' },
        { status: 403 }
      );
    }

    // Obtener el equipo actual
    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        leader: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Equipo no encontrado' },
        { status: 404 }
      );
    }

    // Si el usuario ya es líder de este equipo, no hacer nada
    if (team.leaderId === newLeader.id) {
      return NextResponse.json({
        data: {
          id: team.id,
          name: team.name,
          description: team.description,
          leaderId: team.leaderId,
          leader: team.leader,
        },
      });
    }

    // Si el nuevo líder ya está en otro equipo, moverlo a este equipo
    if (newLeader.teamId && newLeader.teamId !== params.id) {
      // Desvincular del equipo anterior
      await prisma.user.update({
        where: { id: newLeader.id },
        data: { teamId: params.id },
      });
    } else if (!newLeader.teamId) {
      // Si no tiene equipo, asignarle este
      await prisma.user.update({
        where: { id: newLeader.id },
        data: { teamId: params.id },
      });
    }

    // Actualizar el rol del nuevo líder a LEADER
    await prisma.user.update({
      where: { id: newLeader.id },
      data: { role: 'LEADER' },
    });

    // Si había un líder anterior, cambiar su rol a AGENT
    if (team.leaderId && team.leaderId !== newLeader.id) {
      await prisma.user.update({
        where: { id: team.leaderId },
        data: { role: 'AGENT' },
      });
    }

    // Actualizar el equipo con el nuevo líder
    const updatedTeam = await prisma.team.update({
      where: { id: params.id },
      data: { leaderId: newLeader.id },
      include: {
        leader: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Crear log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TEAM_UPDATE',
        entity: 'TEAM',
        entityId: params.id,
        changes: {
          previous: {
            leaderId: team.leaderId,
            leaderEmail: team.leader?.email || null,
          },
          new: {
            leaderId: newLeader.id,
            leaderEmail: newLeader.email,
          },
        },
      },
    });

    return NextResponse.json({
      data: {
        id: updatedTeam.id,
        name: updatedTeam.name,
        description: updatedTeam.description,
        leaderId: updatedTeam.leaderId,
        leader: updatedTeam.leader,
      },
    });
  } catch (error) {
    console.error('Error al actualizar equipo:', error);
    return NextResponse.json(
      { error: 'Error al actualizar equipo' },
      { status: 500 }
    );
  }
}
