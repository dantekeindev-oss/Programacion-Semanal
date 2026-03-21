import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { WeekDay } from '@prisma/client';

export const dynamic = 'force-dynamic';

type SwapType = 'SCHEDULE' | 'DAY_OFF';

interface SwapRequest {
  agentId: string;
  type: SwapType;
  targetDate: string;
  // Para cambio de horario
  newSchedule?: string;
  newDayOff?: WeekDay;
  reason?: string;
}

// POST - Crear un enroque de horario o franco
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  // Verificar que sea un líder
  const leader = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, name: true, email: true },
  });

  if (!leader || leader.role !== 'LEADER') {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body: SwapRequest = await req.json();
    const { agentId, type, targetDate, newSchedule, newDayOff, reason } = body;

    if (!agentId || !type || !targetDate) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el agente pertenezca al equipo del líder
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      include: { team: true },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agente no encontrado' }, { status: 404 });
    }

    // Verificar que el agente pertenezca al equipo del líder
    const leaderTeam = await prisma.team.findFirst({
      where: { leaderId: leader.id },
    });

    if (!leaderTeam || agent.teamId !== leaderTeam.id) {
      return NextResponse.json(
        { success: false, error: 'El agente no pertenece a tu equipo' },
        { status: 403 }
      );
    }

    // Crear registro de auditoría del enroque
    const auditLog = await prisma.auditLog.create({
      data: {
        userId: leader.id,
        action: type === 'SCHEDULE' ? 'SCHEDULE_SWAP' : 'DAY_OFF_SWAP',
        entity: 'USER',
        entityId: agentId,
        changes: {
          targetDate,
          ...(type === 'SCHEDULE' ? { newSchedule } : { newDayOff }),
          reason: reason || 'Enroque realizado por líder',
        },
      },
    });

    // Actualizar horario o franco del agente
    if (type === 'SCHEDULE' && newSchedule) {
      // Actualizar el horario del día
      const targetWeekDay = new Date(targetDate).getDay(); // 0 = Sunday, 1 = Monday, etc.
      const weekDayMap: Record<number, WeekDay> = {
        0: 'SUNDAY',
        1: 'MONDAY',
        2: 'TUESDAY',
        3: 'WEDNESDAY',
        4: 'THURSDAY',
        5: 'FRIDAY',
        6: 'SATURDAY',
      };

      // Buscar si ya existe un schedule para ese día
      const existingSchedule = await prisma.schedule.findFirst({
        where: {
          userId: agentId,
          validFrom: { lte: new Date(targetDate) },
          OR: [
            { validTo: null },
            { validTo: { gte: new Date(targetDate) } },
          ],
        },
      });

      if (existingSchedule) {
        // Actualizar el schedule existente
        await prisma.schedule.update({
          where: { id: existingSchedule.id },
          data: { timeRange: newSchedule },
        });
      } else {
        // Crear nuevo schedule
        await prisma.schedule.create({
          data: {
            userId: agentId,
            teamId: leaderTeam.id,
            timeRange: newSchedule,
            validFrom: new Date(targetDate),
            validTo: null,
          },
        });
      }
    } else if (type === 'DAY_OFF' && newDayOff) {
      // Actualizar el franco semanal
      await prisma.user.update({
        where: { id: agentId },
        data: { weeklyDayOff: newDayOff },
      });
    }

    // Crear notificación para el agente
    await prisma.notification.create({
      data: {
        userId: agentId,
        type: type === 'SCHEDULE' ? 'SCHEDULE_SWAP' : 'DAY_OFF_SWAP',
        title: type === 'SCHEDULE' ? 'Cambio de horario' : 'Cambio de franco',
        message: `${leader.name} realizó un ${type === 'SCHEDULE' ? 'cambio de horario' : 'cambio de franco'} para el día ${new Date(targetDate).toLocaleDateString('es-AR')}. Motivo: ${reason || 'Enroque de líder'}`,
        requestId: auditLog.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Enroque realizado correctamente',
      data: {
        agentId,
        type,
        targetDate,
        ...(type === 'SCHEDULE' ? { newSchedule } : { newDayOff }),
      },
    });
  } catch (error) {
    console.error('Error al realizar enroque:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al realizar enroque' },
      { status: 500 }
    );
  }
}

// GET - Obtener el historial de enroques del líder
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  // Verificar que sea un líder
  const leader = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!leader || leader.role !== 'LEADER') {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
  }

  try {
    // Obtener los logs de auditoría de enroques realizados por este líder
    const swapLogs = await prisma.auditLog.findMany({
      where: {
        userId: leader.id,
        action: {
          in: ['SCHEDULE_SWAP', 'DAY_OFF_SWAP'],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Para cada log, obtener información del agente afectado
    const swapsWithAgentInfo = await Promise.all(
      swapLogs.map(async (log) => {
        const agent = await prisma.user.findUnique({
          where: { id: log.entityId },
          select: {
            id: true,
            name: true,
            firstName: true,
            email: true,
            weeklyDayOff: true,
          },
        });

        return {
          id: log.id,
          type: log.action,
          targetDate: log.changes?.targetDate,
          changes: log.changes,
          createdAt: log.createdAt,
          agent: agent ? {
            id: agent.id,
            name: agent.name,
            firstName: agent.firstName,
            email: agent.email,
          } : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: swapsWithAgentInfo,
    });
  } catch (error) {
    console.error('Error al obtener historial de enroques:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al obtener historial' },
      { status: 500 }
    );
  }
}
