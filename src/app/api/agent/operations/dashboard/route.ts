import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getAgentDashboardData } from '@/lib/operations/operationsService';

export const dynamic = 'force-dynamic';

// GET - Obtener dashboard del agente (solo sus propios datos)
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  try {
    const dashboardData = await getAgentDashboardData(session.user.id);

    if (!dashboardData) {
      return NextResponse.json(
        { success: false, error: 'No se encontraron datos del agente' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Error al obtener dashboard del agente:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al obtener dashboard' },
      { status: 500 }
    );
  }
}
