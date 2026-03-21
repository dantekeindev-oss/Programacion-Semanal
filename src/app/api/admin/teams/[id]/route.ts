import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminAuthConfig, requireAdminSession } from '@/lib/adminAuth';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = requireAdminSession(req);
    if ('error' in authResult) {
      return authResult.error;
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

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = requireAdminSession(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { adminEmail } = getAdminAuthConfig();
    const body = await req.json();
    const { leaderEmail } = body;

    if (!leaderEmail) {
      return NextResponse.json(
        { error: 'El email del lider es requerido' },
        { status: 400 }
      );
    }

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

    if (newLeader.email === adminEmail) {
      return NextResponse.json(
        { error: 'El administrador principal no puede ser asignado como lider de equipo' },
        { status: 403 }
      );
    }

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

    if (newLeader.role === 'LEADER' && newLeader.teamId && newLeader.teamId !== params.id) {
      return NextResponse.json(
        { error: 'El usuario ya lidera otro equipo. Desasignalo primero antes de moverlo.' },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const previousLeaderId = team.leaderId;

      await tx.user.update({
        where: { id: newLeader.id },
        data: {
          teamId: params.id,
          role: 'LEADER',
        },
      });

      if (previousLeaderId && previousLeaderId !== newLeader.id) {
        await tx.user.update({
          where: { id: previousLeaderId },
          data: { role: 'AGENT' },
        });
      }

      await tx.team.update({
        where: { id: params.id },
        data: { leaderId: newLeader.id },
      });
    });

    const updatedTeam = await prisma.team.findUnique({
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
      },
    });

    const adminUser = await prisma.user.findFirst({
      where: { email: adminEmail },
    });

    if (adminUser) {
      await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
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
    }

    return NextResponse.json({
      data: {
        id: updatedTeam?.id,
        name: updatedTeam?.name,
        description: updatedTeam?.description,
        leaderId: updatedTeam?.leaderId,
        leader: updatedTeam?.leader,
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
