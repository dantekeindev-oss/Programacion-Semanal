import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type CleanupSummary = {
  deletedNotifications: number;
  deletedRequests: number;
  deletedAuditLogs: number;
  deletedBreaks: number;
  deletedSchedules: number;
  deletedSessions: number;
  deletedAccounts: number;
  deletedVerificationTokens: number;
  deletedTeams: number;
  deletedUsers: number;
  resetUsers: number;
};

export async function runFullSystemCleanup(adminEmail: string): Promise<CleanupSummary> {
  const adminUser = await prisma.user.findFirst({
    where: { email: adminEmail },
    select: { id: true },
  });

  const adminUserId = adminUser?.id ?? null;

  const deletedNotifications = await prisma.notification.deleteMany();
  const deletedRequests = await prisma.request.deleteMany();
  const deletedAuditLogs = await prisma.auditLog.deleteMany();
  const deletedBreaks = await prisma.break.deleteMany();
  const deletedSchedules = await prisma.schedule.deleteMany();
  const deletedSessions = adminUserId
    ? await prisma.session.deleteMany({ where: { userId: { not: adminUserId } } })
    : await prisma.session.deleteMany();
  const deletedAccounts = adminUserId
    ? await prisma.account.deleteMany({ where: { userId: { not: adminUserId } } })
    : await prisma.account.deleteMany();
  const deletedVerificationTokens = await prisma.verificationToken.deleteMany();

  const resetUsers = await prisma.user.updateMany({
    where: adminUserId ? { id: { not: adminUserId } } : {},
    data: {
      teamId: null,
      leaderId: null,
      weeklyDayOff: null,
    },
  });

  const deletedTeams = await prisma.team.deleteMany();
  const deletedUsers = adminUserId
    ? await prisma.user.deleteMany({ where: { id: { not: adminUserId } } })
    : await prisma.user.deleteMany();

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: Role.ADMIN,
      name: 'Administrador',
      firstName: 'Administrador',
      lastName: '',
      teamId: null,
      leaderId: null,
      weeklyDayOff: null,
    },
    create: {
      email: adminEmail,
      role: Role.ADMIN,
      name: 'Administrador',
      firstName: 'Administrador',
      lastName: '',
    },
  });

  return {
    deletedNotifications: deletedNotifications.count,
    deletedRequests: deletedRequests.count,
    deletedAuditLogs: deletedAuditLogs.count,
    deletedBreaks: deletedBreaks.count,
    deletedSchedules: deletedSchedules.count,
    deletedSessions: deletedSessions.count,
    deletedAccounts: deletedAccounts.count,
    deletedVerificationTokens: deletedVerificationTokens.count,
    deletedTeams: deletedTeams.count,
    deletedUsers: deletedUsers.count,
    resetUsers: resetUsers.count,
  };
}
