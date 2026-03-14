import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { NotificationService } from '@/lib/services/requestService';

/**
 * GET /api/notifications
 * Obtiene notificaciones del usuario autenticado
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
    const searchParams = req.nextUrl.searchParams;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const notifications = await NotificationService.getUserNotifications(
      session.user.id,
      unreadOnly
    );

    return NextResponse.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener notificaciones',
      },
      { status: 500 }
    );
  }
}
