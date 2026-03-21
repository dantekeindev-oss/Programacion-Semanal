import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authResult = requireAdminSession(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    const [totalUsers, totalTeams, totalLeaders, totalAgents, totalRequests, lastCleanup] = await Promise.all([
      prisma.user.count(),
      prisma.team.count(),
      prisma.user.count({ where: { role: 'LEADER' } }),
      prisma.user.count({ where: { role: 'AGENT' } }),
      prisma.request.count(),
      prisma.auditLog.findFirst({
        where: {
          action: {
            in: ['PROGRAMMING_CLEAR', 'SYSTEM_CLEANUP_MANUAL', 'SYSTEM_CLEANUP_CRON'],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          action: true,
          createdAt: true,
          changes: true,
        },
      }),
    ]);

    return NextResponse.json({
      data: {
        totalUsers,
        totalTeams,
        totalLeaders,
        totalAgents,
        totalRequests,
        lastCleanup: lastCleanup
          ? {
              action: lastCleanup.action,
              createdAt: lastCleanup.createdAt,
              changes: lastCleanup.changes,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error al obtener estadisticas:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadisticas' },
      { status: 500 }
    );
  }
}
