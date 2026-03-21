import { prisma } from '@/lib/prisma';
import { normalizeDisplayText, normalizeEmail } from '@/lib/importNormalization';
import { Role, WeekDay } from '@prisma/client';
import { UserWithTeam, UserWithFullTeam } from '@/types';

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

function mapDayToWeekDay(day: string): WeekDay | null {
  if (!day) return null;
  return WEEK_DAYS_MAP[day.toUpperCase()] || WEEK_DAYS_MAP[day] || null;
}

export class UserService {
  /**
   * Obtiene un usuario por email
   */
  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { team: true },
    });
  }

  /**
   * Obtiene un usuario por ID con su equipo
   */
  static async findByIdWithTeam(id: string): Promise<UserWithTeam | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        firstName: true,
        lastName: true,
        role: true,
        weeklyDayOff: true,
        createdAt: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return user;
  }

  /**
   * Obtiene un usuario con su equipo completo
   */
  static async findByIdWithFullTeam(id: string): Promise<UserWithFullTeam | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        firstName: true,
        lastName: true,
        role: true,
        weeklyDayOff: true,
        createdAt: true,
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            leaderId: true,
          },
        },
      },
    });
    return user as UserWithFullTeam | null;
  }

  /**
   * Obtiene los miembros del equipo de un líder
   */
  static async getTeamMembers(leaderId: string) {
    const leader = await prisma.user.findUnique({
      where: { id: leaderId },
      select: { teamId: true },
    });

    if (!leader?.teamId) {
      return [];
    }

    return prisma.user.findMany({
      where: {
        teamId: leader.teamId,
        role: { in: [Role.AGENT] },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        weeklyDayOff: true,
        createdAt: true,
      },
      orderBy: { lastName: 'asc' },
    });
  }

  /**
   * Obtiene información detallada de los miembros del equipo
   */
  static async getTeamMembersDetailed(leaderId: string) {
    const leader = await prisma.user.findUnique({
      where: { id: leaderId },
      select: { teamId: true },
    });

    if (!leader?.teamId) {
      return [];
    }

    const members = await prisma.user.findMany({
      where: {
        teamId: leader.teamId,
        role: Role.AGENT,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        weeklyDayOff: true,
        schedules: {
          where: {
            validFrom: { lte: new Date() },
            OR: [
              { validTo: null },
              { validTo: { gte: new Date() } },
            ],
          },
          orderBy: { validFrom: 'desc' },
          take: 1,
        },
        breaks: {
          where: {
            validFrom: { lte: new Date() },
            OR: [
              { validTo: null },
              { validTo: { gte: new Date() } },
            ],
          },
          orderBy: { validFrom: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastName: 'asc' },
    });

    return members.map(member => ({
      id: member.id,
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      weeklyDayOff: member.weeklyDayOff,
      scheduleTime: member.schedules[0]?.timeRange || null,
      breakType: member.breaks[0]?.type || null,
      breakTime: member.breaks[0]?.timeRange || null,
      breakDay: member.breaks[0]?.dayOfWeek || null,
    }));
  }

  /**
   * Crea o actualiza usuarios desde Excel
   */
  static async upsertFromExcel(data: Array<{
    nombre: string;
    apellido: string;
    email: string;
    equipo: string;
    lider: string;
    dia_franco: string;
    horario_break: string;
    horario_trabajo?: string;
    fecha_vigencia_desde: string;
    fecha_vigencia_hasta?: string;
  }>) {
    const results = {
      created: 0,
      updated: 0,
      errors: [] as Array<{ email: string; error: string }>,
    };

    // Obtener o crear equipos y líderes
    const teamsMap = new Map<string, string>(); // teamName -> teamId
    const leadersMap = new Map<string, string>(); // leaderEmail -> leaderId

    for (const row of data) {
      try {
        const normalizedLeaderEmail = normalizeEmail(row.lider);
        const normalizedTeamName = normalizeDisplayText(row.equipo);
        const normalizedFirstName = normalizeDisplayText(row.nombre);
        const normalizedLastName = normalizeDisplayText(row.apellido);
        const normalizedUserEmail = normalizeEmail(row.email);
        // Obtener o crear líder
        let leaderId = leadersMap.get(normalizedLeaderEmail);
        if (!leaderId) {
          const leader = await prisma.user.upsert({
            where: { email: normalizedLeaderEmail },
            update: {},
            create: {
              email: normalizedLeaderEmail,
              name: normalizeDisplayText(`${normalizedLeaderEmail.split('@')[0]}`),
              role: Role.LEADER,
            },
          });
          leaderId = leader.id;
          leadersMap.set(normalizedLeaderEmail, leaderId);
        }

        // Obtener o crear equipo
        let teamId = teamsMap.get(normalizedTeamName);
        if (!teamId) {
          const team = await prisma.team.upsert({
            where: { name: normalizedTeamName },
            update: {},
            create: {
              name: normalizedTeamName,
              leaderId,
            },
          });
          teamId = team.id;
          teamsMap.set(normalizedTeamName, teamId);
        }

        // Crear o actualizar usuario
        const user = await prisma.user.upsert({
          where: { email: normalizedUserEmail },
          update: {
            firstName: normalizedFirstName,
            lastName: normalizedLastName,
            teamId,
            weeklyDayOff: mapDayToWeekDay(row.dia_franco),
          },
          create: {
            email: normalizedUserEmail,
            name: normalizeDisplayText(`${normalizedFirstName} ${normalizedLastName}`),
            firstName: normalizedFirstName,
            lastName: normalizedLastName,
            teamId,
            weeklyDayOff: mapDayToWeekDay(row.dia_franco),
            role: Role.AGENT,
            leaderId,
          },
        });

        // Crear o actualizar horario si se proporciona
        if (row.horario_trabajo) {
          await prisma.schedule.upsert({
            where: { id: `schedule_${user.id}_current` },
            update: {
              timeRange: row.horario_trabajo,
              validFrom: new Date(row.fecha_vigencia_desde),
              validTo: row.fecha_vigencia_hasta ? new Date(row.fecha_vigencia_hasta) : null,
            },
            create: {
              id: `schedule_${user.id}_current`,
              userId: user.id,
              teamId,
              timeRange: row.horario_trabajo,
              validFrom: new Date(row.fecha_vigencia_desde),
              validTo: row.fecha_vigencia_hasta ? new Date(row.fecha_vigencia_hasta) : null,
            },
          });
        }

        // Crear o actualizar break
        await prisma.break.upsert({
          where: { id: `break_${user.id}_current` },
          update: {
            type: 'DAILY',
            timeRange: row.horario_break,
            validFrom: new Date(row.fecha_vigencia_desde),
            validTo: row.fecha_vigencia_hasta ? new Date(row.fecha_vigencia_hasta) : null,
          },
          create: {
            id: `break_${user.id}_current`,
            userId: user.id,
            teamId,
            type: 'DAILY',
            timeRange: row.horario_break,
            duration: 15,
            validFrom: new Date(row.fecha_vigencia_desde),
            validTo: row.fecha_vigencia_hasta ? new Date(row.fecha_vigencia_hasta) : null,
          },
        });

        // Crear log de auditoría
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: user.createdAt.getTime() === user.updatedAt.getTime() ? 'SCHEDULE_CREATE' : 'SCHEDULE_UPDATE',
            entity: 'SCHEDULE',
            entityId: user.id,
            changes: { fromExcel: true },
          },
        });

        if (user.createdAt.getTime() === user.updatedAt.getTime()) {
          results.created++;
        } else {
          results.updated++;
        }
      } catch (error) {
        results.errors.push({
          email: normalizeEmail(row.email),
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    return results;
  }

  /**
   * Obtiene el rol de un usuario
   */
  static async getRole(userId: string): Promise<Role | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role || null;
  }

  /**
   * Verifica si un usuario es líder
   */
  static async isLeader(userId: string): Promise<boolean> {
    const role = await this.getRole(userId);
    return role === Role.LEADER || role === Role.ADMIN;
  }

  /**
   * Obtiene la información de horario de un agente
   */
  static async getAgentScheduleInfo(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        team: {
          select: {
            name: true,
          },
        },
        weeklyDayOff: true,
        schedules: {
          where: {
            validFrom: { lte: new Date() },
            OR: [
              { validTo: null },
              { validTo: { gte: new Date() } },
            ],
          },
          orderBy: { validFrom: 'desc' },
          take: 1,
        },
        breaks: {
          where: {
            validFrom: { lte: new Date() },
            OR: [
              { validTo: null },
              { validTo: { gte: new Date() } },
            ],
          },
          orderBy: { validFrom: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      teamName: user.team?.name || 'Sin equipo',
      weeklyDayOff: user.weeklyDayOff,
      scheduleTime: user.schedules[0]?.timeRange || null,
      breakType: user.breaks[0]?.type || null,
      breakTime: user.breaks[0]?.timeRange || null,
      breakDay: user.breaks[0]?.dayOfWeek || null,
    };
  }
}
