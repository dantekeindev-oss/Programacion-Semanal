import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { Role } from '@prisma/client';
import { normalizeDisplayText, normalizeEmail } from '@/lib/importNormalization';

interface NominaRow {
  DNI: string;
  USUARIO: string;
  NOMBRE: string;
  SUPERIOR: string;
  SEGMENTO: string;
  HORARIOS: string;
  ESTADO: string;
  CONTRATO: string;
  SITIO: string;
  MODALIDAD: string;
  JEFE: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    // Leer el archivo Excel
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<NominaRow>(worksheet);

    const results = {
      created: 0,
      updated: 0,
      leaders: [] as Array<{ name: string; email: string; dni: string }>,
      agents: [] as Array<{ name: string; email: string; dni: string; leader: string }>,
      errors: [] as Array<{ row: string; error: string }>,
    };

    // Map para guardar líderes encontrados
    const leadersMap = new Map<string, { email: string; name: string; dni: string }>();
    const agentsMap = new Map<string, { email: string; name: string; dni: string; superior: string }>();

    // Primera pasada: procesar todos para obtener nombres únicos de líderes
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowIndex = i + 2; // +2 porque Excel tiene headers y empieza en fila 2

      try {
        const dni = String(row.DNI || '').trim();
        const nombre = normalizeDisplayText(String(row.NOMBRE || ''));
        const superior = normalizeDisplayText(String(row.SUPERIOR || ''));

        if (!dni || !nombre) {
          results.errors.push({ row: rowIndex, error: 'Falta DNI o NOMBRE' });
          continue;
        }

        // Generar email automáticamente
        const email = generateEmail(nombre);

        // Guardar agente
        agentsMap.set(dni, {
          email,
          name: nombre,
          dni,
          superior,
        });

        // Guardar líder si existe
        if (superior) {
          const leaderEmail = generateEmail(superior);
          leadersMap.set(superior, {
            email: leaderEmail,
            name: superior,
            dni: '', // El líder puede no estar en la nómina como agente
          });
        }
      } catch (error) {
        results.errors.push({
          row: rowIndex,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    // Segunda pasada: crear/update usuarios en la base de datos
    for (const [dni, agent] of agentsMap) {
      try {
        // Buscar si ya existe el usuario por DNI o email
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { dni: agent.dni },
              { email: agent.email },
            ],
          },
        });

        // Buscar al líder
        let leader = null;
        if (agent.superior) {
          const leaderData = leadersMap.get(agent.superior);
          if (leaderData) {
            leader = await prisma.user.findFirst({
              where: {
                OR: [
                  { email: leaderData.email },
                  { name: leaderData.name },
                ],
              },
            });

            // Si el líder no existe, crearlo
            if (!leader) {
              leader = await prisma.user.upsert({
                where: { email: leaderData.email },
                update: { role: Role.LEADER },
                create: {
                  email: leaderData.email,
                  name: leaderData.name,
                  firstName: leaderData.name.split(' ').pop() || '',
                  lastName: leaderData.name.split(' ').slice(0, -1).join(' '),
                  role: Role.LEADER,
                  emailManuallySet: false,
                },
              });
              results.leaders.push({
                name: leaderData.name,
                email: leaderData.email,
                dni: leaderData.dni,
              });
            } else if (leader.role !== Role.LEADER) {
              // Actualizar rol a LEADER si no lo era
              leader = await prisma.user.update({
                where: { id: leader.id },
                data: { role: Role.LEADER },
              });
            }
          }
        }

        // Crear o actualizar el agente
        const nameParts = agent.name.split(' ');
        const firstName = nameParts.pop() || '';
        const lastName = nameParts.join(' ') || '';

        if (user) {
          // Actualizar usuario existente
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              name: agent.name,
              firstName: firstName || user.firstName,
              lastName: lastName || user.lastName,
              dni: agent.dni,
              leaderId: leader?.id || user.leaderId,
              role: Role.AGENT,
            },
          });
          results.updated++;
        } else {
          // Crear nuevo usuario
          user = await prisma.user.create({
            data: {
              email: agent.email,
              name: agent.name,
              firstName,
              lastName,
              dni: agent.dni,
              leaderId: leader?.id,
              role: Role.AGENT,
              emailManuallySet: false,
            },
          });
          results.created++;
        }

        results.agents.push({
          name: agent.name,
          email: agent.email,
          dni: agent.dni,
          leader: agent.superior || 'Sin líder',
        });
      } catch (error) {
        results.errors.push({
          row: agent.dni || 'unknown',
          error: error instanceof Error ? error.message : 'Error al procesar agente',
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error al procesar nómina:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al procesar el archivo' },
      { status: 500 }
    );
  }
}

// Función para generar email a partir del nombre completo
function generateEmail(fullName: string): string {
  // Normalizar el nombre
  const name = normalizeDisplayText(fullName);

  // Separar por espacios
  const parts = name.split(' ').filter(p => p.length > 0);

  if (parts.length === 0) {
    return 'desconocido@konecta.com';
  }

  // Tomar el primer nombre
  const firstName = parts[0].toLowerCase();

  // Tomar el primer apellido (segunda palabra si existe, si no, la primera)
  let lastName = '';
  if (parts.length >= 2) {
    lastName = parts[1].toLowerCase();
  }

  // Generar email
  if (lastName) {
    return `${firstName}.${lastName}@konecta.com`;
  } else {
    return `${firstName}@konecta.com`;
  }
}
