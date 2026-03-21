import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT - Actualizar email de un usuario
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: userId y email' },
        { status: 400 }
      );
    }

    // Validar formato de email
    if (!email.endsWith('@konecta.com')) {
      return NextResponse.json(
        { success: false, error: 'El email debe terminar con @konecta.com' },
        { status: 400 }
      );
    }

    // Verificar que el email no esté en uso por otro usuario
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json(
        { success: false, error: 'El email ya está en uso por otro usuario' },
        { status: 400 }
      );
    }

    // Actualizar el email y marcar como configurado manualmente
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email,
        emailManuallySet: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        emailManuallySet: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error al actualizar email:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al actualizar email' },
      { status: 500 }
    );
  }
}
