import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserService } from '@/lib/services/userService';

/**
 * GET /api/team/members
 * Obtiene los miembros del equipo del usuario autenticado
 */
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }

  // Solo líderes pueden ver todos los miembros del equipo
  if (session.user.role !== 'LEADER' && session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'No autorizado' },
      { status: 403 }
    );
  }

  try {
    const members = await UserService.getTeamMembersDetailed(session.user.id);
    return NextResponse.json({ success: true, data: members });
  } catch (error) {
    console.error('Error al obtener miembros del equipo:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener miembros',
      },
      { status: 500 }
    );
  }
}
