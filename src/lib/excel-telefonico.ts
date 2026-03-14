import * as XLSX from 'xlsx';
import { ScheduleFromExcel } from '@/types';

/**
 * Convierte hora decimal a formato HH:MM
 * Ej: 0.3333333333333333 -> 08:00
 *     0.5833333333333333 -> 14:00
 *     0.416666666666667 -> 10:00
 */
function decimalToTime(decimal: number | string | null | undefined): string {
  if (decimal === null || decimal === undefined || decimal === 0 || decimal === '' || decimal === '-') {
    return '-';
  }

  const numValue = typeof decimal === 'string' ? parseFloat(decimal) : decimal;

  if (isNaN(numValue) || numValue === 0) {
    return '-';
  }

  const hours = numValue * 24;
  let hour = Math.floor(hours);
  let minutes = Math.round((hours - hour) * 60);

  // Ajustar cuando minutos >= 60 (debido a errores de precisión)
  if (minutes >= 60) {
    hour += 1;
    minutes = 0;
  }
  // Ajustar cuando minutos son negativos (caso raro de precisión)
  if (minutes < 0) {
    hour -= 1;
    minutes = 60 + minutes;
  }

  return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Valida y procesa el archivo Excel con formato "TELEFONICO"
 * Estructura:
 * - Fila 0: Encabezados de sección (DATOS REPS, FRANCO, HORARIOS)
 * - Fila 1: Nombres de columnas reales
 * - Fila 2+: Datos
 */
export async function processTelefonicoExcel(file: File) {
  const errors: Array<{ row: number; field: string; message: string }> = [];
  const data: Array<{
    dni: string;
    nombre: string;
    apellido: string;
    email?: string;
    equipo: string;
    lider: string;
    segmento: string;
    dia_franco: string;
    horarios_por_dia: Array<{
      dia: string;
      ingreso: string;
      egreso: string;
      break: string;
    }>;
  }> = [];

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const sheetName = workbook.SheetNames.find(s => s.toUpperCase() === 'TELEFONICO');

    if (!sheetName) {
      return {
        valid: false,
        errors: [{ row: 0, field: 'file', message: 'No se encontró la hoja "TELEFONICO"' }],
      };
    }

    const sheet = workbook.Sheets[sheetName];
    // IMPORTANTE: Usar raw: true para obtener valores numéricos correctamente
    const jsonData = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: '',
    });

    if (jsonData.length < 3) {
      return {
        valid: false,
        errors: [{ row: 0, field: 'file', message: 'El archivo debe tener al menos 2 filas de encabezados y 1 de datos' }],
      };
    }

    // Verificar estructura de encabezados
    const headerRow1 = jsonData[0] as string[];
    const headerRow2 = jsonData[1] as string[];

    if (!headerRow1[0]?.includes('DATOS') || !headerRow2[0]?.includes('DNI')) {
      return {
        valid: false,
        errors: [{ row: 0, field: 'columns', message: 'El formato del archivo no corresponde a TELEFONICO' }],
      };
    }

    // Procesar cada fila de datos (desde la fila 2)
    for (let i = 2; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      const rowNum = i + 1;

      // Saltar filas vacías
      if (!row[0] && !row[1]) {
        continue;
      }

      const rowData: any = {};

      // Extraer datos básicos
      rowData.dni = String(row[0] || '').trim();
      rowData.nombre_completo = String(row[1] || '').trim();
      rowData.lider = String(row[2] || '').trim();
      rowData.segmento = String(row[3] || '').trim();

      // Validar campos requeridos
      if (!rowData.dni) {
        errors.push({ row: rowNum, field: 'DNI', message: 'El DNI es requerido' });
      }
      if (!rowData.nombre_completo) {
        errors.push({ row: rowNum, field: 'Nombre', message: 'El nombre es requerido' });
      }
      if (!rowData.lider) {
        errors.push({ row: rowNum, field: 'Equipo', message: 'El equipo/líder es requerido' });
      }

      // Separar nombre y apellido
      const nameParts = rowData.nombre_completo.split(' ').filter(p => p.trim());
      if (nameParts.length >= 2) {
        rowData.apellido = nameParts.slice(0, -1).join(' ');
        rowData.nombre = nameParts[nameParts.length - 1];
      } else if (nameParts.length === 1) {
        rowData.nombre = nameParts[0];
        rowData.apellido = '';
      } else {
        rowData.nombre = '';
        rowData.apellido = '';
      }

      // Buscar día de franco (columnas 5-11)
      const dias = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
      const colFrancoStart = 5;
      let diaFranco = '';

      for (let d = 0; d < dias.length; d++) {
        const valor = String(row[colFrancoStart + d] || '').trim().toLowerCase();
        if (valor === 'franco' || valor === 'f' || valor === 'franco ') {
          diaFranco = dias[d];
          break;
        }
      }

      rowData.dia_franco = diaFranco;

      // Extraer horarios por día (columnas 12-25 para ingreso/egreso, 26,29,32,35,38,41,44 para break)
      const colIngreso = 12;
      const diasMap = [
        'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'
      ];
      const breakCols = [26, 29, 32, 35, 38, 41, 44];

      rowData.horarios_por_dia = [];

      for (let d = 0; d < 7; d++) {
        const ingreso = row[colIngreso + d * 2];
        const egreso = row[colIngreso + d * 2 + 1];
        const breakVal = row[breakCols[d]];

        const horario = {
          dia: diasMap[d],
          ingreso: decimalToTime(ingreso),
          egreso: decimalToTime(egreso),
          break: decimalToTime(breakVal),
        };

        rowData.horarios_por_dia.push(horario);
      }

      // Generar email (por defecto usa formato nombre.apellido@dominio.com)
      if (rowData.nombre && rowData.apellido) {
        const nombreNormalizado = rowData.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
        const apellidoNormalizado = rowData.apellido.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
        rowData.email = `${nombreNormalizado}.${apellidoNormalizado}@example.com`;
      }

      // Si no hay errores en esta fila, agregar a los datos
      const rowErrors = errors.filter(e => e.row === rowNum);
      if (rowErrors.length === 0) {
        data.push(rowData);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [{ row: 0, field: 'file', message: `Error al leer el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}` }],
    };
  }
}

/**
 * Genera un reporte de los horarios procesados
 */
export function generateScheduleReport(processedData: Array<any>) {
  let report = '# Reporte de Horarios Procesados\n\n';

  report += `| DNI | Nombre | Equipo | Segmento | Franco |\n`;
  report += `|-----|--------|--------|----------|--------|\n`;

  for (const row of processedData) {
    report += `| ${row.dni} | ${row.nombre_completo} | ${row.lider} | ${row.segmento} | ${row.dia_franco || '-'} |\n`;

    if (row.horarios_por_dia && row.horarios_por_dia.length > 0) {
      report += `| | | | Horarios: |\n`;
      for (const horario of row.horarios_por_dia) {
        if (horario.ingreso !== '-') {
          report += `| | | ${horario.dia} | | ${horario.ingreso} - ${horario.egreso} (Break: ${horario.break}) |\n`;
        }
      }
    }
    report += '\n';
  }

  return report;
}
