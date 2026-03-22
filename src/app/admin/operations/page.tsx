'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Island } from '@/types/operations';

export const dynamic = 'force-dynamic';

export default function AdminOperationsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [islands, setIslands] = useState<Island[]>([]);

  // Modales
  const [showCreateIslandModal, setShowCreateIslandModal] = useState(false);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [selectedIsland, setSelectedIsland] = useState<Island | null>(null);

  // Formularios
  const [islandFormData, setIslandFormData] = useState({
    name: '',
    code: '',
    description: '',
  });
  const [thresholdFormData, setThresholdFormData] = useState({
    targetTmo: 360,
    warningTmo: 420,
    criticalTmo: 480,
    targetBreak: 900,
    warningBreak: 1080,
    criticalBreak: 1260,
    targetAcw: 30,
    warningAcw: 45,
    criticalAcw: 60,
    targetHold: 60,
    warningHold: 90,
    criticalHold: 120,
    targetAdherence: 95,
    warningAdherence: 90,
    criticalAdherence: 85,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchIslands();
    }
  }, [session]);

  const fetchIslands = async () => {
    try {
      const response = await fetch('/api/admin/islands');
      const data = await response.json();

      if (data.success) {
        setIslands(data.data);
      }
    } catch (error) {
      console.error('Error al cargar islas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIsland = async () => {
    if (!islandFormData.name.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/islands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(islandFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear isla');
      }

      alert('Isla creada correctamente');
      setShowCreateIslandModal(false);
      setIslandFormData({ name: '', code: '', description: '' });
      fetchIslands();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al crear isla');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveThresholds = async () => {
    if (!selectedIsland) return;

    setIsSubmitting(true);

    try {
      const url = selectedIsland.threshold
        ? `/api/admin/islands/${selectedIsland.id}/thresholds`
        : `/api/admin/islands/${selectedIsland.id}/thresholds`;

      const method = selectedIsland.threshold ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(thresholdFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar umbrales');
      }

      alert('Umbrales guardados correctamente');
      setShowThresholdModal(false);
      setSelectedIsland(null);
      fetchIslands();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al guardar umbrales');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openThresholdModal = (island: Island) => {
    setSelectedIsland(island);
    if (island.threshold) {
      setThresholdFormData({
        targetTmo: island.threshold.targetTmo,
        warningTmo: island.threshold.warningTmo,
        criticalTmo: island.threshold.criticalTmo,
        targetBreak: island.threshold.targetBreak,
        warningBreak: island.threshold.warningBreak,
        criticalBreak: island.threshold.criticalBreak,
        targetAcw: island.threshold.targetAcw,
        warningAcw: island.threshold.warningAcw,
        criticalAcw: island.threshold.criticalAcw,
        targetHold: island.threshold.targetHold,
        warningHold: island.threshold.warningHold,
        criticalHold: island.threshold.criticalHold,
        targetAdherence: island.threshold.targetAdherence,
        warningAdherence: island.threshold.warningAdherence,
        criticalAdherence: island.threshold.criticalAdherence,
      });
    }
    setShowThresholdModal(true);
  };

  const handleDeleteIsland = async (islandId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta isla?')) return;

    try {
      const response = await fetch(`/api/admin/islands/${islandId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar isla');
      }

      alert('Isla eliminada correctamente');
      fetchIslands();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al eliminar isla');
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
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                A
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Administrador</p>
                <p className="text-xs text-primary-600 font-medium">Operaciones</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href="/admin/dashboard">
                <Button variant="secondary" size="sm">Dashboard</Button>
              </Link>
              <a
                href="/api/auth/signout"
                className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors px-3 py-2 rounded-xl hover:bg-primary-50"
              >
                Cerrar sesión
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-200">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient-blue">Gestión de Operaciones</h1>
                <p className="text-slate-600 mt-1">
                  Administra islas, umbrales y configuración operativa
                </p>
              </div>
            </div>

            <Button onClick={() => setShowCreateIslandModal(true)}>
              <span className="mr-2">+</span>
              Nueva Isla
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="corporate-stat-card">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Total Islas</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{islands.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl">
                  🏝️
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                {islands.filter(i => i.isActive).length} activas
              </p>
            </CardBody>
          </Card>

          <Card className="corporate-stat-card">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Con Umbrales</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {islands.filter(i => i.threshold).length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-xl">
                  ⚙️
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Configuradas
              </p>
            </CardBody>
          </Card>

          <Card className="corporate-stat-card">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Agentes Asignados</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {islands.reduce((sum, i) => sum + (i as any)._count?.agents || 0, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-xl">
                  👥
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                En todas las islas
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Islands List */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-900">Islas ({islands.length})</h2>
          </CardHeader>
          <CardBody>
            {islands.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No hay islas configuradas.</p>
            ) : (
              <div className="space-y-3">
                {islands.map((island) => (
                  <div
                    key={island.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-25/50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                        island.isActive
                          ? 'bg-gradient-to-br from-green-500 to-green-600'
                          : 'bg-slate-400'
                      }`}>
                        🏝️
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{island.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {island.code && (
                            <Badge variant="info" className="text-xs">{island.code}</Badge>
                          )}
                          <span className="text-xs text-slate-500">
                            {(island as any)._count?.agents || 0} agentes
                          </span>
                          {island.threshold && (
                            <Badge variant="success" className="text-xs">Con umbrales</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openThresholdModal(island)}
                      >
                        {island.threshold ? 'Editar Umbrales' : 'Configurar'}
                      </Button>
                      {(island as any)._count?.agents === 0 && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteIsland(island.id)}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Create Island Modal */}
      {showCreateIslandModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Nueva Isla</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={islandFormData.name}
                  onChange={(e) => setIslandFormData({ ...islandFormData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-400"
                  placeholder="Ej: Ventas, Soporte, Retenciones"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Código
                </label>
                <input
                  type="text"
                  value={islandFormData.code}
                  onChange={(e) => setIslandFormData({ ...islandFormData, code: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-400"
                  placeholder="Ej: VENTAS, SOPORTE"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={islandFormData.description}
                  onChange={(e) => setIslandFormData({ ...islandFormData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-400 resize-none"
                  placeholder="Descripción de la isla..."
                  rows={2}
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateIslandModal(false);
                  setIslandFormData({ name: '', code: '', description: '' });
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateIsland} disabled={isSubmitting}>
                {isSubmitting ? 'Creando...' : 'Crear Isla'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Threshold Modal */}
      {showThresholdModal && selectedIsland && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
              <h3 className="text-xl font-semibold text-slate-900">
                Umbrales: {selectedIsland.name}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Configura los umbrales operativos para esta isla
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* TMO */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">TMO (Tiempo Medio de Operación)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-blue-700 mb-1">Target (seg)</label>
                    <input
                      type="number"
                      value={thresholdFormData.targetTmo}
                      onChange={(e) => setThresholdFormData({ ...thresholdFormData, targetTmo: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-blue-700 mb-1">Warning (seg)</label>
                    <input
                      type="number"
                      value={thresholdFormData.warningTmo}
                      onChange={(e) => setThresholdFormData({ ...thresholdFormData, warningTmo: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-blue-700 mb-1">Critical (seg)</label>
                    <input
                      type="number"
                      value={thresholdFormData.criticalTmo}
                      onChange={(e) => setThresholdFormData({ ...thresholdFormData, criticalTmo: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Break */}
              <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-3">Break</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-yellow-700 mb-1">Target (seg)</label>
                    <input
                      type="number"
                      value={thresholdFormData.targetBreak}
                      onChange={(e) => setThresholdFormData({ ...thresholdFormData, targetBreak: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-yellow-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-yellow-700 mb-1">Warning (seg)</label>
                    <input
                      type="number"
                      value={thresholdFormData.warningBreak}
                      onChange={(e) => setThresholdFormData({ ...thresholdFormData, warningBreak: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-yellow-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-yellow-700 mb-1">Critical (seg)</label>
                    <input
                      type="number"
                      value={thresholdFormData.criticalBreak}
                      onChange={(e) => setThresholdFormData({ ...thresholdFormData, criticalBreak: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-yellow-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* ACW */}
              <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3">ACW (After Call Work)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-green-700 mb-1">Target (seg)</label>
                    <input
                      type="number"
                      value={thresholdFormData.targetAcw}
                      onChange={(e) => setThresholdFormData({ ...thresholdFormData, targetAcw: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-green-700 mb-1">Warning (seg)</label>
                    <input
                      type="number"
                      value={thresholdFormData.warningAcw}
                      onChange={(e) => setThresholdFormData({ ...thresholdFormData, warningAcw: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-green-700 mb-1">Critical (seg)</label>
                    <input
                      type="number"
                      value={thresholdFormData.criticalAcw}
                      onChange={(e) => setThresholdFormData({ ...thresholdFormData, criticalAcw: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Hold */}
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-3">Hold (Tiempo en Espera)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-purple-700 mb-1">Target (seg)</label>
                    <input
                      type="number"
                      value={thresholdFormData.targetHold}
                      onChange={(e) => setThresholdFormData({ ...thresholdFormData, targetHold: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-purple-700 mb-1">Warning (seg)</label>
                    <input
                      type="number"
                      value={thresholdFormData.warningHold}
                      onChange={(e) => setThresholdFormData({ ...thresholdFormData, warningHold: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-purple-700 mb-1">Critical (seg)</label>
                    <input
                      type="number"
                      value={thresholdFormData.criticalHold}
                      onChange={(e) => setThresholdFormData({ ...thresholdFormData, criticalHold: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Adherencia */}
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-3">Adherencia (%)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-orange-700 mb-1">Target (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={thresholdFormData.targetAdherence}
                      onChange={(e) => setThresholdFormData({ ...thresholdFormData, targetAdherence: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-orange-700 mb-1">Warning (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={thresholdFormData.warningAdherence}
                      onChange={(e) => setThresholdFormData({ ...thresholdFormData, warningAdherence: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-orange-700 mb-1">Critical (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={thresholdFormData.criticalAdherence}
                      onChange={(e) => setThresholdFormData({ ...thresholdFormData, criticalAdherence: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white rounded-b-2xl">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowThresholdModal(false);
                  setSelectedIsland(null);
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveThresholds} disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar Umbrales'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
