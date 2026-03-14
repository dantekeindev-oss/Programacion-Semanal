'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [newLeaderEmail, setNewLeaderEmail] = useState('');
  const [isUpdatingLeader, setIsUpdatingLeader] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email === 'dantekein90151@gmail.com') {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, teamsRes, statsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/teams'),
        fetch('/api/admin/stats'),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.data || []);
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData.data || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data || null);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignLeader = (team: any) => {
    setSelectedTeam(team);
    setNewLeaderEmail(team.leaderEmail || '');
    setShowLeaderModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleUpdateLeader = async () => {
    if (!selectedTeam || !newLeaderEmail) return;

    setIsUpdatingLeader(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/teams/${selectedTeam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderEmail: newLeaderEmail }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al actualizar líder');
      }

      setSuccess('Líder actualizado correctamente');
      setShowLeaderModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar líder');
    } finally {
      setIsUpdatingLeader(false);
    }
  };

  const getAvailableUsersForLeader = () => {
    // Filtrar usuarios que puedan ser líderes (no el admin y usuarios con dominio @konecta.com)
    return users.filter((user) =>
      user.email !== 'dantekein90151@gmail.com' &&
      user.email.endsWith('@konecta.com')
    );
  };

  if (!session?.user || session.user?.email !== 'dantekein90151@gmail.com') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <path className="opacity-25" fill="currentColor" d="M4 12v8a4 4 0 014-0v8H2a4 4 0 00-4-4h4a4 4 0 014 0v8z" />
          </svg>
          <p className="text-slate-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Navigation */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0M9 21h6m-6 0h-6m6 0h6v-2a2 2 0 00-2-2H7a2 2 0 00-2 2v2m12 0v-4a2 2 0 00-2 2h5.586a1 1 0 011.586 0 012 0l.001.033 5.375.013.009-.006.032.006l-.012.001.002a1 1 0 011.994.994.994.994z" />
                </svg>
              </div>
                <span className="text-xl font-bold text-slate-900">Panel de Administración</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3 pl-4 border-l border-slate-200">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-semibold shadow-sm">
                  {session?.user?.name?.[0] || 'A'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-slate-900">{session?.user?.name || 'Administrador'}</p>
                  <p className="text-xs text-slate-500">dantekein90151@gmail.com</p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/login'}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Dashboard de Administración
          </h1>
          <p className="text-slate-600 mt-1">
            Panel de control completo del sistema
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="corporate-stat-card animate-fade-in">
                <CardBody className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Usuarios</p>
                      <p className="text-4xl font-bold text-slate-900 mt-2">
                        {stats?.totalUsers || 0}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
                      <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M14 10a4 4 0 00-8 0M2 10a4 4 0 000 8H12a4 4 0 000 8z" />
                      </svg>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="corporate-stat-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <CardBody className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Equipos</p>
                      <p className="text-4xl font-bold text-slate-900 mt-2">
                        {stats?.totalTeams || 0}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center">
                      <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2h-3a2 2 0 002 2 2v13a2 2 0 002 2 2H5a2 2 0 00-2-2v5m0 4h14a2 2 0 012 2H4a2 2 0 00-2 2v5z" />
                      </svg>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="corporate-stat-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <CardBody className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Líderes</p>
                      <p className="text-4xl font-bold text-slate-900 mt-2">
                        {stats?.totalLeaders || 0}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M14 10a4 4 0 00-8 0M2 10a4 4 0 000 8H12a4 4 0 000 8z" />
                      </svg>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="corporate-stat-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <CardBody className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Agentes</p>
                      <p className="text-4xl font-bold text-slate-900 mt-2">
                        {stats?.totalAgents || 0}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center">
                      <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0a4 4 0 008 0v4a2 2 0 00-2 2H6a2 2 0 00-2 2v10a4 4 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414 1.414L11.414 10l1.293 1.293a1 1 0 001.414 1.414L10 8.586 8.707 7.293z" />
                      </svg>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="corporate-stat-card animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <CardBody className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Solicitudes</p>
                      <p className="text-4xl font-bold text-slate-900 mt-2">
                        {stats?.totalRequests || 0}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center">
                      <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 00-2 2v10a2 2 0 002 2 2H5a2 2 0 00-2 2v5m0 4h14a2 2 0 012 2H4a2 2 0 00-2 2v5z" />
                      </svg>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardBody className="p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0M9 21h6m-6 0h-6m6 0h6v-2a2 2 0 00-2-2H7a2 2 0 00-2 2v2m12 0v-4a2 2 0 00-2 2h5.586a1 1 0 011.586 0 012 0l.001.033 5.375.013.009-.006.032.006l-.012.001.002a1 1 0 011.994.994.994.994z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-slate-900">Usuarios</p>
                  <p className="text-sm text-slate-600">Ver todos los usuarios</p>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-5.356-1.857M14 10a4 4 0 00-8 0M2 10a4 4 0 000 8H12a4 4 0 000 8z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-slate-900">Equipos</p>
                  <p className="text-sm text-slate-600">Gestionar equipos</p>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4m0 0l-4 4m0 0l4 4m-0 0l4 4" />
                    </svg>
                  </div>
                  <p className="font-semibold text-slate-900">Líderes</p>
                  <p className="text-sm text-slate-600">Asignar líderes</p>
                </CardBody>
              </Card>
            </div>

            {/* Teams List */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Equipos Registrados</h2>
                <Button onClick={() => window.location.href = '/admin/teams'} variant="secondary" className="text-sm">
                  Ver todos
                </Button>
              </CardHeader>
              <CardBody>
                {teams.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-5.356-1.857M14 10a4 4 0 00-8 0M2 10a4 4 0 000 8H12a4 4 0 000 8z" />
                    </svg>
                    <p className="text-slate-600">No hay equipos registrados aún.</p>
                    <p className="text-sm text-slate-500 mt-2">
                      Los equipos se crean automáticamente al cargar el archivo Excel.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Equipo</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Líder</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Miembros</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {teams.slice(0, 5).map((team) => (
                          <tr key={team.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-medium text-slate-900">{team.name}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-slate-700">{team.leaderEmail || '-'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="info">{team.memberCount || 0}</Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <Button size="sm" variant="secondary" onClick={() => handleAssignLeader(team)}>
                                  Asignar Líder
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => window.location.href = `/admin/teams/${team.id}`}>
                                  Ver
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Recent Users */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Usuarios Recientes</h2>
                <Button onClick={() => window.location.href = '/admin/users'} variant="secondary" className="text-sm">
                  Ver todos
                </Button>
              </CardHeader>
              <CardBody>
                {users.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600">No hay usuarios registrados.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Usuario</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Rol</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Equipo</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Último Acceso</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.slice(0, 10).map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-medium text-slate-900">
                                {user.firstName || ''} {user.lastName || user.name || ''}
                              </p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{user.email}</td>
                            <td className="px-6 py-4">
                              <Badge variant={user.role === 'LEADER' ? 'success' : 'default'}>
                                {user.role === 'LEADER' ? 'Líder' : 'Agente'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {user.teamName || '-'}
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-xs">
                              {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('es-AR') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          </>
        )}

        {/* Assign Leader Modal */}
        {showLeaderModal && selectedTeam && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-xl font-semibold text-slate-900">
                  Asignar Líder
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {selectedTeam.name}
                </p>
              </div>
              <div className="p-6">
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email del Líder
                    </label>
                    <select
                      value={newLeaderEmail}
                      onChange={(e) => setNewLeaderEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                      disabled={isUpdatingLeader}
                    >
                      <option value="">Seleccionar usuario...</option>
                      {getAvailableUsersForLeader().map((user) => (
                        <option key={user.id} value={user.email}>
                          {user.email} {user.teamName ? `(Equipo: ${user.teamName})` : '(Sin equipo)'}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-2">
                      Solo usuarios con dominio @konecta.com pueden ser líderes
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                <Button
                  onClick={() => setShowLeaderModal(false)}
                  variant="secondary"
                  disabled={isUpdatingLeader}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateLeader}
                  disabled={isUpdatingLeader || !newLeaderEmail}
                  className="min-w-[100px]"
                >
                  {isUpdatingLeader ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </div>
                  ) : (
                    'Guardar'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Success Toast */}
        {success && (
          <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
