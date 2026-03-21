import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminAuthConfig, requireAdminSession } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const authResult = requireAdminSession(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    const [deletedSchedules, deletedBreaks, resetUsers] = await prisma.$transaction([
      prisma.schedule.deleteMany(),
      prisma.break.deleteMany(),
      prisma.user.updateMany({
        where: { role: { in: ['AGENT', 'LEADER'] } },
        data: { weeklyDayOff: null },
      }),
    ]);

    try {
      const { adminEmail } = getAdminAuthConfig();
      const adminUser = await prisma.user.findFirst({
        where: { email: adminEmail },
      });

      if (adminUser) {
        await prisma.auditLog.create({
          data: {
            userId: adminUser.id,
            action: 'PROGRAMMING_CLEAR',
            entity: 'SCHEDULE',
            changes: {
              deletedSchedules: deletedSchedules.count,
              deletedBreaks: deletedBreaks.count,
              resetUsers: resetUsers.count,
            },
          },
        });
      }
    } catch {
      // Ignorar errores de auditoria
    }

    return NextResponse.json({
      success: true,
      message: 'Programacion eliminada correctamente',
      data: {
        deletedSchedules: deletedSchedules.count,
        deletedBreaks: deletedBreaks.count,
        resetUsers: resetUsers.count,
      },
    });
  } catch (error) {
    console.error('Error al limpiar la programacion:', error);
    return NextResponse.json(
      { success: false, error: 'Error al limpiar la programacion' },
      { status: 500 }
    );
  }
}
