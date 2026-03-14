import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { RequestService } from '@/lib/services/requestService';

/**
 * POST /api/requests/[id]/approve
 * Aprueba una solicitud
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

  if (session.user.role !== 'LEADER' && session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Solo los líderes pueden aprobar solicitudes' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const comment = body.comment as string | undefined;

    const request = await RequestService.approveRequest(
      params.id,
      session.user.id,
      comment
    );

    return NextResponse.json({ success: true, data: request });
  } catch (error) {
    console.error('Error al aprobar solicitud:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al aprobar solicitud';

    if (errorMessage.includes('ya ha sido resuelta')) {
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
