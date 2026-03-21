'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import LeaderNavigation from '@/components/leader/LeaderNavigation';
import { WeekDay } from '@/prisma/client';
import { getWeekDayLabel } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type TeamMember = {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  weeklyDayOff: WeekDay | null;
  scheduleTime?: string;
};

type SwapLog = {
  id: string;
  type: string;
  targetDate: string;
  changes: {
    targetDate: string;
    newSchedule?: string;
    newDayOff?: WeekDay;
    reason?: string;
  };
  createdAt: string;
  agent: {
    id: string;
    name: string | null;
    firstName: string | null;
    email: string;
  } | null;
};

export default function LeaderSwapPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [swapLogs, setSwapLogs] = useState<SwapLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<TeamMember | null>(null);
  const [swapType, setSwapType] = useState<'SCHEDULE' | 'DAY_OFF'>('SCHEDULE');
  const [targetDate, setTargetDate] = useState('');
  const [newSchedule, setNewSchedule] = useState('');
  const [newDayOff, setNewDayOff] = useState<WeekDay | ''>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchTeamData();
      fetchSwapHistory();
    }
  }, [session]);

  const fetchTeamData = async () => {
    try {
      const response = await fetch('/api/team/members');
      const data = await response.json();

      if (data.success && data.data) {
        setMembers(data.data);
      }
    } catch (error) {
      console.error('Error al cargar miembros:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSwapHistory = async () => {
    try {
      const response = await fetch('/api/leader/swap');
      const data = await response.json();

      if (data.success && data.data) {
        setSwapLogs(data.data);
      }
    } catch (error) {
      console.error('Error al cargar historial de enroques:', error);
    }
  };

  const openSwapModal = (agent: TeamMember) => {
    setSelectedAgent(agent);
    setShowSwapModal(true);
    setSwapType('SCHEDULE');
    setTargetDate('');
    setNewSchedule('');
    setNewDayOff('');
    setReason('');
  };

  const handleSubmitSwap = async () => {
    if (!selectedAgent || !targetDate) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    if (swapType === 'SCHEDULE' && !newSchedule) {
      alert('Por favor ingresa el nuevo horario');
      return;
    }

    if (swapType === 'DAY_OFF' && !newDayOff) {
      alert('Por favor selecciona el nuevo franco');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leader/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          type: swapType,
          targetDate,
          newSchedule: swapType === 'SCHEDULE' ? newSchedule : undefined,
          newDayOff: swapType === 'DAY_OFF' ? newDayOff : undefined,
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al realizar enroque');
      }

      alert('Enroque realizado correctamente. El agente recibirá una notificación.');
      setShowSwapModal(false);
      setSelectedAgent(null);
      fetchSwapHistory();
      fetchTeamData(); // Recargar para ver cambios
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al realizar enroque');
    } finally {
      setIsSubmitting(false);
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
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4-4m-4 4l4 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient-blue">Enroques</h1>
              <p className="text-slate-600 mt-1">
                Realiza cambios de horario o franco para los miembros de tu equipo
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de miembros */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-slate-900">
                  Miembros del Equipo ({members.length})
                </h2>
              </CardHeader>
              <CardBody>
                {members.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No hay miembros en el equipo.</p>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-25/50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold shadow-md">
                            {(member.firstName || member.name || member.email)[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-sm text-slate-600">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {member.weeklyDayOff && (
                            <Badge variant="info" className="text-xs">
                              {getWeekDayLabel(member.weeklyDayOff)}
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            onClick={() => openSwapModal(member)}
                          >
                            Enrocar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Historial de enroques */}
          <div>
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-slate-900">
                  Historial de Enroques
                </h2>
              </CardHeader>
              <CardBody>
                {swapLogs.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No hay enroques registrados.</p>
                ) : (
                  <div className="space-y-3">
                    {swapLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-primary-25 to-white"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={log.type === 'SCHEDULE_SWAP' ? 'info' : 'warning'}>
                            {log.type === 'SCHEDULE_SWAP' ? 'Horario' : 'Franco'}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {new Date(log.createdAt).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-900">
                          {log.agent?.firstName} {log.agent?.lastName}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {new Date(log.changes.targetDate).toLocaleDateString('es-AR')}
                        </p>
                        {log.changes.newSchedule && (
                          <p className="text-xs text-primary-600 mt-1">
                            Nuevo: {log.changes.newSchedule}
                          </p>
                        )}
                        {log.changes.newDayOff && (
                          <p className="text-xs text-primary-600 mt-1">
                            Franco: {getWeekDayLabel(log.changes.newDayOff)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de enroque */}
      {showSwapModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">
                Realizar Enroque
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {selectedAgent.firstName} {selectedAgent.lastName}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Tipo de enroque */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de Cambio
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSwapType('SCHEDULE')}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      swapType === 'SCHEDULE'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Horario
                  </button>
                  <button
                    type="button"
                    onClick={() => setSwapType('DAY_OFF')}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      swapType === 'DAY_OFF'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Franco
                  </button>
                </div>
              </div>

              {/* Fecha objetivo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Fecha del Cambio
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-400"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Nuevo horario */}
              {swapType === 'SCHEDULE' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nuevo Horario
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 09:00-18:00"
                    value={newSchedule}
                    onChange={(e) => setNewSchedule(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-400"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Formato: HH:MM-HH:MM
                  </p>
                </div>
              )}

              {/* Nuevo franco */}
              {swapType === 'DAY_OFF' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nuevo Franco
                  </label>
                  <select
                    value={newDayOff}
                    onChange={(e) => setNewDayOff(e.target.value as WeekDay)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-400 bg-white"
                  >
                    <option value="">Seleccionar día...</option>
                    <option value="MONDAY">Lunes</option>
                    <option value="TUESDAY">Martes</option>
                    <option value="WEDNESDAY">Miércoles</option>
                    <option value="THURSDAY">Jueves</option>
                    <option value="FRIDAY">Viernes</option>
                    <option value="SATURDAY">Sábado</option>
                    <option value="SUNDAY">Domingo</option>
                  </select>
                </div>
              )}

              {/* Motivo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Motivo (opcional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe el motivo del cambio..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-400 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowSwapModal(false);
                  setSelectedAgent(null);
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitSwap}
                disabled={isSubmitting || !targetDate || (swapType === 'SCHEDULE' && !newSchedule) || (swapType === 'DAY_OFF' && !newDayOff)}
              >
                {isSubmitting ? 'Procesando...' : 'Realizar Enroque'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
