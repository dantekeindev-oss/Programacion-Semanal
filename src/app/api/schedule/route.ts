import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserService } from '@/lib/services/userService';

/**
 * GET /api/schedule
 * Obtiene el horario del usuario autenticado
 */
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }

  try {
    const scheduleInfo = await UserService.getAgentScheduleInfo(session.user.id);

    if (!scheduleInfo) {
      return NextResponse.json(
        { success: false, error: 'No se encontró información de horario' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: scheduleInfo });
  } catch (error) {
    console.error('Error al obtener horario:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener horario',
      },
      { status: 500 }
    );
  }
}
