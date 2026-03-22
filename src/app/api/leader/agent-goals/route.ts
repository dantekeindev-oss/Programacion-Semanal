import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { upsertAgentGoal, getLeaderAgentGoals } from '@/lib/operations/operationsService';

export const dynamic = 'force-dynamic';

// GET - Obtener objetivos de agentes del líder
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user || (user.role !== 'LEADER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const periodMonth = searchParams.get('periodMonth')
      ? parseInt(searchParams.get('periodMonth')!, 10)
      : undefined;
    const periodYear = searchParams.get('periodYear')
      ? parseInt(searchParams.get('periodYear')!, 10)
      : undefined;

    const goals = await getLeaderAgentGoals(user.id, periodMonth, periodYear);

    return NextResponse.json({
      success: true,
      data: goals,
    });
  } catch (error) {
    console.error('Error al obtener objetivos:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al obtener objetivos' },
      { status: 500 }
    );
  }
}

// POST - Crear objetivo para un agente
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user || (user.role !== 'LEADER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      agentEmployeeId,
      periodMonth,
      periodYear,
      targetTmoSeconds,
      targetFcr,
      targetNps,
      targetRel,
    } = body;

    // Validaciones
    if (!agentEmployeeId) {
      return NextResponse.json(
        { success: false, error: 'El employeeId del agente es obligatorio' },
        { status: 400 }
      );
    }

    if (!periodMonth || !periodYear) {
      return NextResponse.json(
        { success: false, error: 'El período (mes y año) es obligatorio' },
        { status: 400 }
      );
    }

    if (periodMonth < 1 || periodMonth > 12) {
      return NextResponse.json(
        { success: false, error: 'El mes debe estar entre 1 y 12' },
        { status: 400 }
      );
    }

    // Verificar que el agente existe
    const agent = await prisma.user.findFirst({
      where: {
        employeeId: agentEmployeeId,
        role: 'AGENT',
      },
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agente no encontrado' },
        { status: 404 }
      );
    }

    // Crear objetivo
    await upsertAgentGoal(user.id, {
      agentEmployeeId,
      periodMonth,
      periodYear,
      targetTmoSeconds,
      targetFcr,
      targetNps,
      targetRel,
    });

    return NextResponse.json({
      success: true,
      message: 'Objetivo guardado correctamente',
    });
  } catch (error) {
    console.error('Error al crear objetivo:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al crear objetivo' },
      { status: 500 }
    );
  }
}
