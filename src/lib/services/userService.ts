import { prisma } from '@/lib/prisma';
import { Role, WeekDay } from '@prisma/client';
import { UserWithTeam, UserWithFullTeam } from '@/types';

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
    dia_franco: WeekDay;
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
        // Obtener o crear líder
        let leaderId = leadersMap.get(row.lider);
        if (!leaderId) {
          const leader = await prisma.user.upsert({
            where: { email: row.lider },
            update: {},
            create: {
              email: row.lider,
              name: `${row.lider.split('@')[0]}`,
              role: Role.LEADER,
            },
          });
          leaderId = leader.id;
          leadersMap.set(row.lider, leaderId);
        }

        // Obtener o crear equipo
        let teamId = teamsMap.get(row.equipo);
        if (!teamId) {
          const team = await prisma.team.upsert({
            where: { name: row.equipo },
            update: {},
            create: {
              name: row.equipo,
              leaderId,
            },
          });
          teamId = team.id;
          teamsMap.set(row.equipo, teamId);
        }

        // Crear o actualizar usuario
        const user = await prisma.user.upsert({
          where: { email: row.email },
          update: {
            firstName: row.nombre,
            lastName: row.apellido,
            teamId,
            weeklyDayOff: row.dia_franco,
          },
          create: {
            email: row.email,
            name: `${row.nombre} ${row.apellido}`,
            firstName: row.nombre,
            lastName: row.apellido,
            teamId,
            weeklyDayOff: row.dia_franco,
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
          email: row.email,
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
