import { NextRequest, NextResponse } from 'next/server';
import { Role, WeekDay } from '@prisma/client';
import { processExcelFile } from '@/lib/excel';
import { processTelefonicoExcel } from '@/lib/excel-telefonico';
import { buildAgentEmail, buildLeaderEmail, normalizeDisplayText, normalizeEmail } from '@/lib/importNormalization';
import { prisma } from '@/lib/prisma';
import { getAdminAuthConfig, requireAdminSession } from '@/lib/adminAuth';
import { UserService } from '@/lib/services/userService';

export const dynamic = 'force-dynamic';

const WEEK_DAYS_MAP: Record<string, WeekDay> = {
  LUNES: 'MONDAY',
  MARTES: 'TUESDAY',
  'MIERCOLES': 'WEDNESDAY',
  JUEVES: 'THURSDAY',
  VIERNES: 'FRIDAY',
  SABADO: 'SATURDAY',
  DOMINGO: 'SUNDAY',
  Lunes: 'MONDAY',
  Martes: 'TUESDAY',
  Miercoles: 'WEDNESDAY',
  Jueves: 'THURSDAY',
  Viernes: 'FRIDAY',
  Sabado: 'SATURDAY',
  Domingo: 'SUNDAY',
};

export async function POST(req: NextRequest) {
  const authResult = requireAdminSession(req);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const requestedFormat = String(formData.get('format') || 'auto').toLowerCase();

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporciono ningun archivo' },
        { status: 400 }
      );
    }

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { success: false, error: 'El archivo debe ser un Excel (.xlsx o .xls)' },
        { status: 400 }
      );
    }

    const standardResult =
      requestedFormat === 'standard' || requestedFormat === 'auto'
        ? await processExcelFile(file)
        : null;
    const telefonicoResult =
      requestedFormat === 'telefonico' || requestedFormat === 'auto'
        ? await processTelefonicoExcel(file)
        : null;

    const isStandardValid = Boolean(standardResult?.valid && standardResult.data);
    const isTelefonicoValid = Boolean(telefonicoResult?.valid && telefonicoResult.data);

    if (isStandardValid) {
      const results = await UserService.upsertFromExcel(standardResult!.data!);

      try {
        const { adminEmail } = getAdminAuthConfig();
        const adminUser = await prisma.user.findFirst({
          where: { email: adminEmail },
        });

        if (adminUser) {
          await prisma.auditLog.create({
            data: {
              userId: adminUser.id,
              action: 'EXCEL_UPLOAD',
              entity: 'EXCEL',
              changes: {
                format: 'standard',
                created: results.created,
                updated: results.updated,
                errors: results.errors.length,
              },
            },
          });
        }
      } catch {
        // Ignorar errores de auditoria
      }

      return NextResponse.json({
        success: true,
        message: 'Archivo procesado correctamente',
        data: {
          format: 'standard',
          processed: results.created + results.updated + results.errors.length,
          created: results.created,
          updated: results.updated,
          teamsCreated: 0,
          leadersAssigned: 0,
          errors: results.errors.map((entry) => ({
            dni: entry.email,
            error: entry.error,
          })),
        },
      });
    }

    if (!isTelefonicoValid) {
      const combinedErrors = [
        ...(standardResult?.errors || []),
        ...(telefonicoResult?.errors || []),
      ];

      return NextResponse.json(
        {
          success: false,
          error: 'Errores de validacion en el archivo Excel',
          errors: combinedErrors.length > 0
            ? combinedErrors
            : [{ row: 0, field: 'file', message: 'No se pudo reconocer el formato del archivo' }],
        },
        { status: 400 }
      );
    }

    const resultData = telefonicoResult!.data!;
    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: [] as Array<{ dni: string; error: string }>,
      teamsCreated: 0,
      leadersAssigned: 0,
    };

    for (const row of resultData) {
      results.processed++;

      try {
        let team = await prisma.team.findUnique({
          where: { name: row.lider },
        });

        if (!team) {
          const leaderName = normalizeDisplayText(row.lider);
          const leaderEmail = buildLeaderEmail(leaderName);
          let leader = await prisma.user.findFirst({
            where: {
              OR: [
                { name: leaderName },
                { email: leaderEmail },
              ],
            },
          });

          if (!leader) {
            leader = await prisma.user.create({
              data: {
                email: leaderEmail,
                name: leaderName,
                firstName: leaderName.split(' ')[0] || leaderName,
                lastName: leaderName.split(' ').slice(1).join(' ') || '',
                role: Role.LEADER,
              },
            });
            results.leadersAssigned++;
          } else if (leader.role !== Role.LEADER) {
            leader = await prisma.user.update({
              where: { id: leader.id },
              data: { role: Role.LEADER },
            });
          }

          team = await prisma.team.create({
            data: {
              name: leaderName,
              leaderId: leader.id,
            },
          });
          results.teamsCreated++;
        }

        const weekDay = row.dia_franco
          ? WEEK_DAYS_MAP[row.dia_franco.toUpperCase()] || WEEK_DAYS_MAP[row.dia_franco]
          : null;

        // Buscar agente por DNI (prioridad - ya viene de la nómina)
        let user = await prisma.user.findFirst({
          where: {
            dni: row.dni,
          },
        });

        // Si no encuentra por DNI, buscar por nombre/apellido
        if (!user) {
          const normalizedFirstName = normalizeDisplayText(row.nombre);
          const normalizedLastName = normalizeDisplayText(row.apellido);

          user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: buildAgentEmail(normalizedFirstName, normalizedLastName, row.dni) },
                { firstName: { contains: normalizedFirstName }, lastName: { contains: normalizedLastName } },
              ],
            },
          });
        }

        if (user) {
          // Actualizar usuario existente - mantener email y leaderId de la nómina
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              teamId: team.id,
              weeklyDayOff: weekDay,
              // No actualizamos email ni leaderId porque ya vienen de la nómina
              // Solo actualizamos si el usuario no tiene rol asignado
              ...(user.role === 'AGENT' ? {} : { role: Role.AGENT }),
            },
          });
          results.updated++;
        } else {
          // Crear nuevo usuario solo si no existe
          const normalizedFirstName = normalizeDisplayText(row.nombre);
          const normalizedLastName = normalizeDisplayText(row.apellido);
          const normalizedUserEmail = buildAgentEmail(normalizedFirstName, normalizedLastName, row.dni);

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
              dni: row.dni,
            },
          });
          results.created++;
        }

        await prisma.schedule.deleteMany({
          where: { userId: user.id },
        });
        await prisma.break.deleteMany({
          where: { userId: user.id },
        });

        for (const horario of row.horarios_por_dia) {
          if (horario.ingreso !== '-' && horario.egreso !== '-') {
            const timeRange = `${horario.ingreso}-${horario.egreso}`;
            const weekDayEnum =
              WEEK_DAYS_MAP[horario.dia] ||
              WEEK_DAYS_MAP[horario.dia.toUpperCase()] ||
              'MONDAY';

            await prisma.schedule.create({
              data: {
                userId: user.id,
                teamId: team.id,
                timeRange,
                validFrom: new Date(),
                validTo: null,
              },
            });

            if (horario.break !== '-') {
              await prisma.break.create({
                data: {
                  userId: user.id,
                  teamId: team.id,
                  type: 'WEEKLY',
                  dayOfWeek: weekDayEnum as WeekDay,
                  weeklyTime: horario.break,
                  duration: 15,
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

    try {
      const { adminEmail } = getAdminAuthConfig();
      const adminUser = await prisma.user.findFirst({
        where: { email: adminEmail },
      });

      if (adminUser) {
        await prisma.auditLog.create({
          data: {
            userId: adminUser.id,
            action: 'EXCEL_UPLOAD',
            entity: 'EXCEL',
            changes: {
              processed: results.processed,
              created: results.created,
              updated: results.updated,
              teamsCreated: results.teamsCreated,
            },
          },
        });
      }
    } catch {
      // Ignorar errores de auditoria
    }

    return NextResponse.json({
      success: true,
      message: 'Archivo procesado correctamente',
      data: {
        format: 'telefonico',
        ...results,
      },
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
