import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { processTelefonicoExcel } from '@/lib/excel-telefonico';
import { buildAgentEmail, buildLeaderEmail, normalizeDisplayText, normalizeEmail } from '@/lib/importNormalization';
import { prisma } from '@/lib/prisma';
import { Role, WeekDay } from '@prisma/client';

const WEEK_DAYS_MAP: Record<string, WeekDay> = {
  'LUNES': 'MONDAY',
  'MARTES': 'TUESDAY',
  'MIÉRCOLES': 'WEDNESDAY',
  'JUEVES': 'THURSDAY',
  'VIERNES': 'FRIDAY',
  'SÁBADO': 'SATURDAY',
  'DOMINGO': 'SUNDAY',
  'Lunes': 'MONDAY',
  'Martes': 'TUESDAY',
  'Miercoles': 'WEDNESDAY',
  'Jueves': 'THURSDAY',
  'Viernes': 'FRIDAY',
  'Sabado': 'SATURDAY',
  'Domingo': 'SUNDAY',
};

/**
 * POST /api/excel/upload-telefonico
 * Sube y procesa el archivo Excel con formato TELEFONICO (solo para líderes)
 */
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }

  if (session.user.role !== 'LEADER' && session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Solo los líderes pueden cargar horarios' },
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

    // Procesar el archivo
    const result = await processTelefonicoExcel(file);

    if (!result.valid || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Errores de validación en el archivo Excel',
          errors: result.errors,
        },
        { status: 400 }
      );
    }

    // Procesar y guardar los datos
    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: [] as Array<{ dni: string; error: string }>,
    };

    for (const row of result.data) {
      results.processed++;

      try {
        // Buscar o crear el equipo/líder
        let team = await prisma.team.findUnique({
          where: { name: row.lider },
        });

        if (!team) {
          // Crear usuario líder si no existe
          let leader = await prisma.user.findFirst({
            where: { OR: [
              { firstName: { contains: row.nombre } },
              { lastName: { contains: row.apellido } },
              { name: { contains: row.lider } }
            ] },
          });

          if (!leader) {
            // Crear líder temporal con email basado en nombre
            const leaderName = normalizeDisplayText(row.lider);
            const leaderEmail = buildLeaderEmail(leaderName);
            leader = await prisma.user.create({
              data: {
                email: leaderEmail,
                name: leaderName,
                firstName: leaderName.split(' ')[0] || leaderName,
                lastName: leaderName.split(' ').slice(1).join(' ') || '',
                role: Role.LEADER,
              },
            });
          }

          // Crear equipo
          team = await prisma.team.create({
            data: {
              name: normalizeDisplayText(row.lider),
              leaderId: leader.id,
            },
          });
        }

        // Mapear día de franco
        const weekDay = row.dia_franco ? WEEK_DAYS_MAP[row.dia_franco.toUpperCase()] || WEEK_DAYS_MAP[row.dia_franco] : null;

        // Buscar usuario por DNI o crear nuevo
        const normalizedFirstName = normalizeDisplayText(row.nombre);
        const normalizedLastName = normalizeDisplayText(row.apellido);
        const normalizedUserEmail = row.email
          ? normalizeEmail(row.email)
          : buildAgentEmail(normalizedFirstName, normalizedLastName, row.dni);

        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: normalizedUserEmail },
              { name: { contains: normalizeDisplayText(`${normalizedFirstName} ${normalizedLastName}`) } },
            ],
          },
        });

        if (user) {
          // Actualizar usuario existente
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              email: normalizedUserEmail,
              firstName: normalizedFirstName,
              lastName: normalizedLastName,
              name: normalizeDisplayText(`${normalizedFirstName} ${normalizedLastName}`),
              teamId: team.id,
              weeklyDayOff: weekDay,
            },
          });
          results.updated++;
        } else {
          // Crear nuevo usuario
          user = await prisma.user.create({
            data: {
              email: normalizedUserEmail,
              name: normalizeDisplayText(`${normalizedFirstName} ${normalizedLastName}`),
              firstName: normalizedFirstName,
              lastName: normalizedLastName,
              role: Role.AGENT,
              teamId: team.id,
              leaderId: team.leaderId,
              weeklyDayOff: weekDay,
            },
          });
          results.created++;
        }

        // Eliminar horarios y breaks existentes del usuario
        await prisma.schedule.deleteMany({
          where: { userId: user.id },
        });
        await prisma.break.deleteMany({
          where: { userId: user.id },
        });

        // Crear horarios por día
        for (const horario of row.horarios_por_dia) {
          if (horario.ingreso !== '-' && horario.egreso !== '-') {
            const timeRange = `${horario.ingreso}-${horario.egreso}`;
            const weekDayEnum = WEEK_DAYS_MAP[horario.dia] || WEEK_DAYS_MAP[horario.dia.toUpperCase()] || 'MONDAY';

            // Crear schedule (simplificado - uno por día con fecha específica)
            await prisma.schedule.create({
              data: {
                userId: user.id,
                teamId: team.id,
                timeRange,
                validFrom: new Date(), // Fecha actual
                validTo: null, // Sin fecha de fin
              },
            });

            // Crear break si existe
            if (horario.break !== '-') {
              await prisma.break.create({
                data: {
                  userId: user.id,
                  teamId: team.id,
                  type: 'WEEKLY',
                  dayOfWeek: weekDayEnum as WeekDay,
                  weeklyTime: horario.break,
                  duration: 15, // 15 minutos por defecto
                  validFrom: new Date(),
                  validTo: null,
                },
              });
            }
          }
        }

      } catch (error) {
        results.errors.push({
          dni: row.dni,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    // Crear log de auditoría
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'EXCEL_UPLOAD_TELEFONICO',
          entity: 'EXCEL',
          changes: {
            processed: results.processed,
            created: results.created,
            updated: results.updated,
          },
        },
      });
    } catch {
      // Ignorar error de log
    }

    return NextResponse.json({
      success: true,
      message: 'Archivo procesado correctamente',
      data: results,
    });
  } catch (error) {
    console.error('Error al procesar Excel:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al procesar el archivo',
      },
      { status: 500 }
    );
  }
}
