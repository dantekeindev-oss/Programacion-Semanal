import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuthConfig, requireAdminSession } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';
import { runFullSystemCleanup } from '@/lib/systemCleanup';

export const dynamic = 'force-dynamic';

function isAuthorizedCronRequest(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

async function executeCleanup(source: 'admin' | 'cron') {
  const { adminEmail } = getAdminAuthConfig();
  const summary = await runFullSystemCleanup(adminEmail);

  try {
    const adminUser = await prisma.user.findFirst({
      where: { email: adminEmail },
    });

    if (adminUser) {
      await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: source === 'cron' ? 'SYSTEM_CLEANUP_CRON' : 'SYSTEM_CLEANUP_MANUAL',
          entity: 'SYSTEM',
          changes: summary,
        },
      });
    }
  } catch {
    // Ignorar errores de auditoria
  }

  return NextResponse.json({
    success: true,
    message: source === 'cron'
      ? 'Limpieza mensual ejecutada correctamente'
      : 'Limpieza total ejecutada correctamente',
    data: summary,
  });
}

export async function POST(req: NextRequest) {
  try {
    const authResult = requireAdminSession(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    return await executeCleanup('admin');
  } catch (error) {
    console.error('Error en limpieza total manual:', error);
    return NextResponse.json(
      { success: false, error: 'Error al ejecutar la limpieza total' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(req)) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    return await executeCleanup('cron');
  } catch (error) {
    console.error('Error en limpieza total automatica:', error);
    return NextResponse.json(
      { success: false, error: 'Error al ejecutar la limpieza total automatica' },
      { status: 500 }
    );
  }
}
