import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireLeader } from '@/lib/middleware';
import { processExcelFile } from '@/lib/excel';
import { UserService } from '@/lib/services/userService';

/**
 * POST /api/excel/upload
 * Sube y procesa un archivo Excel con datos de horarios
 */
export async function POST(req: NextRequest) {
  // Verificar autenticación y rol de líder
  const authResult = await requireLeader();

  if ('error' in authResult) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    );
  }

  const session = authResult.session;

  try {
    // Obtener el archivo del formulario
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de archivo no válido. Se requiere un archivo Excel (.xlsx)' },
        { status: 400 }
      );
    }

    // Procesar el archivo
    const result = await processExcelFile(file);

    if (!result.valid || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Errores de validación en el archivo Excel',
          errors: result.errors,
        },
        { status: 400 }
      );
    }

    // Guardar los datos en la base de datos
    const importResult = await UserService.upsertFromExcel(result.data);

    return NextResponse.json({
      success: true,
      message: 'Archivo procesado correctamente',
      data: importResult,
    });
  } catch (error) {
    console.error('Error al procesar Excel:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al procesar el archivo',
      },
      { status: 500 }
    );
  }
}
