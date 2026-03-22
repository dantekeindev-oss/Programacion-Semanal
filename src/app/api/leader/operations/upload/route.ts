import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { processOperationsFile } from '@/lib/operations/csvParser';
import {
  createOperationsUpload,
  updateUploadStatus,
  createOperationsMetric,
} from '@/lib/operations/operationsService';

export const dynamic = 'force-dynamic';

// POST - Subir CSV operativo
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  // Verificar que sea líder o admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, name: true },
  });

  if (!user || (user.role !== 'LEADER' && user.role !== 'ADMIN')) {
    return NextResponse.json(
      { success: false, error: 'No autorizado. Solo líderes pueden subir CSV operativos.' },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExtension) {
      return NextResponse.json(
        { success: false, error: 'El archivo debe ser CSV o Excel (.xlsx, .xls)' },
        { status: 400 }
      );
    }

    // Crear registro de upload
    const uploadId = await createOperationsUpload(user.id, file.name);
    await updateUploadStatus(uploadId, 'PROCESSING');

    // Procesar archivo
    const result = await processOperationsFile(file);

    if (!result.success || !result.data) {
      await updateUploadStatus(
        uploadId,
        'FAILED',
        undefined,
        0,
        0,
        0,
        result.errors?.map(e => e.error).join('; ')
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Error al procesar el archivo',
          errors: result.errors,
        },
        { status: 400 }
      );
    }

    let created = 0;
    let updated = 0;
    const processingErrors: Array<{ row: number; employeeId?: string; error: string }> = [];

    // Procesar cada fila
    for (let i = 0; i < result.data.length; i++) {
      const row = result.data[i];

      try {
        // Buscar agente por employee_id (prioridad - viene de nómina)
        let agent = null;

        if (row.employeeId) {
          // Buscar primero por employeeId que ya viene cargado de la nómina
          agent = await prisma.user.findFirst({
            where: {
              employeeId: row.employeeId,
              role: 'AGENT',
            },
            include: {
              island: {
                include: {
                  threshold: true,
                },
              },
            },
          });
        }

        // Si no encuentra por employee_id, buscar por dni (fallback)
        // El employeeId del CSV puede ser el dni en algunos casos
        if (!agent && row.employeeId) {
          agent = await prisma.user.findFirst({
            where: {
              dni: row.employeeId,
              role: 'AGENT',
            },
            include: {
              island: {
                include: {
                  threshold: true,
                },
              },
            },
          });
        }

        // Si no encuentra por employee_id ni dni, buscar por nombre normalizado
        if (!agent && row.agentName) {
          // Extraer nombre y apellido para búsqueda más flexible
          const nameParts = row.agentName.split(' ').filter(p => p.length > 0);

          if (nameParts.length >= 1) {
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            const searchConditions: any[] = [
              { name: { contains: row.agentName, mode: 'insensitive' } },
            ];

            if (nameParts.length >= 2) {
              searchConditions.push({
                firstName: { contains: firstName, mode: 'insensitive' },
                lastName: { contains: lastName, mode: 'insensitive' },
              });
            }

            searchConditions.push(
              { firstName: { contains: firstName, mode: 'insensitive' } }
            );

            agent = await prisma.user.findFirst({
              where: {
                role: 'AGENT',
                OR: searchConditions,
              },
              include: {
                island: {
                  include: {
                    threshold: true,
                  },
                },
              },
            });
          }
        }

        // Si se encontró el agente, actualizar su employeeId si no lo tenía
        if (agent && row.employeeId && !agent.employeeId) {
          await prisma.user.update({
            where: { id: agent.id },
            data: { employeeId: row.employeeId },
          });
        }

        // Crear métrica operativa
        await createOperationsMetric(uploadId, {
          employeeId: row.employeeId || agent?.employeeId || undefined,
          agentNameRaw: row.agentName,
          leaderNameRaw: row.leaderName,
          skillRaw: row.skill,
          currentStatus: row.currentStatus,
          timeInStatusSeconds: row.timeInStatusSeconds,
          loginTimeSeconds: row._rawLoginTimeSeconds,
          continuousLoginTimeSeconds: row._rawContinuousLoginTimeSeconds,
          tmoSeconds: typeof row.tmo === 'number' ? row.tmo : undefined,
          breakSeconds: typeof row.break === 'number' ? row.break : undefined,
          coachingSeconds: typeof row.coaching === 'number' ? row.coaching : undefined,
          acwSeconds: typeof row.acw === 'number' ? row.acw : undefined,
          holdSeconds: typeof row.hold === 'number' ? row.hold : undefined,
          transfersCount: row.transfers,
          attendedCallsCount: row.atn,
          inboundTimeSeconds: typeof row.inboundTime === 'number' ? row.inboundTime : undefined,
          outboundTimeSeconds: typeof row.outboundTime === 'number' ? row.outboundTime : undefined,
          handleTimeSeconds: typeof row.handleTime === 'number' ? row.handleTime : undefined,
          rawPayloadJson: {
            ...row,
            _matchedAgent: agent ? {
              id: agent.id,
              name: agent.name,
              employeeId: agent.employeeId,
              dni: agent.dni,
            } : null,
          } as any,
        });

        created++;
      } catch (error) {
        processingErrors.push({
          row: i + 2,
          employeeId: row.employeeId,
          error: error instanceof Error ? error.message : 'Error al procesar fila',
        });
      }
    }

    // Actualizar estado del upload
    await updateUploadStatus(
      uploadId,
      'COMPLETED',
      new Date(),
      result.data.length,
      created,
      processingErrors.length,
      processingErrors.length > 0 ? `${processingErrors.length} errores de procesamiento` : undefined
    );

    return NextResponse.json({
      success: true,
      message: 'Archivo procesado correctamente',
      data: {
        uploadId,
        processed: result.data.length,
        created,
        errors: processingErrors,
      },
    });
  } catch (error) {
    console.error('Error al subir CSV operativo:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al procesar archivo' },
      { status: 500 }
    );
  }
}

// GET - Obtener historial de uploads
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user || (user.role !== 'LEADER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
  }

  try {
    const uploads = await prisma.operationsUpload.findMany({
      where: { uploadedByUserId: user.id },
      include: {
        uploadedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: uploads,
    });
  } catch (error) {
    console.error('Error al obtener uploads:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al obtener uploads' },
      { status: 500 }
    );
  }
}
