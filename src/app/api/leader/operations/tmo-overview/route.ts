import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getGeneralTMOOverview } from '@/lib/operations/operationsService';

export const dynamic = 'force-dynamic';

// GET - Obtener vista TMO general
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

    const metrics = await getGeneralTMOOverview({
      islandId,
      skill,
      status,
    });

    // Calcular promedios generales
    const withTmo = metrics.filter(m => m.tmoSeconds !== null && m.tmoSeconds !== undefined);
    const averageTmo = withTmo.length > 0
      ? withTmo.reduce((sum, m) => sum + (m.tmoSeconds || 0), 0) / withTmo.length
      : 0;

    // Contar por estado
    const byStatus: Record<string, number> = {};
    for (const m of metrics) {
      const s = m.currentStatus || 'SIN_DATOS';
      byStatus[s] = (byStatus[s] || 0) + 1;
    }

    // Ranking por TMO (peores primero)
    const ranking = [...metrics]
      .filter(m => m.tmoSeconds !== null && m.tmoSeconds !== undefined)
      .sort((a, b) => (b.tmoSeconds || 0) - (a.tmoSeconds || 0))
      .slice(0, 20);

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        summary: {
          total: metrics.length,
          withTmo: withTmo.length,
          averageTmo: Math.round(averageTmo),
          byStatus,
        },
        ranking,
        filters: {
          islandId,
          skill,
          status,
        },
      },
    });
  } catch (error) {
    console.error('Error al obtener TMO general:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al obtener TMO general' },
      { status: 500 }
    );
  }
}
