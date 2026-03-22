import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Obtener una isla por ID
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
    const island = await prisma.island.findUnique({
      where: { id: params.id },
      include: {
        threshold: true,
        agents: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
            skill: true,
          },
        },
      },
    });

    if (!island) {
      return NextResponse.json(
        { success: false, error: 'Isla no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: island,
    });
  } catch (error) {
    console.error('Error al obtener isla:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al obtener isla' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar una isla
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
    const { name, code, description, isActive } = body;

    const island = await prisma.island.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        threshold: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: island,
    });
  } catch (error) {
    console.error('Error al actualizar isla:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al actualizar isla' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una isla
export async function DELETE(
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
    // Verificar que no haya agentes asignados
    const agentsCount = await prisma.user.count({
      where: { islandId: params.id },
    });

    if (agentsCount > 0) {
      return NextResponse.json(
        { success: false, error: `No se puede eliminar. Hay ${agentsCount} agentes asignados a esta isla.` },
        { status: 400 }
      );
    }

    await prisma.island.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Isla eliminada correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar isla:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al eliminar isla' },
      { status: 500 }
    );
  }
}
