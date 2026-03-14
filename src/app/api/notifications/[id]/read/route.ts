import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { NotificationService } from '@/lib/services/requestService';

/**
 * POST /api/notifications/[id]/read
 * Marca una notificación como leída
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }

  try {
    await NotificationService.markAsRead(params.id);
    return NextResponse.json({ success: true, message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al marcar notificación',
      },
      { status: 500 }
    );
  }
}
