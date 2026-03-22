// ============================================
// PARSER DE CSV OPERATIVO
// ============================================

import { DEFAULT_COLUMN_MAPPINGS, ParsedOperationsRow } from '@/types/operations';
import * as XLSX from 'xlsx';

/**
 * Normaliza el nombre de una columna para encontrar equivalencias
 */
export function normalizeColumnName(columnName: string): string {
  return columnName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Encuentra el campo correspondiente a una columna del CSV
 */
export function findFieldForColumn(columnName: string, mappings: Record<string, string[]> = DEFAULT_COLUMN_MAPPINGS): string | null {
  const normalized = normalizeColumnName(columnName);

  for (const [field, possibleNames] of Object.entries(mappings)) {
    for (const name of possibleNames) {
      if (normalizeColumnName(name) === normalized) {
        return field;
      }
    }
  }

  return null;
}

/**
 * Parsea una columna de tiempo a segundos
 * Soporta formatos: "HH:MM:SS", "H:MM:SS", "MM:SS", o número directo
 */
export function parseTimeColumn(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;

  // Si ya es un número
  if (typeof value === 'number') return value;

  // Convertir a string si no lo es
  const str = String(value).trim();

  // Si está vacío
  if (!str || str === '-' || str === 'N/A') return null;

  // Si es solo números
  if (/^\d+$/.test(str)) return parseInt(str, 10);

  // Parsear formato HH:MM:SS o MM:SS
  const parts = str.split(':').map(p => {
    const num = parseInt(p, 10);
    return isNaN(num) ? 0 : num;
  });

  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS - asumir que es minutos:segundos
    return parts[0] * 60 + parts[1];
  }

  return null;
}

/**
 * Parsea una columna numérica
 */
export function parseNumberColumn(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;

  // Si ya es un número
  if (typeof value === 'number') return value;

  // Convertir a string
  const str = String(value).trim();

  // Si está vacío
  if (!str || str === '-' || str === 'N/A') return null;

  // Remover separadores de miles y convertir
  const num = parseFloat(str.replace(/,/g, ''));

  return isNaN(num) ? null : num;
}

/**
 * Parsea una columna de texto
 */
export function parseTextColumn(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;

  const str = String(value).trim();

  if (!str || str === '-' || str === 'N/A') return null;

  return str;
}

/**
 * Mapea las columnas de un CSV a los campos del sistema
 */
export function mapCSVColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const header of headers) {
    const field = findFieldForColumn(header);
    if (field) {
      mapping[field] = header;
    }
  }

  return mapping;
}

/**
 * Normaliza el nombre del agente para coincidir con la nómina
 * Formato CSV: "Apellido, Nombre" -> "Nombre Apellido"
 */
export function normalizeAgentName(csvName: string): string {
  if (!csvName) return '';

  // Si ya está en formato "Nombre Apellido", retornar tal cual
  if (!csvName.includes(',')) {
    return csvName.trim();
  }

  // Formato "Apellido, Nombre" o "Apellido1 Apellido2, Nombre1 Nombre2"
  const parts = csvName.split(',').map(p => p.trim());

  if (parts.length >= 2) {
    // Unir primero los apellidos, luego los nombres
    const apellidos = parts[0]; // Parte antes de la coma
    const nombres = parts.slice(1).join(' '); // Parte después de la coma

    return `${nombres} ${apellidos}`.trim();
  }

  return csvName.trim();
}

/**
 * Parsea una fila del CSV a una estructura interna
 */
export function parseCSVRow(row: Record<string, unknown>, columnMapping: Record<string, string>): ParsedOperationsRow {
  const getValue = (field: string) => {
    const csvColumn = columnMapping[field];
    return csvColumn ? row[csvColumn] : undefined;
  };

  // Obtener nombre del agente y normalizarlo
  const rawAgentName = parseTextColumn(getValue('agentName') as string) || '';
  const normalizedName = normalizeAgentName(rawAgentName);

  return {
    employeeId: parseTextColumn(getValue('employeeId') as string) || undefined,
    agentName: normalizedName,
    leaderName: parseTextColumn(getValue('leaderName') as string) || undefined,
    skill: parseTextColumn(getValue('skill') as string) || undefined,
    currentStatus: parseTextColumn(getValue('currentStatus') as string) || undefined,
    timeInStatusSeconds: parseTimeColumn(getValue('timeInStatus') as string | number) || undefined,
    loginTime: getValue('loginTime') as string | number | undefined,
    continuousLoginTime: getValue('continuousLoginTime') as string | number | undefined,
    _rawLoginTimeSeconds: parseTimeColumn(getValue('loginTime') as string | number) || undefined,
    _rawContinuousLoginTimeSeconds: parseTimeColumn(getValue('continuousLoginTime') as string | number) || undefined,
    tmo: parseTimeColumn(getValue('tmo') as string | number) || undefined,
    break: parseTimeColumn(getValue('break') as string | number) || undefined,
    coaching: parseTimeColumn(getValue('coaching') as string | number) || undefined,
    acw: parseTimeColumn(getValue('acw') as string | number) || undefined,
    hold: parseTimeColumn(getValue('hold') as string | number) || undefined,
    transfers: parseNumberColumn(getValue('transfers') as string | number) || undefined,
    atn: parseNumberColumn(getValue('atn') as string | number) || undefined,
    inboundTime: parseTimeColumn(getValue('inboundTime') as string | number) || undefined,
    outboundTime: parseTimeColumn(getValue('outboundTime') as string | number) || undefined,
    handleTime: parseTimeColumn(getValue('handleTime') as string | number) || undefined,
  };
}

/**
 * Valida una fila parseada
 */
export function validateParsedRow(row: ParsedOperationsRow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // El nombre del agente es obligatorio
  if (!row.agentName || row.agentName.trim() === '') {
    errors.push('Falta nombre del agente');
  }

  // Función auxiliar para validar números
  const validateNonNegative = (value: string | number | undefined, name: string) => {
    if (value === undefined || value === null) return;
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof numValue === 'number' && numValue < 0) {
      errors.push(`${name} no puede ser negativo`);
    }
  };

  // Validar tiempos no negativos
  validateNonNegative(row._rawLoginTimeSeconds, 'Login time');
  validateNonNegative(row._rawContinuousLoginTimeSeconds, 'Continuous Login time');
  validateNonNegative(row.tmo, 'TMO');
  validateNonNegative(row.break, 'Break');
  validateNonNegative(row.acw, 'ACW');
  validateNonNegative(row.hold, 'Hold');

  // Validar contadores no negativos
  if (row.transfers !== undefined && row.transfers < 0) {
    errors.push('Transfers no puede ser negativo');
  }

  if (row.atn !== undefined && row.atn < 0) {
    errors.push('ATN no puede ser negativo');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Procesa un archivo CSV/Excel y devuelve las filas parseadas
 */
export async function processOperationsFile(file: File): Promise<{
  success: boolean;
  data?: ParsedOperationsRow[];
  errors?: Array<{ row: number; error: string }>;
  columns?: string[];
}> {
  try {
    // Leer el archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let workbook: XLSX.WorkBook;
    let worksheet: XLSX.WorkSheet;

    // Determinar si es Excel o CSV
    if (file.name.endsWith('.csv')) {
      // Para CSV, usar el parser CSV de XLSX
      workbook = XLSX.read(buffer, { type: 'buffer' });
      worksheet = workbook.Sheets[workbook.SheetNames[0]];
    } else {
      // Para Excel (.xlsx, .xls)
      workbook = XLSX.read(buffer, { type: 'buffer' });
      worksheet = workbook.Sheets[workbook.SheetNames[0]];
    }

    // Convertir a JSON
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: '', // Valor por defecto para celdas vacías
      raw: false, // Obtener valores como strings
    });

    if (rawData.length === 0) {
      return {
        success: false,
        errors: [{ row: 0, error: 'El archivo está vacío' }],
      };
    }

    // Obtener encabezados
    const headers = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 })[0] as string[];

    // Mapear columnas
    const columnMapping = mapCSVColumns(headers);

    // Verificar que tengamos columnas mínimas
    if (!columnMapping.agentName && !columnMapping.employeeId) {
      return {
        success: false,
        errors: [{ row: 0, error: 'No se encontraron columnas de nombre o legajo de agente' }],
      };
    }

    // Parsear filas
    const parsedRows: ParsedOperationsRow[] = [];
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const parsedRow = parseCSVRow(row, columnMapping);
      const validation = validateParsedRow(parsedRow);

      if (validation.valid) {
        parsedRows.push(parsedRow);
      } else {
        errors.push({
          row: i + 2, // +2 por headers y 1-indexed
          error: validation.errors.join(', '),
        });
      }
    }

    return {
      success: true,
      data: parsedRows,
      errors: errors.length > 0 ? errors : undefined,
      columns: headers,
    };
  } catch (error) {
    return {
      success: false,
      errors: [{ row: 0, error: error instanceof Error ? error.message : 'Error al procesar archivo' }],
    };
  }
}

/**
 * Busca un agente por employee_id o por nombre (fallback)
 */
export async function findAgentByEmployeeIdOrName(
  employeeId: string | undefined,
  agentName: string
): Promise<{ id: string; employeeId: string | null; isNew: boolean } | null> {
  // Esta función se implementará en el servicio usando Prisma
  // Aquí solo definimos la interfaz
  return null;
}
