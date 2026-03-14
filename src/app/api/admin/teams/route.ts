import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ADMIN_EMAIL } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();

    // Verificar que sea el admin
    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener todos los equipos con sus líderes y conteo de miembros
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

    // Formatear respuesta
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

export async function POST(request: Request) {
  try {
    const session = await auth();

    // Verificar que sea el admin
    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, leaderEmail } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre del equipo es requerido' },
        { status: 400 }
      );
    }

    // Si se especifica un líder, buscar al usuario
    let leaderId: string | undefined;
    if (leaderEmail) {
      const leader = await prisma.user.findUnique({
        where: { email: leaderEmail },
      });

      if (!leader) {
        return NextResponse.json(
          { error: 'El líder especificado no existe' },
          { status: 404 }
        );
      }

      leaderId = leader.id;

      // Actualizar el rol del usuario a LEADER
      await prisma.user.update({
        where: { id: leaderId },
        data: { role: 'LEADER' },
      });
    }

    // Crear el equipo
    const team = await prisma.team.create({
      data: {
        name,
        description,
        leaderId: leaderId!,
      },
    });

    // Si se creó con líder, asignarlo al equipo
    if (leaderId) {
      await prisma.user.update({
        where: { id: leaderId },
        data: { teamId: team.id },
      });
    }

    // Crear log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TEAM_CREATE',
        entity: 'TEAM',
        entityId: team.id,
        changes: {
          name,
          leaderEmail,
        },
      },
    });

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
