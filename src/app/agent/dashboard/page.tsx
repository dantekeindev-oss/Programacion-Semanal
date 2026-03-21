'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import AgentNavigation from '@/components/agent/AgentNavigation';
import { AgentScheduleInfo, RequestWithRelations } from '@/types';
import { getWeekDayLabel, getRequestStatusLabel, getBadgeVariantForStatus, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function AgentDashboard() {
  const { data: session } = useSession();
  const [schedule, setSchedule] = useState<AgentScheduleInfo | null>(null);
  const [recentRequests, setRecentRequests] = useState<RequestWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      Promise.all([fetchSchedule(), fetchRequests()]);
    }
  }, [session]);

  const fetchSchedule = async () => {
    try {
      const response = await fetch('/api/schedule');
      const data = await response.json();

      if (data.success && data.data) {
        setSchedule(data.data);
      }
    } catch (error) {
      console.error('Error al cargar horario:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/requests?status=PENDING');
      const data = await response.json();

      if (data.success && data.data) {
        setRecentRequests(data.data.slice(0, 3));
      }
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
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
      <AgentNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient-blue">
                Mi Horario
              </h1>
              <p className="text-slate-600 mt-1">
                Hola, {session?.user?.firstName || session?.user?.name}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Schedule Card */}
          <Card className="animate-fade-in">
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-900">Información de Horario</h2>
            </CardHeader>
            <CardBody>
              {schedule ? (
                <div className="space-y-5">
                  {/* Team */}
                  <div className="p-4 bg-gradient-to-r from-primary-50 to-white border border-primary-200 rounded-xl">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Equipo</p>
                    <p className="text-xl font-bold text-gradient-blue">{schedule.teamName}</p>
                  </div>

                  {/* Day Off */}
                  <div className="p-4 bg-gradient-to-r from-primary-50 to-white border border-primary-200 rounded-xl">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Franco Semanal</p>
                    {schedule.weeklyDayOff ? (
                      <Badge variant="info" className="text-sm px-4 py-1.5">
                        {getWeekDayLabel(schedule.weeklyDayOff)}
                      </Badge>
                    ) : (
                      <p className="text-slate-500">No asignado</p>
                    )}
                  </div>

                  {/* Work Schedule */}
                  <div className="p-4 bg-gradient-to-r from-primary-50 to-white border border-primary-200 rounded-xl">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Horario de Trabajo</p>
                    <p className="text-xl font-bold text-gradient-blue">
                      {schedule.scheduleTime || 'No asignado'}
                    </p>
                  </div>

                  {/* Break */}
                  <div className="p-4 bg-gradient-to-r from-primary-50 to-white border border-primary-200 rounded-xl">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Break</p>
                    {schedule.breakTime ? (
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-gradient-blue">{schedule.breakTime}</span>
                        {schedule.breakDay && (
                          <Badge variant="default" className="text-xs px-3 py-1">
                            {getWeekDayLabel(schedule.breakDay)}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-500">No asignado</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-16 w-16 text-primary-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-slate-600">
                    No hay información de horario disponible.
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Contacta a tu líder para que te asigne un horario.
                  </p>
                </div>
              )}
            </CardBody>
            <div className="px-6 pb-6 pt-0">
              <Button
                onClick={() => window.location.href = '/agent/new-request'}
                className="w-full h-12 text-base font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear Nueva Solicitud
              </Button>
            </div>
          </Card>

          {/* Recent Requests */}
          <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Solicitudes Recientes</h2>
                {recentRequests.length > 0 && (
                  <Badge variant="warning" className="text-sm px-4 py-1.5">
                    {recentRequests.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardBody>
              {recentRequests.length > 0 ? (
                <div className="space-y-3">
                  {recentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 border border-slate-200 rounded-xl hover:bg-primary-25/50 hover:border-primary-300 transition-all cursor-pointer"
                      onClick={() => window.location.href = '/agent/requests'}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant={getBadgeVariantForStatus(request.status)}>
                          {getRequestStatusLabel(request.status)}
                        </Badge>
                        <span className="text-sm text-slate-500">
                          {formatDateTime(request.createdAt)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {formatDateTime(request.targetDate)}
                        </p>
                        <p className="text-sm text-slate-600">
                          {request.requestedSchedule}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 mt-2 border-t border-slate-200">
                    <Button
                      onClick={() => window.location.href = '/agent/requests'}
                      variant="secondary"
                      className="w-full h-11"
                    >
                      Ver Todas las Solicitudes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-16 w-16 text-primary-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-slate-600">
                    No tienes solicitudes recientes.
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Puedes crear una nueva solicitud de cambio de horario o franco.
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
