import { prisma } from '@/lib/prisma';
import { RequestStatus, RequestType } from '@prisma/client';
import { CreateRequestDTO, UpdateRequestDTO, RequestWithRelations } from '@/types';

export class RequestService {
  /**
   * Crea una nueva solicitud
   */
  static async createRequest(
    requesterId: string,
    data: CreateRequestDTO
  ): Promise<RequestWithRelations> {
    // Verificar que el solicitante existe
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      include: { team: true },
    });

    if (!requester) {
      throw new Error('Usuario no encontrado');
    }

    // Si hay un agente involucrado, verificar que existe
    if (data.involvedAgentId) {
      const involvedAgent = await prisma.user.findUnique({
        where: { id: data.involvedAgentId },
      });

      if (!involvedAgent) {
        throw new Error('Agente involucrado no encontrado');
      }

      // Verificar que están en el mismo equipo
      if (requester.teamId !== involvedAgent.teamId) {
        throw new Error('Solo puedes hacer solicitudes con agentes de tu mismo equipo');
      }
    }

    // Crear la solicitud
    const request = await prisma.request.create({
      data: {
        requesterId,
        type: data.type,
        involvedAgentId: data.involvedAgentId,
        targetDate: new Date(data.targetDate),
        currentSchedule: data.currentSchedule,
        requestedSchedule: data.requestedSchedule,
        reason: data.reason,
        status: RequestStatus.PENDING,
      },
      include: {
        requester: {
          include: { team: true },
        },
        involvedAgent: true,
      },
    });

    // Crear log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: requesterId,
        action: 'REQUEST_CREATE',
        entity: 'REQUEST',
        entityId: request.id,
        changes: { ...data } as any,
      },
    });

    // Notificar al líder del equipo
    if (requester.team?.leaderId) {
      await NotificationService.createNotification(
        requester.team.leaderId,
        'REQUEST_PENDING',
        'Nueva solicitud pendiente',
        `${requester.firstName} ${requester.lastName} ha realizado una solicitud de cambio.`,
        request.id
      );
    }

    return request as RequestWithRelations;
  }

  /**
   * Obtiene solicitudes de un usuario (como solicitante o involucrado)
   */
  static async getUserRequests(
    userId: string,
    status?: RequestStatus
  ): Promise<RequestWithRelations[]> {
    const where: any = {
      OR: [
        { requesterId: userId },
        { involvedAgentId: userId },
      ],
    };

    if (status) {
      where.status = status;
    }

    const requests = await prisma.request.findMany({
      where,
      include: {
        requester: {
          include: { team: true },
        },
        involvedAgent: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests as RequestWithRelations[];
  }

  /**
   * Obtiene solicitudes pendientes del equipo de un líder
   */
  static async getTeamPendingRequests(leaderId: string): Promise<RequestWithRelations[]> {
    const leader = await prisma.user.findUnique({
      where: { id: leaderId },
      select: { teamId: true },
    });

    if (!leader?.teamId) {
      return [];
    }

    const requests = await prisma.request.findMany({
      where: {
        status: RequestStatus.PENDING,
        requester: {
          teamId: leader.teamId,
        },
      },
      include: {
        requester: {
          include: { team: true },
        },
        involvedAgent: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return requests as RequestWithRelations[];
  }

  /**
   * Obtiene todas las solicitudes del equipo de un líder
   */
  static async getTeamAllRequests(
    leaderId: string,
    status?: RequestStatus
  ): Promise<RequestWithRelations[]> {
    const leader = await prisma.user.findUnique({
      where: { id: leaderId },
      select: { teamId: true },
    });

    if (!leader?.teamId) {
      return [];
    }

    const where: any = {
      requester: {
        teamId: leader.teamId,
      },
    };

    if (status) {
      where.status = status;
    }

    const requests = await prisma.request.findMany({
      where,
      include: {
        requester: {
          include: { team: true },
        },
        involvedAgent: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests as RequestWithRelations[];
  }

  /**
   * Aprueba una solicitud
   */
  static async approveRequest(
    requestId: string,
    leaderId: string,
    comment?: string
  ): Promise<RequestWithRelations> {
    // Verificar que la solicitud existe y está pendiente
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        requester: { include: { team: true } },
      },
    });

    if (!request) {
      throw new Error('Solicitud no encontrada');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new Error('La solicitud ya ha sido resuelta');
    }

    // Verificar que el líder pertenece al equipo del solicitante
    if (request.requester.team?.leaderId !== leaderId) {
      throw new Error('No tienes permisos para aprobar esta solicitud');
    }

    // Actualizar la solicitud
    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.APPROVED,
        resolvedBy: leaderId,
        resolvedAt: new Date(),
        comment,
      },
      include: {
        requester: {
          include: { team: true },
        },
        involvedAgent: true,
      },
    });

    // Crear log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: leaderId,
        action: 'REQUEST_APPROVE',
        entity: 'REQUEST',
        entityId: requestId,
        changes: { status: RequestStatus.APPROVED, comment },
      },
    });

    // Notificar al solicitante
    await NotificationService.createNotification(
      request.requesterId,
      'REQUEST_APPROVED',
      'Solicitud aprobada',
      `Tu solicitud ha sido aprobada.${comment ? ` Comentario: ${comment}` : ''}`,
      requestId
    );

    // Si hay agente involucrado, notificarlo también
    if (request.involvedAgentId) {
      await NotificationService.createNotification(
        request.involvedAgentId,
        'REQUEST_APPROVED',
        'Cambio de horario aprobado',
        `Se ha aprobado el cambio de horario con ${request.requester.firstName} ${request.requester.lastName}.`,
        requestId
      );
    }

    return updatedRequest as RequestWithRelations;
  }

  /**
   * Rechaza una solicitud
   */
  static async rejectRequest(
    requestId: string,
    leaderId: string,
    comment?: string
  ): Promise<RequestWithRelations> {
    // Verificar que la solicitud existe y está pendiente
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        requester: { include: { team: true } },
      },
    });

    if (!request) {
      throw new Error('Solicitud no encontrada');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new Error('La solicitud ya ha sido resuelta');
    }

    // Verificar que el líder pertenece al equipo del solicitante
    if (request.requester.team?.leaderId !== leaderId) {
      throw new Error('No tienes permisos para rechazar esta solicitud');
    }

    // Actualizar la solicitud
    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.REJECTED,
        resolvedBy: leaderId,
        resolvedAt: new Date(),
        comment: comment || 'Solicitud rechazada',
      },
      include: {
        requester: {
          include: { team: true },
        },
        involvedAgent: true,
      },
    });

    // Crear log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: leaderId,
        action: 'REQUEST_REJECT',
        entity: 'REQUEST',
        entityId: requestId,
        changes: { status: RequestStatus.REJECTED, comment },
      },
    });

    // Notificar al solicitante
    await NotificationService.createNotification(
      request.requesterId,
      'REQUEST_REJECTED',
      'Solicitud rechazada',
      `Tu solicitud ha sido rechazada.${comment ? ` Motivo: ${comment}` : ''}`,
      requestId
    );

    // Si hay agente involucrado, notificarlo también
    if (request.involvedAgentId) {
      await NotificationService.createNotification(
        request.involvedAgentId,
        'REQUEST_REJECTED',
        'Cambio de horario rechazado',
        `Se ha rechazado el cambio de horario con ${request.requester.firstName} ${request.requester.lastName}.`,
        requestId
      );
    }

    return updatedRequest as RequestWithRelations;
  }

  /**
   * Obtiene una solicitud por ID
   */
  static async getRequestById(
    requestId: string
  ): Promise<RequestWithRelations | null> {
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          include: { team: true },
        },
        involvedAgent: true,
      },
    });

    return request as RequestWithRelations | null;
  }

  /**
   * Obtiene estadísticas de solicitudes para el dashboard de líder
   */
  static async getRequestStats(leaderId: string) {
    const leader = await prisma.user.findUnique({
      where: { id: leaderId },
      select: { teamId: true },
    });

    if (!leader?.teamId) {
      return {
        pending: 0,
        approvedThisMonth: 0,
        rejectedThisMonth: 0,
      };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [pending, approvedThisMonth, rejectedThisMonth] = await Promise.all([
      prisma.request.count({
        where: {
          status: RequestStatus.PENDING,
          requester: {
            teamId: leader.teamId,
          },
        },
      }),
      prisma.request.count({
        where: {
          status: RequestStatus.APPROVED,
          resolvedAt: {
            gte: startOfMonth,
          },
          requester: {
            teamId: leader.teamId,
          },
        },
      }),
      prisma.request.count({
        where: {
          status: RequestStatus.REJECTED,
          resolvedAt: {
            gte: startOfMonth,
          },
          requester: {
            teamId: leader.teamId,
          },
        },
      }),
    ]);

    return {
      pending,
      approvedThisMonth,
      rejectedThisMonth,
    };
  }

  /**
   * Verifica conflictos de horario para una solicitud
   */
  static async checkScheduleConflicts(
    userId: string,
    targetDate: Date,
    requestedSchedule: string
  ): Promise<boolean> {
    // Verificar si ya existe una solicitud aprobada para la misma fecha
    const conflictingRequest = await prisma.request.findFirst({
      where: {
        requesterId: userId,
        targetDate,
        status: RequestStatus.APPROVED,
      },
    });

    return !!conflictingRequest;
  }
}

export class NotificationService {
  /**
   * Crea una notificación para un usuario
   */
  static async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    requestId?: string
  ) {
    return prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        requestId,
      },
    });
  }

  /**
   * Obtiene notificaciones de un usuario
   */
  static async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false
  ) {
    const where: any = { userId };

    if (unreadOnly) {
      where.read = false;
    }

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Marca una notificación como leída
   */
  static async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });
  }

  /**
   * Obtiene el conteo de notificaciones no leídas
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }
}
