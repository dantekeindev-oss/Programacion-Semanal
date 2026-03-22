'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import LeaderNavigation from '@/components/leader/LeaderNavigation';
import {
  TeamKPIs,
  EnrichedMetric,
  OperationsUpload,
  formatSeconds,
} from '@/types/operations';

export const dynamic = 'force-dynamic';

type MetricStatus = 'healthy' | 'warning' | 'critical';

export default function LeaderOperationsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Datos del dashboard
  const [kpis, setKpis] = useState<TeamKPIs | null>(null);
  const [metrics, setMetrics] = useState<EnrichedMetric[]>([]);
  const [uploads, setUploads] = useState<OperationsUpload[]>([]);

  // Filtros
  const [selectedIsland, setSelectedIsland] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Modales
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showTMOModal, setShowTMOModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<EnrichedMetric | null>(null);

  // Upload
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
      fetchUploads();
    }
  }, [session]);

  const fetchDashboardData = async (filters?: { islandId?: string; skill?: string; status?: string }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.islandId) params.append('islandId', filters.islandId);
      if (filters?.skill) params.append('skill', filters.skill);
      if (filters?.status) params.append('status', filters.status);

      const response = await fetch(`/api/leader/operations/dashboard?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setKpis(data.data.kpis);
        setMetrics(data.data.metrics);

        // Extraer valores únicos para filtros
        const skills = [...new Set(data.data.metrics.map((m: EnrichedMetric) => m.skillRaw).filter(Boolean))];
        // Actualizar filtros disponibles si es necesario
      }
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUploads = async () => {
    try {
      const response = await fetch('/api/leader/operations/upload');
      const data = await response.json();

      if (data.success) {
        setUploads(data.data);
      }
    } catch (error) {
      console.error('Error al cargar uploads:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Por favor selecciona un archivo');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/leader/operations/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadResult(data);
        // Recargar dashboard
        fetchDashboardData();
        fetchUploads();
      } else {
        alert(data.error || 'Error al subir archivo');
      }
    } catch (error) {
      alert('Error al subir archivo');
    } finally {
      setUploading(false);
    }
  };

  const getTMOStatus = (metric: EnrichedMetric): MetricStatus => {
    if (!metric.compliance) return 'healthy';
    return metric.compliance.tmo.status;
  };

  const getStatusColor = (status: MetricStatus): string => {
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

  const getStatusIcon = (status: MetricStatus): string => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-25 via-white to-primary-50">
      <LeaderNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-200">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient-blue">Métricas Operativas</h1>
                <p className="text-slate-600 mt-1">
                  Monitorea el desempeño de tu equipo
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowTMOModal(true)}
              >
                <span className="mr-2">📊</span>
                TMO General
              </Button>
              <Button
                onClick={() => setShowUploadModal(true)}
              >
                <span className="mr-2">📥</span>
                Cargar CSV
              </Button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="corporate-stat-card">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Total Agentes</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{kpis.totalAgents}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl">
                    👥
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">{kpis.activeAgents} activos</p>
              </CardBody>
            </Card>

            <Card className="corporate-stat-card">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">TMO Promedio</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{formatSeconds(kpis.averageTmo)}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl ${
                    kpis.averageTmo > 420 ? 'bg-gradient-to-br from-red-500 to-red-600' :
                    kpis.averageTmo > 360 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                    'bg-gradient-to-br from-green-500 to-green-600'
                  }`}>
                    ⏱️
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  {kpis.agentsWithTmoCritical} críticos, {kpis.agentsWithTmoWarning} alerta
                </p>
              </CardBody>
            </Card>

            <Card className="corporate-stat-card">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Llamadas ATN</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{kpis.totalCalls}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-xl">
                    📞
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">Total atendidas</p>
              </CardBody>
            </Card>

            <Card className="corporate-stat-card">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Adherencia</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{kpis.averageAdherence.toFixed(1)}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-xl">
                    🎯
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">Promedio del equipo</p>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Agents Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                Agentes ({metrics.length})
              </h2>
              <div className="flex gap-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    fetchDashboardData({
                      islandId: selectedIsland || undefined,
                      skill: selectedSkill || undefined,
                      status: e.target.value || undefined,
                    });
                  }}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400"
                >
                  <option value="">Todos los estados</option>
                  <option value="READY">Ready</option>
                  <option value="NOT_READY">Not Ready</option>
                  <option value="CallInbound">En Llamada</option>
                  <option value="ACW">ACW</option>
                  <option value="Break">Break</option>
                  <option value="LoggedOut">Logged Out</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {metrics.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No hay métricas disponibles. Sube un CSV operativo.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Agente</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Estado</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">TMO</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Break</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">ACW</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">ATN</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Acciones</th>
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
                        <td className="py-3 px-4">
                          <Badge
                            variant={metric.currentStatus === 'READY' ? 'success' : 'info'}
                            className="text-xs"
                          >
                            {metric.currentStatus || 'Sin datos'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(getTMOStatus(metric))}`}>
                            <span>{getStatusIcon(getTMOStatus(metric))}</span>
                            <span>{formatSeconds(metric.tmoSeconds)}</span>
                          </div>
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
                        <td className="py-3 px-4 text-center">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedAgent(metric);
                              setShowGoalsModal(true);
                            }}
                          >
                            Metas
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Uploads History */}
        {uploads.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-900">Historial de Cargas</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {uploads.slice(0, 5).map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-primary-25 to-white"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{upload.originalFilename}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(upload.createdAt).toLocaleDateString('es-AR')} • {upload.validRows} registros válidos
                      </p>
                    </div>
                    <Badge
                      variant={upload.status === 'COMPLETED' ? 'success' : upload.status === 'FAILED' ? 'danger' : 'warning'}
                      className="text-xs"
                    >
                      {upload.status === 'COMPLETED' ? 'Completado' :
                       upload.status === 'FAILED' ? 'Fallido' : 'Procesando'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Cargar CSV Operativo</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-4xl mb-3">📄</div>
                  <p className="text-slate-600 font-medium">
                    {file ? file.name : 'Haz clic o arrastra un archivo'}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">CSV, XLSX o XLS</p>
                </label>
              </div>

              {uploadResult && (
                <div className={`p-4 rounded-xl ${
                  uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`font-medium ${uploadResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {uploadResult.success
                      ? `¡Cargado! ${uploadResult.data?.created || 0} registros procesados`
                      : uploadResult.error || 'Error al procesar'}
                  </p>
                  {uploadResult.data?.errors?.length > 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      {uploadResult.data.errors.length} errores de procesamiento
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowUploadModal(false);
                  setFile(null);
                  setUploadResult(null);
                }}
                disabled={uploading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? 'Procesando...' : 'Cargar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
