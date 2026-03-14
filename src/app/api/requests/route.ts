import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { RequestService } from '@/lib/services/requestService';
import { RequestStatus } from '@prisma/client';
import { CreateRequestDTO } from '@/types';

/**
 * GET /api/requests
 * Obtiene solicitudes (del usuario autenticado o del equipo si es líder)
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
    const status = searchParams.get('status') as RequestStatus | null;

    // Si el usuario es líder, obtener solicitudes del equipo
    if (session.user.role === 'LEADER' || session.user.role === 'ADMIN') {
      const requests = await RequestService.getTeamAllRequests(
        session.user.id,
        status || undefined
      );
      return NextResponse.json({ success: true, data: requests });
    }

    // Si es agente, obtener sus solicitudes
    const requests = await RequestService.getUserRequests(
      session.user.id,
      status || undefined
    );
    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener solicitudes',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/requests
 * Crea una nueva solicitud
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
    const body: CreateRequestDTO = await req.json();

    // Validaciones básicas
    if (!body.type || !body.targetDate || !body.requestedSchedule) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan campos requeridos',
        },
        { status: 400 }
      );
    }

    // Verificar conflictos de horario
    const hasConflict = await RequestService.checkScheduleConflicts(
      session.user.id,
      new Date(body.targetDate),
      body.requestedSchedule
    );

    if (hasConflict) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ya existe una solicitud aprobada para esta fecha',
        },
        { status: 409 }
      );
    }

    const request = await RequestService.createRequest(session.user.id, body);

    return NextResponse.json({ success: true, data: request }, { status: 201 });
  } catch (error) {
    console.error('Error al crear solicitud:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear solicitud',
      },
      { status: 500 }
    );
  }
}
