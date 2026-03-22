'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AgentDashboardData, formatSeconds } from '@/types/operations';

export const dynamic = 'force-dynamic';

export default function AgentMetricsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<AgentDashboardData | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/agent/operations/dashboard');
      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: 'healthy' | 'warning' | 'critical' | undefined): string => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'critical' | undefined): string => {
    switch (status) {
      case 'healthy':
        return '✓';
      case 'warning':
        return '⚠';
      case 'critical':
        return '✗';
      default:
        return '-';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-25 via-white to-primary-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary-200 border-t-primary-600"></div>
          <p className="text-slate-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-25 via-white to-primary-50 flex items-center justify-center">
        <Card>
          <CardBody>
            <p className="text-slate-600">No hay datos disponibles. Contacta a tu líder.</p>
            <Link href="/agent/dashboard" className="block mt-4 text-primary-600">
              ← Volver al dashboard
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  const { agent, metrics, goals, compliance } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-25 via-white to-primary-50">
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                {agent.firstName?.[0] || agent.name?.[0] || 'U'}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {agent.firstName} {agent.lastName}
                </p>
                <p className="text-xs text-primary-600 font-medium">Métricas Operativas</p>
              </div>
            </div>

            <Link
              href="/agent/dashboard"
              className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors px-3 py-2 rounded-xl hover:bg-primary-50"
            >
              ← Volver
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gradient-blue">Mi Desempeño</h1>
          <p className="text-slate-600 mt-1">
            Tus métricas operativas en tiempo real
          </p>
        </div>

        {/* Estado actual */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Card de estado actual */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-900">Estado Actual</h2>
            </CardHeader>
            <CardBody>
              {metrics ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-primary-25 text-center">
                    <p className="text-sm text-slate-600 mb-1">Estado</p>
                    <Badge
                      variant={
                        metrics.currentStatus === 'READY' ? 'success' :
                        metrics.currentStatus === 'CallInbound' ? 'info' :
                        'default'
                      }
                    >
                      {metrics.currentStatus || 'Sin datos'}
                    </Badge>
                  </div>

                  <div className="p-4 rounded-xl bg-primary-25 text-center">
                    <p className="text-sm text-slate-600 mb-1">Tiempo en estado</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatSeconds(metrics.timeInStatusSeconds)}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-primary-25 text-center">
                    <p className="text-sm text-slate-600 mb-1">Tiempo logueado</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatSeconds(metrics.loginTimeSeconds)}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-primary-25 text-center">
                    <p className="text-sm text-slate-600 mb-1">Llamadas ATN</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {metrics.attendedCallsCount || 0}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-center py-4">No hay métricas disponibles</p>
              )}
            </CardBody>
          </Card>

          {/* Card de isla/skill */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-900">Mi Info</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500">Employee ID</p>
                  <p className="font-medium text-slate-900">{agent.employeeId || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Skill</p>
                  <Badge variant="info">{agent.skill || '-'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Isla</p>
                  <p className="font-medium text-slate-900">{agent.island?.name || '-'}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* TMO */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-500 font-medium">TMO</p>
                {compliance?.tmo.status && (
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${getStatusColor(compliance.tmo.status)}`}>
                    {getStatusIcon(compliance.tmo.status)}
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">
                {metrics ? formatSeconds(metrics.tmoSeconds) : '-'}
              </p>
              {compliance?.tmo && (
                <div className="text-xs text-slate-500">
                  Objetivo: {formatSeconds(compliance.tmo.target)}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Break */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-500 font-medium">Break</p>
                {compliance?.break.status && (
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${getStatusColor(compliance.break.status)}`}>
                    {getStatusIcon(compliance.break.status)}
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">
                {metrics ? formatSeconds(metrics.breakSeconds) : '-'}
              </p>
              {compliance?.break && (
                <div className="text-xs text-slate-500">
                  Objetivo: {formatSeconds(compliance.break.target)}
                </div>
              )}
            </CardBody>
          </Card>

          {/* ACW */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-500 font-medium">ACW</p>
                {compliance?.acw.status && (
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${getStatusColor(compliance.acw.status)}`}>
                    {getStatusIcon(compliance.acw.status)}
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">
                {metrics ? formatSeconds(metrics.acwSeconds) : '-'}
              </p>
              {compliance?.acw && (
                <div className="text-xs text-slate-500">
                  Objetivo: {formatSeconds(compliance.acw.target)}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Hold */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-500 font-medium">Hold</p>
                {compliance?.hold.status && (
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${getStatusColor(compliance.hold.status)}`}>
                    {getStatusIcon(compliance.hold.status)}
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">
                {metrics ? formatSeconds(metrics.holdSeconds) : '-'}
              </p>
              {compliance?.hold && (
                <div className="text-xs text-slate-500">
                  Objetivo: {formatSeconds(compliance.hold.target)}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Objetivos */}
        {goals && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-900">Mis Objetivos</h2>
              <p className="text-sm text-slate-500">
                Período: {goals.periodMonth}/{goals.periodYear}
              </p>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {goals.targetTmoSeconds && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium mb-1">TMO Objetivo</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatSeconds(goals.targetTmoSeconds)}
                    </p>
                  </div>
                )}

                {goals.targetFcr && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                    <p className="text-sm text-green-600 font-medium mb-1">FCR Objetivo</p>
                    <p className="text-2xl font-bold text-green-900">
                      {goals.targetFcr}%
                    </p>
                  </div>
                )}

                {goals.targetNps && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium mb-1">NPS Objetivo</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {goals.targetNps}
                    </p>
                  </div>
                )}

                {goals.targetRel && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                    <p className="text-sm text-orange-600 font-medium mb-1">REL Objetivo</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {goals.targetRel}%
                    </p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Semáforo de cumplimiento */}
        {compliance && (
          <Card className="mt-6">
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-900">Semáforo de Cumplimiento</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl border-2 ${getStatusColor(compliance.tmo.status)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">TMO</span>
                    <span className="text-2xl">{getStatusIcon(compliance.tmo.status)}</span>
                  </div>
                  <p className="text-sm opacity-75">
                    Actual: {formatSeconds(compliance.tmo.value)} | Objetivo: {formatSeconds(compliance.tmo.target)}
                  </p>
                </div>

                <div className={`p-4 rounded-xl border-2 ${getStatusColor(compliance.break.status)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Break</span>
                    <span className="text-2xl">{getStatusIcon(compliance.break.status)}</span>
                  </div>
                  <p className="text-sm opacity-75">
                    Actual: {formatSeconds(compliance.break.value)} | Objetivo: {formatSeconds(compliance.break.target)}
                  </p>
                </div>

                <div className={`p-4 rounded-xl border-2 ${getStatusColor(compliance.acw.status)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">ACW</span>
                    <span className="text-2xl">{getStatusIcon(compliance.acw.status)}</span>
                  </div>
                  <p className="text-sm opacity-75">
                    Actual: {formatSeconds(compliance.acw.value)} | Objetivo: {formatSeconds(compliance.acw.target)}
                  </p>
                </div>

                <div className={`p-4 rounded-xl border-2 ${getStatusColor(compliance.hold.status)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Hold</span>
                    <span className="text-2xl">{getStatusIcon(compliance.hold.status)}</span>
                  </div>
                  <p className="text-sm opacity-75">
                    Actual: {formatSeconds(compliance.hold.value)} | Objetivo: {formatSeconds(compliance.hold.target)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
