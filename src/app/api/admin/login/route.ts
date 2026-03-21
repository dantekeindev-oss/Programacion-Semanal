import { NextRequest, NextResponse } from 'next/server';
import {
  createAdminSession,
  getAdminAuthConfig,
  setAdminSessionCookie,
} from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const { adminEmail, adminPassword } = getAdminAuthConfig();

    if (!adminPassword) {
      return NextResponse.json(
        { error: 'Falta configurar ADMIN_PASSWORD en el entorno' },
        { status: 500 }
      );
    }

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: createAdminSession(adminEmail),
    });

    setAdminSessionCookie(response, adminEmail);

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error al iniciar sesión',
      },
      { status: 500 }
    );
  }
}
