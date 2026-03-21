import { NextRequest, NextResponse } from 'next/server';
import { RequestStatus } from '@prisma/client';
import { auth } from '@/lib/auth';
import { RequestService } from '@/lib/services/requestService';
import { CreateRequestDTO } from '@/types';

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

    if (session.user.role === 'LEADER' || session.user.role === 'ADMIN') {
      const requests = await RequestService.getTeamAllRequests(
        session.user.id,
        status || undefined
      );
      return NextResponse.json({ success: true, data: requests });
    }

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
    const parsedTargetDate = new Date(body.targetDate);

    if (!body.type || !body.targetDate || !body.requestedSchedule) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan campos requeridos',
        },
        { status: 400 }
      );
    }

    if (body.type !== 'SCHEDULE_CHANGE') {
      return NextResponse.json(
        {
          success: false,
          error: 'Por el momento solo esta habilitado el cambio individual de horario',
        },
        { status: 400 }
      );
    }

    if (Number.isNaN(parsedTargetDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'La fecha solicitada no es valida',
        },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedTargetDate < today) {
      return NextResponse.json(
        {
          success: false,
          error: 'La fecha solicitada no puede ser anterior a hoy',
        },
        { status: 400 }
      );
    }

    const hasConflict = await RequestService.checkScheduleConflicts(
      session.user.id,
      parsedTargetDate,
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
