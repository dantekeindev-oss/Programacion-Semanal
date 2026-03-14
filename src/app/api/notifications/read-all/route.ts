import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { NotificationService } from '@/lib/services/requestService';

/**
 * POST /api/notifications/read-all
 * Marca todas las notificaciones del usuario como leídas
 */
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }

  try {
    await NotificationService.markAllAsRead(session.user.id);
    return NextResponse.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error al marcar notificaciones:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al marcar notificaciones',
      },
      { status: 500 }
    );
  }
}
