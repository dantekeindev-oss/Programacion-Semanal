import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminAuthConfig, requireAdminSession } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authResult = requireAdminSession(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    const teams = await prisma.team.findMany({
      include: {
        leader: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const formattedTeams = teams.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      leaderId: team.leaderId,
      leaderEmail: team.leader?.email || null,
      leaderName: team.leader?.name || null,
      memberCount: team._count.members,
      createdAt: team.createdAt,
    }));

    return NextResponse.json({ data: formattedTeams });
  } catch (error) {
    console.error('Error al obtener equipos:', error);
    return NextResponse.json(
      { error: 'Error al obtener equipos' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authResult = requireAdminSession(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { adminEmail } = getAdminAuthConfig();
    const body = await req.json();
    const { name, description, leaderEmail } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre del equipo es requerido' },
        { status: 400 }
      );
    }

    if (!leaderEmail) {
      return NextResponse.json(
        { error: 'El lider del equipo es requerido' },
        { status: 400 }
      );
    }

    const leader = await prisma.user.findUnique({
      where: { email: leaderEmail },
    });

    if (!leader) {
      return NextResponse.json(
        { error: 'El lider especificado no existe' },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id: leader.id },
      data: { role: 'LEADER' },
    });

    const team = await prisma.team.create({
      data: {
        name,
        description,
        leaderId: leader.id,
      },
    });

    await prisma.user.update({
      where: { id: leader.id },
      data: { teamId: team.id },
    });

    const adminUser = await prisma.user.findFirst({
      where: { email: adminEmail },
    });

    if (adminUser) {
      await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: 'TEAM_CREATE',
          entity: 'TEAM',
          entityId: team.id,
          changes: {
            name,
            leaderEmail,
          },
        },
      });
    }

    return NextResponse.json({
      data: {
        id: team.id,
        name: team.name,
        description: team.description,
        leaderId: team.leaderId,
        memberCount: 0,
      },
    });
  } catch (error) {
    console.error('Error al crear equipo:', error);
    return NextResponse.json(
      { error: 'Error al crear equipo' },
      { status: 500 }
    );
  }
}
