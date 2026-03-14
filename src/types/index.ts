import { Role, RequestStatus, RequestType, WeekDay } from '@prisma/client';

// Tipos extendidos de Prisma
export type UserRole = Role;
export type RequestStatusType = RequestStatus;
export type RequestTypeEnum = RequestType;
export type WeekDayType = WeekDay;

// Usuario extendido
export type UserWithTeam = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  team: {
    id: string;
    name: string;
  } | null;
  weeklyDayOff: WeekDay | null;
  createdAt: Date;
};

// Usuario con equipo completo
export type UserWithFullTeam = UserWithTeam & {
  team: {
    id: string;
    name: string;
    description: string | null;
    leaderId: string;
  };
};

// Horario con usuario
export type ScheduleWithUser = {
  id: string;
  timeRange: string;
  validFrom: Date;
  validTo: Date | null;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
};

// Break con usuario
export type BreakWithUser = {
  id: string;
  type: string;
  timeRange: string | null;
  dayOfWeek: WeekDay | null;
  weeklyTime: string | null;
  duration: number | null;
  validFrom: Date;
  validTo: Date | null;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
};

// Solicitud con relaciones
export type RequestWithRelations = {
  id: string;
  type: RequestType;
  targetDate: Date;
  currentSchedule: string | null;
  requestedSchedule: string | null;
  reason: string | null;
  status: RequestStatus;
  comment: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  requester: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    team: {
      id: string;
      name: string;
    } | null;
  };
  involvedAgent: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

// Notificación
export type NotificationType = {
  id: string;
  type: string;
  title: string;
  message: string;
  requestId: string | null;
  read: boolean;
  createdAt: Date;
};

// DTOs
export interface CreateRequestDTO {
  type: RequestType;
  targetDate: string;
  involvedAgentId?: string;
  currentSchedule?: string;
  requestedSchedule: string;
  reason?: string;
}

export interface UpdateRequestDTO {
  status: RequestStatus;
  comment?: string;
}

export interface ScheduleFromExcel {
  nombre: string;
  apellido: string;
  email: string;
  equipo: string;
  lider: string;
  dia_franco: string;
  horario_break: string;
  horario_trabajo?: string;
  fecha_vigencia_desde: string;
  fecha_vigencia_hasta?: string;
}

export interface ExcelValidationResult {
  valid: boolean;
  errors: Array<{ row: number; field: string; message: string }>;
  data?: ScheduleFromExcel[];
}

export interface TeamMemberInfo {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  weeklyDayOff: WeekDay | null;
  scheduleTime: string | null;
  breakType: string | null;
  breakTime: string | null;
  breakDay: WeekDay | null;
}

// Dashboard stats
export interface LeaderDashboardStats {
  totalMembers: number;
  pendingRequests: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
}

export interface AgentScheduleInfo {
  teamName: string;
  weeklyDayOff: WeekDay | null;
  scheduleTime: string | null;
  breakType: string | null;
  breakTime: string | null;
  breakDay: WeekDay | null;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Excel column names (configurables)
export const EXCEL_COLUMNS = {
  NOMBRE: 'nombre',
  APELLIDO: 'apellido',
  EMAIL: 'email',
  EQUIPO: 'equipo',
  LIDER: 'lider',
  DIA_FRANCO: 'dia_franco',
  HORARIO_BREAK: 'horario_break',
  HORARIO_TRABAJO: 'horario_trabajo',
  FECHA_VIGENCIA_DESDE: 'fecha_vigencia_desde',
  FECHA_VIGENCIA_HASTA: 'fecha_vigencia_hasta',
} as const;
