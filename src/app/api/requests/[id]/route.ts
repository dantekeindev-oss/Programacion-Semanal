import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { RequestService } from '@/lib/services/requestService';

/**
 * GET /api/requests/[id]
 * Obtiene una solicitud específica
 */
export async function GET(
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
    const request = await RequestService.getRequestById(params.id);

    if (!request) {
      return NextResponse.json(
        { success: false, error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos
    const isRequester = request.requester.id === session.user.id;
    const isInvolvedAgent = request.involvedAgent?.id === session.user.id;
    const isLeader = session.user.role === 'LEADER' || session.user.role === 'ADMIN';

    if (!isRequester && !isInvolvedAgent && !isLeader) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: request });
  } catch (error) {
    console.error('Error al obtener solicitud:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener solicitud',
      },
      { status: 500 }
    );
  }
}
