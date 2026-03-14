import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserService } from '@/lib/services/userService';
import { RequestService } from '@/lib/services/requestService';

/**
 * GET /api/team/stats
 * Obtiene estadísticas del dashboard del líder
 */
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }

  if (session.user.role !== 'LEADER' && session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'No autorizado' },
      { status: 403 }
    );
  }

  try {
    const [members, requestStats] = await Promise.all([
      UserService.getTeamMembers(session.user.id),
      RequestService.getRequestStats(session.user.id),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalMembers: members.length,
        pendingRequests: requestStats.pending,
        approvedThisMonth: requestStats.approvedThisMonth,
        rejectedThisMonth: requestStats.rejectedThisMonth,
      },
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener estadísticas',
      },
      { status: 500 }
    );
  }
}
