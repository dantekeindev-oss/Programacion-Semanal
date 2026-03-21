import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateExcelTemplate } from '@/lib/excel';

/**
 * GET /api/excel/template
 * Descarga una plantilla de Excel para cargar horarios
 */
export async function GET(req: NextRequest) {
  // Verificar autenticación
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }

  try {
    const buffer = generateExcelTemplate();

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="plantilla_horarios.xlsx"',
      },
    });
  } catch (error) {
    console.error('Error al generar plantilla:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al generar la plantilla',
      },
      { status: 500 }
    );
  }
}
