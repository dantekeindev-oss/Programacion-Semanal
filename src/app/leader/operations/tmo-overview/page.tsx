'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import LeaderNavigation from '@/components/leader/LeaderNavigation';
import { EnrichedMetric, formatSeconds } from '@/types/operations';

export const dynamic = 'force-dynamic';

export default function TMOOverviewPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<EnrichedMetric[]>([]);
  const [ranking, setRanking] = useState<EnrichedMetric[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // Filtros
  const [selectedIsland, setSelectedIsland] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Lista de skills disponibles
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const fetchData = async (filters?: { islandId?: string; skill?: string; status?: string }) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.islandId) params.append('islandId', filters.islandId);
      if (filters?.skill) params.append('skill', filters.skill);
      if (filters?.status) params.append('status', filters.status);

      const response = await fetch(`/api/leader/operations/tmo-overview?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setMetrics(data.data.metrics);
        setRanking(data.data.ranking);
        setSummary(data.data.summary);

        // Extraer skills únicos
        const skills = [...new Set(data.data.metrics.map((m: EnrichedMetric) => m.skillRaw).filter(Boolean) as string[])];
        setAvailableSkills(skills);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchData({
      islandId: selectedIsland || undefined,
      skill: selectedSkill || undefined,
      status: selectedStatus || undefined,
    });
  };

  const clearFilters = () => {
    setSelectedIsland('');
    setSelectedSkill('');
    setSelectedStatus('');
    fetchData();
  };

  const getTMOStatus = (metric: EnrichedMetric): 'healthy' | 'warning' | 'critical' => {
    if (!metric.compliance) return 'healthy';
    return metric.compliance.tmo.status;
  };

  const getStatusColor = (status: 'healthy' | 'warning' | 'critical'): string => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-25 via-white to-primary-50">
      <LeaderNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-lg shadow-orange-200">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient-blue">TMO General</h1>
                <p className="text-slate-600 mt-1">
                  Vista global de todos los agentes
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={() => window.history.back()}
            >
              ← Volver
            </Button>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="corporate-stat-card">
              <CardBody>
                <p className="text-sm text-slate-500 font-medium">Total Agentes</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{summary.total}</p>
                <p className="text-xs text-slate-500 mt-2">{summary.withTmo} con métricas</p>
              </CardBody>
            </Card>

            <Card className="corporate-stat-card">
              <CardBody>
                <p className="text-sm text-slate-500 font-medium">TMO Promedio</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{formatSeconds(summary.averageTmo)}</p>
              </CardBody>
            </Card>

            <Card className="corporate-stat-card">
              <CardBody>
                <p className="text-sm text-slate-500 font-medium">TMO Crítico</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {metrics.filter(m => getTMOStatus(m) === 'critical').length}
                </p>
              </CardBody>
            </Card>

            <Card className="corporate-stat-card">
              <CardBody>
                <p className="text-sm text-slate-500 font-medium">TMO Alerta</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">
                  {metrics.filter(m => getTMOStatus(m) === 'warning').length}
                </p>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Skill</label>
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-400 bg-white"
                >
                  <option value="">Todos</option>
                  {availableSkills.map(skill => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Estado</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-400 bg-white"
                >
                  <option value="">Todos</option>
                  <option value="READY">Ready</option>
                  <option value="NOT_READY">Not Ready</option>
                  <option value="CallInbound">En Llamada</option>
                  <option value="ACW">ACW</option>
                  <option value="Break">Break</option>
                  <option value="LoggedOut">Logged Out</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleFilter}>Filtrar</Button>
                <Button variant="secondary" onClick={clearFilters}>Limpiar</Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Ranking - Peores TMO */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-900">Ranking TMO (Top 20)</h2>
            <p className="text-sm text-slate-500">Agentes con mayor TMO</p>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {ranking.slice(0, 10).map((metric, index) => (
                <div
                  key={metric.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-primary-25/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-red-500 text-white' :
                      index === 1 ? 'bg-orange-500 text-white' :
                      index === 2 ? 'bg-yellow-500 text-white' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {metric.agent?.firstName} {metric.agent?.lastName}
                      </p>
                      <p className="text-sm text-slate-500">{metric.agent?.employeeId || metric.employeeId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getTMOStatus(metric) === 'critical' ? 'danger' : getTMOStatus(metric) === 'warning' ? 'warning' : 'success'}>
                      {formatSeconds(metric.tmoSeconds)}
                    </Badge>
                    <span className="text-sm text-slate-500">
                      {metric.attendedCallsCount || 0} ATN
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Tabla completa */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-900">
              Todos los Agentes ({metrics.length})
            </h2>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Agente</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Líder</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Skill</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Estado</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">TMO</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Break</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">ACW</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">ATN</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric) => (
                    <tr
                      key={metric.id}
                      className="border-b border-slate-100 hover:bg-primary-25/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {metric.agent?.firstName} {metric.agent?.lastName}
                          </p>
                          <p className="text-sm text-slate-500">
                            {metric.agent?.employeeId || metric.employeeId || '-'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {metric.leaderNameRaw || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="info" className="text-xs">
                          {metric.skillRaw || '-'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            metric.currentStatus === 'READY' ? 'success' :
                            metric.currentStatus === 'CallInbound' ? 'info' :
                            'default'
                          }
                          className="text-xs"
                        >
                          {metric.currentStatus || 'Sin datos'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(getTMOStatus(metric))}`}>
                          {formatSeconds(metric.tmoSeconds)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-slate-600">
                        {formatSeconds(metric.breakSeconds)}
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-slate-600">
                        {formatSeconds(metric.acwSeconds)}
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-slate-600">
                        {metric.attendedCallsCount || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
