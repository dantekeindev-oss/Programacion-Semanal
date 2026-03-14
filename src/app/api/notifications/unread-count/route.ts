import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { NotificationService } from '@/lib/services/requestService';

/**
 * GET /api/notifications/unread-count
 * Obtiene el conteo de notificaciones no leídas
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
    const count = await NotificationService.getUnreadCount(session.user.id);
    return NextResponse.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Error al obtener conteo de notificaciones:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener conteo',
      },
      { status: 500 }
    );
  }
}
