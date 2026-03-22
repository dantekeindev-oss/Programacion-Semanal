import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getTeamMetrics, getTeamKPIs } from '@/lib/operations/operationsService';

export const dynamic = 'force-dynamic';

// GET - Obtener métricas del equipo del líder
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  // Verificar que sea líder o admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user || (user.role !== 'LEADER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const islandId = searchParams.get('islandId') || undefined;
    const skill = searchParams.get('skill') || undefined;
    const status = searchParams.get('status') || undefined;

    // Obtener KPIs del equipo
    const kpis = await getTeamKPIs(user.id);

    // Obtener métricas detalladas
    const metrics = await getTeamMetrics(user.id, {
      islandId,
      skill,
      status,
    });

    return NextResponse.json({
      success: true,
      data: {
        kpis,
        metrics,
        filters: {
          islandId,
          skill,
          status,
        },
      },
    });
  } catch (error) {
    console.error('Error al obtener dashboard del líder:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al obtener dashboard' },
      { status: 500 }
    );
  }
}
