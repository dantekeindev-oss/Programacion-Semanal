import * as XLSX from 'xlsx';
import { ScheduleFromExcel, ExcelValidationResult, EXCEL_COLUMNS, WeekDayType } from '@/types';

const WEEK_DAYS_MAP: Record<string, WeekDayType> = {
  'lunes': 'MONDAY',
  'martes': 'TUESDAY',
  'miércoles': 'WEDNESDAY',
  'miercoles': 'WEDNESDAY',
  'jueves': 'THURSDAY',
  'viernes': 'FRIDAY',
  'sábado': 'SATURDAY',
  'sabado': 'SATURDAY',
  'domingo': 'SUNDAY',
  'monday': 'MONDAY',
  'tuesday': 'TUESDAY',
  'wednesday': 'WEDNESDAY',
  'thursday': 'THURSDAY',
  'friday': 'FRIDAY',
  'saturday': 'SATURDAY',
  'sunday': 'SUNDAY',
};

/**
 * Valida y procesa un archivo Excel de horarios
 */
export async function processExcelFile(file: File): Promise<ExcelValidationResult> {
  const errors: Array<{ row: number; field: string; message: string }> = [];
  const data: ScheduleFromExcel[] = [];

  try {
    // Leer el archivo
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Obtener la primera hoja
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convertir a JSON
    const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: '',
      raw: false,
    });

    if (jsonData.length === 0) {
      return {
        valid: false,
        errors: [{ row: 0, field: 'file', message: 'El archivo está vacío' }],
      };
    }

    // Validar columnas requeridas
    const firstRow = jsonData[0] as Record<string, any>;
    const requiredColumns = [
      EXCEL_COLUMNS.NOMBRE,
      EXCEL_COLUMNS.APELLIDO,
      EXCEL_COLUMNS.EMAIL,
      EXCEL_COLUMNS.EQUIPO,
      EXCEL_COLUMNS.LIDER,
      EXCEL_COLUMNS.DIA_FRANCO,
      EXCEL_COLUMNS.HORARIO_BREAK,
      EXCEL_COLUMNS.FECHA_VIGENCIA_DESDE,
    ];

    const missingColumns = requiredColumns.filter(col => !(col in firstRow || Object.keys(firstRow).some(k => k.toLowerCase().trim() === col.toLowerCase())));

    if (missingColumns.length > 0) {
      return {
        valid: false,
        errors: [{ row: 0, field: 'columns', message: `Faltan columnas: ${missingColumns.join(', ')}` }],
      };
    }

    // Normalizar y procesar cada fila
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as Record<string, any>;
      const rowNum = i + 2; // +2 por el encabezado y el índice 0

      // Normalizar keys (case insensitive)
      const normalizedRow: Record<string, any> = {};
      for (const key in row) {
        normalizedRow[key.toLowerCase().trim()] = row[key];
      }

      const rowData: Partial<ScheduleFromExcel> = {};

      // Validar y extraer cada campo
      if (!normalizedRow[EXCEL_COLUMNS.NOMBRE]) {
        errors.push({ row: rowNum, field: EXCEL_COLUMNS.NOMBRE, message: 'El nombre es requerido' });
      } else {
        rowData.nombre = String(normalizedRow[EXCEL_COLUMNS.NOMBRE]).trim();
      }

      if (!normalizedRow[EXCEL_COLUMNS.APELLIDO]) {
        errors.push({ row: rowNum, field: EXCEL_COLUMNS.APELLIDO, message: 'El apellido es requerido' });
      } else {
        rowData.apellido = String(normalizedRow[EXCEL_COLUMNS.APELLIDO]).trim();
      }

      if (!normalizedRow[EXCEL_COLUMNS.EMAIL]) {
        errors.push({ row: rowNum, field: EXCEL_COLUMNS.EMAIL, message: 'El email es requerido' });
      } else {
        const email = String(normalizedRow[EXCEL_COLUMNS.EMAIL]).trim().toLowerCase();
        if (!isValidEmail(email)) {
          errors.push({ row: rowNum, field: EXCEL_COLUMNS.EMAIL, message: 'Email inválido' });
        } else {
          rowData.email = email;
        }
      }

      if (!normalizedRow[EXCEL_COLUMNS.EQUIPO]) {
        errors.push({ row: rowNum, field: EXCEL_COLUMNS.EQUIPO, message: 'El equipo es requerido' });
      } else {
        rowData.equipo = String(normalizedRow[EXCEL_COLUMNS.EQUIPO]).trim();
      }

      if (!normalizedRow[EXCEL_COLUMNS.LIDER]) {
        errors.push({ row: rowNum, field: EXCEL_COLUMNS.LIDER, message: 'El líder es requerido' });
      } else {
        rowData.lider = String(normalizedRow[EXCEL_COLUMNS.LIDER]).trim();
      }

      if (!normalizedRow[EXCEL_COLUMNS.DIA_FRANCO]) {
        errors.push({ row: rowNum, field: EXCEL_COLUMNS.DIA_FRANCO, message: 'El día de franco es requerido' });
      } else {
        const dayOff = String(normalizedRow[EXCEL_COLUMNS.DIA_FRANCO]).trim().toLowerCase();
        const normalizedDay = WEEK_DAYS_MAP[dayOff];
        if (!normalizedDay) {
          errors.push({ row: rowNum, field: EXCEL_COLUMNS.DIA_FRANCO, message: `Día de franco inválido: ${dayOff}` });
        } else {
          rowData.dia_franco = normalizedDay;
        }
      }

      if (!normalizedRow[EXCEL_COLUMNS.HORARIO_BREAK]) {
        errors.push({ row: rowNum, field: EXCEL_COLUMNS.HORARIO_BREAK, message: 'El horario de break es requerido' });
      } else {
        const breakTime = String(normalizedRow[EXCEL_COLUMNS.HORARIO_BREAK]).trim();
        if (!isValidTimeRange(breakTime)) {
          errors.push({ row: rowNum, field: EXCEL_COLUMNS.HORARIO_BREAK, message: `Horario de break inválido (formato HH:MM-HH:MM): ${breakTime}` });
        } else {
          rowData.horario_break = breakTime;
        }
      }

      if (!normalizedRow[EXCEL_COLUMNS.FECHA_VIGENCIA_DESDE]) {
        errors.push({ row: rowNum, field: EXCEL_COLUMNS.FECHA_VIGENCIA_DESDE, message: 'La fecha de vigencia desde es requerida' });
      } else {
        const dateFrom = String(normalizedRow[EXCEL_COLUMNS.FECHA_VIGENCIA_DESDE]).trim();
        const parsedDate = parseExcelDate(dateFrom);
        if (!parsedDate) {
          errors.push({ row: rowNum, field: EXCEL_COLUMNS.FECHA_VIGENCIA_DESDE, message: `Fecha inválida: ${dateFrom}` });
        } else {
          rowData.fecha_vigencia_desde = dateFrom;
        }
      }

      // Campos opcionales
      if (normalizedRow[EXCEL_COLUMNS.HORARIO_TRABAJO]) {
        const workTime = String(normalizedRow[EXCEL_COLUMNS.HORARIO_TRABAJO]).trim();
        if (isValidTimeRange(workTime)) {
          rowData.horario_trabajo = workTime;
        }
      }

      if (normalizedRow[EXCEL_COLUMNS.FECHA_VIGENCIA_HASTA]) {
        const dateTo = String(normalizedRow[EXCEL_COLUMNS.FECHA_VIGENCIA_HASTA]).trim();
        if (dateTo) {
          const parsedDate = parseExcelDate(dateTo);
          if (!parsedDate) {
            errors.push({ row: rowNum, field: EXCEL_COLUMNS.FECHA_VIGENCIA_HASTA, message: `Fecha inválida: ${dateTo}` });
          } else {
            rowData.fecha_vigencia_hasta = dateTo;
          }
        }
      }

      // Si no hay errores en esta fila, agregar a los datos
      const rowErrors = errors.filter(e => e.row === rowNum);
      if (rowErrors.length === 0) {
        data.push(rowData as ScheduleFromExcel);
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
 * Valida formato de email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida formato de rango de tiempo (HH:MM-HH:MM)
 */
function isValidTimeRange(timeRange: string): boolean {
  const timeRegex = /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/;
  if (!timeRegex.test(timeRange)) return false;

  const [start, end] = timeRange.split('-');
  if (!isValidTime(start) || !isValidTime(end)) return false;

  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  return endMinutes > startMinutes;
}

/**
 * Valida formato de hora (HH:MM)
 */
function isValidTime(time: string): boolean {
  const timeRegex = /^\d{1,2}:\d{2}$/;
  if (!timeRegex.test(time)) return false;

  const [hours, minutes] = time.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

/**
 * Convierte hora a minutos desde medianoche
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Parsea fecha de Excel
 */
function parseExcelDate(dateStr: string): Date | null {
  try {
    // Intentar como fecha de Excel serial
    const excelDate = parseFloat(dateStr);
    if (!isNaN(excelDate) && excelDate > 0 && excelDate < 100000) {
      // Fecha de Excel desde 1900
      const excelEpoch = new Date(1900, 0, 1);
      const days = Math.floor(excelDate) - 2; // -2 por el bug de Excel con 1900 como año bisiesto
      return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    }

    // Intentar parsear como string de fecha
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Genera una plantilla de Excel descargable
 */
export function generateExcelTemplate(): Buffer {
  const template = [
    {
      [EXCEL_COLUMNS.NOMBRE]: 'Juan',
      [EXCEL_COLUMNS.APELLIDO]: 'Pérez',
      [EXCEL_COLUMNS.EMAIL]: 'juan.perez@empresa.com',
      [EXCEL_COLUMNS.EQUIPO]: 'Soporte Nivel 1',
      [EXCEL_COLUMNS.LIDER]: 'maria.garcia@empresa.com',
      [EXCEL_COLUMNS.DIA_FRANCO]: 'Lunes',
      [EXCEL_COLUMNS.HORARIO_BREAK]: '15:00-15:15',
      [EXCEL_COLUMNS.HORARIO_TRABAJO]: '09:00-18:00',
      [EXCEL_COLUMNS.FECHA_VIGENCIA_DESDE]: '2024-01-01',
      [EXCEL_COLUMNS.FECHA_VIGENCIA_HASTA]: '2024-12-31',
    },
    {
      [EXCEL_COLUMNS.NOMBRE]: 'María',
      [EXCEL_COLUMNS.APELLIDO]: 'García',
      [EXCEL_COLUMNS.EMAIL]: 'maria.garcia@empresa.com',
      [EXCEL_COLUMNS.EQUIPO]: 'Soporte Nivel 1',
      [EXCEL_COLUMNS.LIDER]: 'maria.garcia@empresa.com',
      [EXCEL_COLUMNS.DIA_FRANCO]: 'Martes',
      [EXCEL_COLUMNS.HORARIO_BREAK]: '14:00-14:15',
      [EXCEL_COLUMNS.HORARIO_TRABAJO]: '09:00-18:00',
      [EXCEL_COLUMNS.FECHA_VIGENCIA_DESDE]: '2024-01-01',
      [EXCEL_COLUMNS.FECHA_VIGENCIA_HASTA]: '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
