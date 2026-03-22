// ============================================
// TIPOS PARA MÓDULO DE MÉTRICAS OPERATIVAS
// ============================================

import { WeekDay } from '@prisma/client';

// ============================================
// ESTADOS Y UMBRALES
// ============================================

export type MetricStatus = 'healthy' | 'warning' | 'critical';

export interface ThresholdEvaluation {
  status: MetricStatus;
  value: number;
  target: number;
  warning: number;
  critical: number;
  percentage?: number; // Porcentaje de cumplimiento
  diff?: number; // Diferencia con el objetivo
}

// ============================================
// ISLAS Y UMBRALES
// ============================================

export interface Island {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  threshold: IslandThreshold | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IslandThreshold {
  id: string;
  islandId: string;
  // TMO en segundos
  targetTmo: number;
  warningTmo: number;
  criticalTmo: number;
  // Break en segundos
  targetBreak: number;
  warningBreak: number;
  criticalBreak: number;
  // ACW en segundos
  targetAcw: number;
  warningAcw: number;
  criticalAcw: number;
  // Hold en segundos
  targetHold: number;
  warningHold: number;
  criticalHold: number;
  // Adherencia en porcentaje
  targetAdherence: number;
  warningAdherence: number;
  criticalAdherence: number;
}

export interface IslandFormData {
  name: string;
  code?: string;
  description?: string;
}

export interface IslandThresholdFormData {
  targetTmo: number;
  warningTmo: number;
  criticalTmo: number;
  targetBreak: number;
  warningBreak: number;
  criticalBreak: number;
  targetAcw: number;
  warningAcw: number;
  criticalAcw: number;
  targetHold: number;
  warningHold: number;
  criticalHold: number;
  targetAdherence: number;
  warningAdherence: number;
  criticalAdherence: number;
}

// ============================================
// UPLOAD DE CSV OPERATIVO
// ============================================

export type UploadStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface OperationsUpload {
  id: string;
  uploadedByUserId: string;
  uploadedByUser: {
    id: string;
    name: string | null;
    email: string;
  };
  originalFilename: string;
  processedAt: Date | null;
  status: UploadStatus;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  notes: string | null;
  createdAt: Date;
}

// ============================================
// MÉTRICAS OPERATIVAS
// ============================================

export interface OperationsMetric {
  id: string;
  uploadId: string;
  employeeId: string | null;
  agent: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    employeeId: string | null;
  } | null;
  agentNameRaw: string | null;
  leaderNameRaw: string | null;
  skillRaw: string | null;
  currentStatus: string | null;
  timeInStatusSeconds: number | null;
  loginTimeSeconds: number | null;
  continuousLoginTimeSeconds: number | null;
  tmoSeconds: number | null;
  breakSeconds: number | null;
  coachingSeconds: number | null;
  acwSeconds: number | null;
  holdSeconds: number | null;
  transfersCount: number | null;
  attendedCallsCount: number | null;
  inboundTimeSeconds: number | null;
  outboundTimeSeconds: number | null;
  handleTimeSeconds: number | null;
  rawPayloadJson: Record<string, unknown> | null;
  createdAt: Date;
}

// Métrica enriquecida con umbrales y cumplimiento
export interface EnrichedMetric extends OperationsMetric {
  island?: Island | null;
  threshold?: IslandThreshold | null;
  compliance?: {
    tmo: ThresholdEvaluation;
    break: ThresholdEvaluation;
    acw: ThresholdEvaluation;
    hold: ThresholdEvaluation;
  };
}

// ============================================
// OBJETIVOS INDIVIDUALES
// ============================================

export interface AgentGoal {
  id: string;
  leaderId: string;
  leader: {
    id: string;
    name: string | null;
    email: string;
  };
  agentEmployeeId: string;
  agent: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    employeeId: string | null;
  };
  periodMonth: number;
  periodYear: number;
  targetTmoSeconds: number | null;
  targetFcr: number | null;
  targetNps: number | null;
  targetRel: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentGoalFormData {
  agentEmployeeId: string;
  periodMonth: number;
  periodYear: number;
  targetTmoSeconds?: number;
  targetFcr?: number;
  targetNps?: number;
  targetRel?: number;
}

// ============================================
// CSV PARSING
// ============================================

export interface ParsedOperationsRow {
  // Identificación
  employeeId?: string;
  agentName: string;
  leaderName?: string;
  skill?: string;

  // Estado
  currentStatus?: string;
  timeInStatusSeconds?: number;

  // Tiempos (varios formatos posibles)
  loginTime?: string | number; // "HH:MM:SS" o segundos
  continuousLoginTime?: string | number;
  tmo?: string | number;
  break?: string | number;
  coaching?: string | number;
  acw?: string | number;
  hold?: string | number;

  // Contadores
  transfers?: number;
  atn?: number; // Llamadas atendidas

  // Tiempos de llamada
  inboundTime?: string | number;
  outboundTime?: string | number;
  handleTime?: string | number;

  // Ayuda para el parser
  _rawLoginTimeSeconds?: number;
  _rawContinuousLoginTimeSeconds?: number;
}

export interface CSVUploadResult {
  success: boolean;
  message: string;
  data?: {
    uploadId: string;
    processed: number;
    created: number;
    updated: number;
    errors: Array<{ row: number; employeeId?: string; error: string }>;
  };
}

// ============================================
// DASHBOARD KPIs
// ============================================

export interface TeamKPIs {
  totalAgents: number;
  activeAgents: number;
  averageTmo: number;
  averageBreak: number;
  averageAcw: number;
  averageHold: number;
  totalCalls: number;
  averageAdherence: number;
  agentsByStatus: Record<string, number>;
  agentsWithTmoWarning: number;
  agentsWithTmoCritical: number;
}

export interface AgentDashboardData {
  agent: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    employeeId: string | null;
    skill: string | null;
    island?: Island | null;
  };
  metrics: OperationsMetric | null;
  goals: AgentGoal | null;
  threshold: IslandThreshold | null;
  compliance: {
    tmo: ThresholdEvaluation;
    break: ThresholdEvaluation;
    acw: ThresholdEvaluation;
    hold: ThresholdEvaluation;
    fcr?: ThresholdEvaluation;
    nps?: ThresholdEvaluation;
    rel?: ThresholdEvaluation;
  } | null;
}

// ============================================
// FILTROS
// ============================================

export interface DashboardFilters {
  islandId?: string;
  skill?: string;
  status?: string;
  leaderId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// ============================================
// MAPA DE COLUMNAS CSV
// ============================================

export type CSVColumnMapping = Record<string, string[]>;

export const DEFAULT_COLUMN_MAPPINGS: CSVColumnMapping = {
  employeeId: ['Employee Id', 'EmployeeId', 'Agent Id', 'Legajo', 'ID', 'employee_id', 'agent_id'],
  agentName: ['Nombre', 'Agent Name', 'Agente', 'Name', 'Agent', 'nombre', 'agente'],
  leaderName: ['Leader', 'Lider', 'Supervisor', 'Líder', 'Jefe', 'leader', 'supervisor'],
  skill: ['Skill', 'Campaign', 'Campaña', 'skill', 'campaign'],
  currentStatus: ['Current Status', 'Status', 'Estado actual', 'Estado', 'State', 'status', 'current_status', 'estado'],
  tmo: ['TMO', 'AHT', 'Average Handle Time', 'Tiempo Medio', 'tmo', 'aht'],
  break: ['Break', 'DESCANSO', 'Break Time', 'break'],
  coaching: ['Coaching', 'COACHING', 'Coach', 'coaching'],
  acw: ['ACW', 'After Call Work', 'Post Llamada', 'acw'],
  hold: ['Hold', 'Espera', 'Hold Time', 'hold'],
  transfers: ['Transferencias', 'Transfers', 'Transfer', 'transfers'],
  atn: ['Llamadas', 'ATN', 'Answered Calls', 'Calls', 'atn', 'answered_calls'],
  loginTime: ['Login Time', 'Tiempo Login', 'Logueado', 'login_time'],
  continuousLoginTime: ['Continuous Login Time', 'Login Continuo', 'continuous_login'],
  inboundTime: ['Tiempo In', 'Inbound', 'Entrantes', 'Inbound Time', 'inbound'],
  outboundTime: ['Tiempo Out', 'Outbound', 'Salientes', 'Outbound Time', 'outbound', 'Llamadas salientes'],
  handleTime: ['Handle Time', 'Tiempo Manejo', 'handle_time'],
  timeInStatus: ['Time in Status', 'Tiempo en Estado', 'time_in_status'],
  auxiliares: ['Auxiliares', 'Auxiliary', 'auxiliares'],
  readyTime: ['Ready Time', 'Tiempo Ready', 'ready_time'],
  tareasAdministrativas: ['Tareas Administrativas', 'Administrativas', 'administrative_tasks'],
};

// ============================================
// UTILIDADES
// ============================================

export function formatSeconds(seconds: number | null | undefined): string {
  if (seconds == null) return '-';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function parseTimeToSeconds(time: string | number): number {
  if (typeof time === 'number') return time;

  // Formato HH:MM:SS o H:MM:SS o HH:MM
  const parts = time.split(':').map(p => parseInt(p, 10));

  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  }

  return 0;
}

export function evaluateThreshold(
  value: number | null,
  target: number,
  warning: number,
  critical: number,
  lowerIsBetter = true
): ThresholdEvaluation {
  const v = value ?? 0;

  let status: MetricStatus = 'healthy';
  if (lowerIsBetter) {
    if (v >= critical) status = 'critical';
    else if (v >= warning) status = 'warning';
  } else {
    if (v <= critical) status = 'critical';
    else if (v <= warning) status = 'warning';
  }

  const percentage = target > 0 ? (target / v) * 100 : 0;
  const diff = v - target;

  return {
    status,
    value: v,
    target,
    warning,
    critical,
    percentage: Math.round(percentage * 10) / 10,
    diff,
  };
}
