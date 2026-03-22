import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Obtener umbrales de una isla
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
  }

  try {
    const threshold = await prisma.islandThreshold.findUnique({
      where: { islandId: params.id },
    });

    if (!threshold) {
      return NextResponse.json(
        { success: false, error: 'Umbrales no encontrados' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: threshold,
    });
  } catch (error) {
    console.error('Error al obtener umbrales:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al obtener umbrales' },
      { status: 500 }
    );
  }
}

// POST - Crear umbrales para una isla
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();

    // Valores por defecto si no se proporcionan
    const threshold = await prisma.islandThreshold.create({
      data: {
        islandId: params.id,
        targetTmo: body.targetTmo ?? 360,
        warningTmo: body.warningTmo ?? 420,
        criticalTmo: body.criticalTmo ?? 480,
        targetBreak: body.targetBreak ?? 900,
        warningBreak: body.warningBreak ?? 1080,
        criticalBreak: body.criticalBreak ?? 1260,
        targetAcw: body.targetAcw ?? 30,
        warningAcw: body.warningAcw ?? 45,
        criticalAcw: body.criticalAcw ?? 60,
        targetHold: body.targetHold ?? 60,
        warningHold: body.warningHold ?? 90,
        criticalHold: body.criticalHold ?? 120,
        targetAdherence: body.targetAdherence ?? 95.0,
        warningAdherence: body.warningAdherence ?? 90.0,
        criticalAdherence: body.criticalAdherence ?? 85.0,
      },
    });

    return NextResponse.json({
      success: true,
      data: threshold,
    });
  } catch (error) {
    console.error('Error al crear umbrales:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al crear umbrales' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar umbrales de una isla
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();

    const threshold = await prisma.islandThreshold.update({
      where: { islandId: params.id },
      data: {
        ...(body.targetTmo !== undefined && { targetTmo: body.targetTmo }),
        ...(body.warningTmo !== undefined && { warningTmo: body.warningTmo }),
        ...(body.criticalTmo !== undefined && { criticalTmo: body.criticalTmo }),
        ...(body.targetBreak !== undefined && { targetBreak: body.targetBreak }),
        ...(body.warningBreak !== undefined && { warningBreak: body.warningBreak }),
        ...(body.criticalBreak !== undefined && { criticalBreak: body.criticalBreak }),
        ...(body.targetAcw !== undefined && { targetAcw: body.targetAcw }),
        ...(body.warningAcw !== undefined && { warningAcw: body.warningAcw }),
        ...(body.criticalAcw !== undefined && { criticalAcw: body.criticalAcw }),
        ...(body.targetHold !== undefined && { targetHold: body.targetHold }),
        ...(body.warningHold !== undefined && { warningHold: body.warningHold }),
        ...(body.criticalHold !== undefined && { criticalHold: body.criticalHold }),
        ...(body.targetAdherence !== undefined && { targetAdherence: body.targetAdherence }),
        ...(body.warningAdherence !== undefined && { warningAdherence: body.warningAdherence }),
        ...(body.criticalAdherence !== undefined && { criticalAdherence: body.criticalAdherence }),
      },
    });

    return NextResponse.json({
      success: true,
      data: threshold,
    });
  } catch (error) {
    console.error('Error al actualizar umbrales:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al actualizar umbrales' },
      { status: 500 }
    );
  }
}
