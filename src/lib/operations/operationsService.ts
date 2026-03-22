// ============================================
// SERVICIO DE MÉTRICAS OPERATIVAS
// ============================================

import { prisma } from '@/lib/prisma';
import { EnrichedMetric, OperationsMetric, ThresholdEvaluation, TeamKPIs, AgentDashboardData } from '@/types/operations';

/**
 * Evalúa un valor contra umbrales y devuelve el estado
 */
export function evaluateThreshold(
  value: number | null,
  target: number,
  warning: number,
  critical: number,
  lowerIsBetter = true
): ThresholdEvaluation {
  const v = value ?? 0;

  let status: 'healthy' | 'warning' | 'critical' = 'healthy';

  if (lowerIsBetter) {
    // Menor es mejor (TMO, Break, ACW, Hold)
    if (v >= critical) status = 'critical';
    else if (v >= warning) status = 'warning';
  } else {
    // Mayor es mejor (Adherencia, FCR, NPS)
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

/**
 * Crea un registro de upload de CSV
 */
export async function createOperationsUpload(
  userId: string,
  filename: string
): Promise<string> {
  const upload = await prisma.operationsUpload.create({
    data: {
      uploadedByUserId: userId,
      originalFilename: filename,
      status: 'PENDING',
    },
  });

  return upload.id;
}

/**
 * Actualiza el estado de un upload
 */
export async function updateUploadStatus(
  uploadId: string,
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED',
  processedAt?: Date,
  totalRows?: number,
  validRows?: number,
  invalidRows?: number,
  notes?: string
): Promise<void> {
  await prisma.operationsUpload.update({
    where: { id: uploadId },
    data: {
      status,
      processedAt,
      totalRows,
      validRows,
      invalidRows,
      notes,
    },
  });
}

/**
 * Guarda una métrica operativa
 */
export async function createOperationsMetric(
  uploadId: string,
  data: {
    employeeId?: string;
    agentNameRaw?: string;
    leaderNameRaw?: string;
    skillRaw?: string;
    currentStatus?: string;
    timeInStatusSeconds?: number;
    loginTimeSeconds?: number;
    continuousLoginTimeSeconds?: number;
    tmoSeconds?: number;
    breakSeconds?: number;
    coachingSeconds?: number;
    acwSeconds?: number;
    holdSeconds?: number;
    transfersCount?: number;
    attendedCallsCount?: number;
    inboundTimeSeconds?: number;
    outboundTimeSeconds?: number;
    handleTimeSeconds?: number;
    rawPayloadJson?: Record<string, unknown>;
  }
): Promise<void> {
  await prisma.operationsMetric.create({
    data: {
      uploadId,
      employeeId: data.employeeId,
      agentNameRaw: data.agentNameRaw,
      leaderNameRaw: data.leaderNameRaw,
      skillRaw: data.skillRaw,
      currentStatus: data.currentStatus,
      timeInStatusSeconds: data.timeInStatusSeconds,
      loginTimeSeconds: data.loginTimeSeconds,
      continuousLoginTimeSeconds: data.continuousLoginTimeSeconds,
      tmoSeconds: data.tmoSeconds,
      breakSeconds: data.breakSeconds,
      coachingSeconds: data.coachingSeconds,
      acwSeconds: data.acwSeconds,
      holdSeconds: data.holdSeconds,
      transfersCount: data.transfersCount,
      attendedCallsCount: data.attendedCallsCount,
      inboundTimeSeconds: data.inboundTimeSeconds,
      outboundTimeSeconds: data.outboundTimeSeconds,
      handleTimeSeconds: data.handleTimeSeconds,
      rawPayloadJson: data.rawPayloadJson as any,
    },
  });
}

/**
 * Obtiene la última métrica de un agente
 */
export async function getLatestMetricByEmployeeId(
  employeeId: string
): Promise<OperationsMetric | null> {
  const metric = await prisma.operationsMetric.findFirst({
    where: { employeeId },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          employeeId: true,
          island: true,
          skill: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return metric as OperationsMetric | null;
}

/**
 * Obtiene métricas enriquecidas para un líder
 */
export async function getTeamMetrics(
  leaderId: string,
  options?: {
    islandId?: string;
    skill?: string;
    status?: string;
    limit?: number;
  }
): Promise<EnrichedMetric[]> {
  const { islandId, skill, status, limit = 100 } = options || {};

  // Obtener agentes del líder
  const agents = await prisma.user.findMany({
    where: {
      leaderId,
      role: 'AGENT',
      ...(islandId && { islandId }),
      ...(skill && { skill }),
    },
    include: {
      island: {
        include: {
          threshold: true,
        },
      },
    },
    take: limit,
  });

  // Obtener últimas métricas de cada agente
  const metrics: EnrichedMetric[] = [];

  for (const agent of agents) {
    const latestMetric = await getLatestMetricByEmployeeId(agent.employeeId || '');

    if (latestMetric) {
      const enriched = await enrichMetric(latestMetric, agent.island?.threshold || null);
      metrics.push(enriched);
    }
  }

  // Filtrar por status si se especificó
  if (status) {
    return metrics.filter(m => m.currentStatus === status);
  }

  return metrics;
}

/**
 * Enriquece una métrica con umbrales y cumplimiento
 */
async function enrichMetric(
  metric: OperationsMetric,
  threshold: any
): Promise<EnrichedMetric> {
  const compliance = threshold ? {
    tmo: evaluateThreshold(
      metric.tmoSeconds,
      threshold.targetTmo,
      threshold.warningTmo,
      threshold.criticalTmo,
      true
    ),
    break: evaluateThreshold(
      metric.breakSeconds,
      threshold.targetBreak,
      threshold.warningBreak,
      threshold.criticalBreak,
      true
    ),
    acw: evaluateThreshold(
      metric.acwSeconds,
      threshold.targetAcw,
      threshold.warningAcw,
      threshold.criticalAcw,
      true
    ),
    hold: evaluateThreshold(
      metric.holdSeconds,
      threshold.targetHold,
      threshold.warningHold,
      threshold.criticalHold,
      true
    ),
  } : undefined;

  return {
    ...metric,
    threshold,
    compliance,
  };
}

/**
 * Calcula KPIs agregados de un equipo
 */
export async function getTeamKPIs(leaderId: string): Promise<TeamKPIs> {
  const metrics = await getTeamMetrics(leaderId);

  const totalAgents = metrics.length;
  const activeAgents = metrics.filter(m =>
    m.currentStatus && ['READY', 'TALKING', 'ACW'].includes(m.currentStatus)
  ).length;

  const validTmo = metrics.filter(m => m.tmoSeconds !== null && m.tmoSeconds !== undefined);
  const validBreak = metrics.filter(m => m.breakSeconds !== null && m.breakSeconds !== undefined);
  const validAcw = metrics.filter(m => m.acwSeconds !== null && m.acwSeconds !== undefined);
  const validHold = metrics.filter(m => m.holdSeconds !== null && m.holdSeconds !== undefined);

  const averageTmo = validTmo.length > 0
    ? validTmo.reduce((sum, m) => sum + (m.tmoSeconds || 0), 0) / validTmo.length
    : 0;

  const averageBreak = validBreak.length > 0
    ? validBreak.reduce((sum, m) => sum + (m.breakSeconds || 0), 0) / validBreak.length
    : 0;

  const averageAcw = validAcw.length > 0
    ? validAcw.reduce((sum, m) => sum + (m.acwSeconds || 0), 0) / validAcw.length
    : 0;

  const averageHold = validHold.length > 0
    ? validHold.reduce((sum, m) => sum + (m.holdSeconds || 0), 0) / validHold.length
    : 0;

  const totalCalls = metrics.reduce((sum, m) => sum + (m.attendedCallsCount || 0), 0);

  // Agrupar por estado
  const agentsByStatus: Record<string, number> = {};
  for (const m of metrics) {
    const status = m.currentStatus || 'UNKNOWN';
    agentsByStatus[status] = (agentsByStatus[status] || 0) + 1;
  }

  // Contar agentes con TMO en warning/critical
  const agentsWithTmoWarning = metrics.filter(m =>
    m.compliance?.tmo.status === 'warning'
  ).length;

  const agentsWithTmoCritical = metrics.filter(m =>
    m.compliance?.tmo.status === 'critical'
  ).length;

  // Adherencia promedio (simulada por ahora)
  const averageAdherence = 95.0; // TODO: Implementar cálculo real

  return {
    totalAgents,
    activeAgents,
    averageTmo: Math.round(averageTmo),
    averageBreak: Math.round(averageBreak),
    averageAcw: Math.round(averageAcw),
    averageHold: Math.round(averageHold),
    totalCalls,
    averageAdherence,
    agentsByStatus,
    agentsWithTmoWarning,
    agentsWithTmoCritical,
  };
}

/**
 * Obtiene datos del dashboard de un agente
 */
export async function getAgentDashboardData(agentId: string): Promise<AgentDashboardData | null> {
  const agent = await prisma.user.findUnique({
    where: { id: agentId },
    include: {
      island: {
        include: {
          threshold: true,
        },
      },
    },
  });

  if (!agent) return null;

  const latestMetric = await getLatestMetricByEmployeeId(agent.employeeId || '');

  // Obtener objetivo activo del período actual
  const now = new Date();
  const currentGoal = await prisma.agentGoal.findFirst({
    where: {
      agentEmployeeId: agent.employeeId || '',
      periodMonth: now.getMonth() + 1,
      periodYear: now.getFullYear(),
      isActive: true,
    },
    include: {
      leader: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const threshold = agent.island?.threshold || null;

  const compliance = latestMetric && threshold ? {
    tmo: evaluateThreshold(
      latestMetric.tmoSeconds,
      threshold.targetTmo,
      threshold.warningTmo,
      threshold.criticalTmo,
      true
    ),
    break: evaluateThreshold(
      latestMetric.breakSeconds,
      threshold.targetBreak,
      threshold.warningBreak,
      threshold.criticalBreak,
      true
    ),
    acw: evaluateThreshold(
      latestMetric.acwSeconds,
      threshold.targetAcw,
      threshold.warningAcw,
      threshold.criticalAcw,
      true
    ),
    hold: evaluateThreshold(
      latestMetric.holdSeconds,
      threshold.targetHold,
      threshold.warningHold,
      threshold.criticalHold,
      true
    ),
  } : null;

  return {
    agent: {
      id: agent.id,
      name: agent.name,
      firstName: agent.firstName,
      lastName: agent.lastName,
      email: agent.email,
      employeeId: agent.employeeId,
      skill: agent.skill,
      island: agent.island,
    },
    metrics: latestMetric,
    goals: currentGoal as any || null,
    threshold,
    compliance,
  };
}

/**
 * Obtiene métricas para vista TMO general (todos los agentes)
 */
export async function getGeneralTMOOverview(options?: {
  islandId?: string;
  skill?: string;
  leaderId?: string;
  status?: string;
}): Promise<EnrichedMetric[]> {
  const { islandId, skill, leaderId, status } = options || {};

  // Construir where clause
  const where: any = { role: 'AGENT' };

  if (islandId) where.islandId = islandId;
  if (skill) where.skill = skill;
  if (leaderId) where.leaderId = leaderId;

  // Obtener agentes
  const agents = await prisma.user.findMany({
    where,
    include: {
      island: {
        include: {
          threshold: true,
        },
      },
      leader: {
        select: {
          id: true,
          name: true,
          firstName: true,
          email: true,
        },
      },
    },
    orderBy: { employeeId: 'asc' },
  });

  // Obtener últimas métricas
  const metrics: EnrichedMetric[] = [];

  for (const agent of agents) {
    const latestMetric = await getLatestMetricByEmployeeId(agent.employeeId || '');

    if (latestMetric) {
      const enriched = await enrichMetric(latestMetric, agent.island?.threshold || null);
      metrics.push(enriched);
    } else {
      // Agente sin métricas
      metrics.push({
        id: '',
        uploadId: '',
        employeeId: agent.employeeId || null,
        agent: {
          id: agent.id,
          name: agent.name,
          firstName: agent.firstName,
          lastName: agent.lastName,
          email: agent.email,
          employeeId: agent.employeeId,
        },
        agentNameRaw: agent.name || null,
        leaderNameRaw: agent.leader?.name || null,
        skillRaw: agent.skill || null,
        currentStatus: null,
        timeInStatusSeconds: null,
        loginTimeSeconds: null,
        continuousLoginTimeSeconds: null,
        tmoSeconds: null,
        breakSeconds: null,
        coachingSeconds: null,
        acwSeconds: null,
        holdSeconds: null,
        transfersCount: null,
        attendedCallsCount: null,
        inboundTimeSeconds: null,
        outboundTimeSeconds: null,
        handleTimeSeconds: null,
        rawPayloadJson: null,
        createdAt: new Date(),
      } as EnrichedMetric);
    }
  }

  // Filtrar por status si se especificó
  if (status) {
    return metrics.filter(m => m.currentStatus === status);
  }

  return metrics;
}

/**
 * Guarda o actualiza un objetivo individual
 */
export async function upsertAgentGoal(
  leaderId: string,
  data: {
    agentEmployeeId: string;
    periodMonth: number;
    periodYear: number;
    targetTmoSeconds?: number;
    targetFcr?: number;
    targetNps?: number;
    targetRel?: number;
  }
): Promise<void> {
  await prisma.agentGoal.upsert({
    where: {
      leaderId_agentEmployeeId_periodMonth_periodYear: {
        leaderId,
        agentEmployeeId: data.agentEmployeeId,
        periodMonth: data.periodMonth,
        periodYear: data.periodYear,
      },
    },
    create: {
      leaderId,
      agentEmployeeId: data.agentEmployeeId,
      periodMonth: data.periodMonth,
      periodYear: data.periodYear,
      targetTmoSeconds: data.targetTmoSeconds,
      targetFcr: data.targetFcr,
      targetNps: data.targetNps,
      targetRel: data.targetRel,
    },
    update: {
      targetTmoSeconds: data.targetTmoSeconds,
      targetFcr: data.targetFcr,
      targetNps: data.targetNps,
      targetRel: data.targetRel,
    },
  });
}

/**
 * Obtiene objetivos de agentes de un líder
 */
export async function getLeaderAgentGoals(
  leaderId: string,
  periodMonth?: number,
  periodYear?: number
): Promise<any[]> {
  const where: any = { leaderId };

  if (periodMonth) where.periodMonth = periodMonth;
  if (periodYear) where.periodYear = periodYear;

  const goals = await prisma.agentGoal.findMany({
    where,
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          employeeId: true,
          skill: true,
        },
      },
    },
    orderBy: [
      { periodYear: 'desc' },
      { periodMonth: 'desc' },
      { agent: { name: 'asc' } },
    ],
  });

  return goals as any[];
}
