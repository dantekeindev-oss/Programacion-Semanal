'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import LeaderNavigation from '@/components/leader/LeaderNavigation';
import { ApiResponse, LeaderDashboardStats } from '@/types';

export const dynamic = 'force-dynamic';

export default function LeaderDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<LeaderDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStats();
    }
  }, [status]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/team/stats');
      const data: ApiResponse<LeaderDashboardStats> = await response.json();

      if (data.success && data.data) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
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
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient-blue">
                Panel de Control
              </h1>
              <p className="text-slate-600 mt-1">
                Bienvenido, {session?.user?.firstName || session?.user?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="corporate-stat-card animate-fade-in">
            <CardBody className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Miembros</p>
                  <p className="text-4xl font-bold text-gradient-blue mt-2">
                    {stats?.totalMembers || 0}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">en el equipo</p>
                </div>
                <div className="stat-icon-primary">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0 .656.126 1.283.356 1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="corporate-stat-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardBody className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pendientes</p>
                  <p className="text-4xl font-bold text-amber-500 mt-2">
                    {stats?.pendingRequests || 0}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">por aprobar</p>
                </div>
                <div className="stat-icon-warning">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0M9 21h6m-6 0h-6m6 0h-6v-2a2 2 0 00-2-2H7a2 2 0 00-2 2v2m12 0v-4a2 2 0 00-2-2H7a2 2 0 00-2 2v4" />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="corporate-stat-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardBody className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Aprobadas</p>
                  <p className="text-4xl font-bold text-emerald-500 mt-2">
                    {stats?.approvedThisMonth || 0}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">este mes</p>
                </div>
                <div className="stat-icon-success">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0l-6-2-2 4m-2-2l-2 4m0-6l2-4" />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="corporate-stat-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <CardBody className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Rechazadas</p>
                  <p className="text-4xl font-bold text-red-500 mt-2">
                    {stats?.rejectedThisMonth || 0}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">este mes</p>
                </div>
                <div className="stat-icon-danger">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l-2 2m2-2l2 2m-2-2l-2 2m14-8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h8M6 12l2 2m0-2l-2 2" />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card className="animate-fade-in">
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-900">Acciones Rápidas</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <Button
                onClick={() => window.location.href = '/leader/upload'}
                className="w-full justify-start h-12 text-base"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4 8l-4-4m0 0L6 8m4-4v12" />
                </svg>
                Cargar Horarios
              </Button>
              <Button
                onClick={() => window.location.href = '/leader/team'}
                variant="secondary"
                className="w-full justify-start h-12 text-base"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0 .656.126 1.283.356 1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Ver Equipo
              </Button>
              <Button
                onClick={() => window.location.href = '/leader/requests'}
                variant="secondary"
                className="w-full justify-start h-12 text-base"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m-3 2h3a2 2 0 002-2v-4a2 2 0 00-2-2h-3a2 2 0 00-2 2v4a2 2 0 002 2h3" />
                </svg>
                Gestionar Solicitudes
              </Button>
            </CardBody>
          </Card>

          {/* Pending Requests */}
          <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Solicitudes Pendientes</h2>
                {stats && stats.pendingRequests > 0 && (
                  <Badge variant="warning" className="text-sm px-4 py-1.5">
                    {stats.pendingRequests}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardBody>
              {stats && stats.pendingRequests > 0 ? (
                <div className="space-y-4">
                  <p className="text-slate-600">
                    Tienes {stats.pendingRequests} solicitud{stats.pendingRequests !== 1 ? 'es' : ''} pendiente{stats.pendingRequests !== 1 ? 's' : ''} de revisión.
                  </p>
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-25 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.583-9.92c.75-1.334 2.717-1.334 3.486 0l5.583 9.92a11.813 11.813 0 01-1.356 0 9.044 0 4.486-6.912 6.912-15.408 0a11.813 11.813 0 01-1.356 0l-5.583-9.92a11.813 11.813 0 01-3.486 0 11.813 11.813 0 00-3.486 0zm-6.432 3.642l-5.583 9.92a13.813 13.813 0 00-1.598 0 10.544 0 4.486-6.912 6.912-15.408 0a13.813 13.813 0 00-1.598 0l-5.583-9.92a13.813 13.813 0 00-3.486 0 13.813 13.813 0 00-3.486 0zm6.432 3.642l-5.583 9.92c.75 1.334 2.717 1.334 3.486 0l5.583-9.92c.75-1.334 2.717-1.334 3.486 0a13.813 13.813 0 00-1.598 0 10.544 0 4.486-6.912 6.912-15.408 0a13.813 13.813 0 00-1.598 0l-5.583-9.92a13.813 11.813 0 00-3.486 0z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium text-amber-900">
                          Revisa las solicitudes pendientes
                        </p>
                        <p className="text-sm text-amber-700 mt-1">
                          Es importante responder a las solicitudes de tu equipo para mantener una comunicación fluida.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => window.location.href = '/leader/requests'}
                    className="w-full mt-4 h-11"
                  >
                    Ir a Solicitudes
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-16 w-16 text-primary-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-slate-600">
                    No hay solicitudes pendientes en este momento.
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Se notificará cuando haya nuevas solicitudes.
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
