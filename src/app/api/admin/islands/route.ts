import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Obtener todas las islas
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  // Verificar que sea admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
  }

  try {
    const islands = await prisma.island.findMany({
      include: {
        threshold: true,
        _count: {
          select: { agents: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: islands,
    });
  } catch (error) {
    console.error('Error al obtener islas:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al obtener islas' },
      { status: 500 }
    );
  }
}

// POST - Crear una nueva isla
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  // Verificar que sea admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, code, description } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'El nombre es obligatorio' },
        { status: 400 }
      );
    }

    // Verificar que no exista una isla con el mismo nombre o código
    const existing = await prisma.island.findFirst({
      where: {
        OR: [
          { name },
          code ? { code } : {},
        ].filter(Boolean),
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una isla con ese nombre o código' },
        { status: 400 }
      );
    }

    const island = await prisma.island.create({
      data: {
        name,
        code,
        description,
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
    console.error('Error al crear isla:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al crear isla' },
      { status: 500 }
    );
  }
}
