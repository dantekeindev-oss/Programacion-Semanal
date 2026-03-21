'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { BrandLogo } from '@/components/BrandLogo';

export const dynamic = 'force-dynamic';

type AdminSessionData = {
  email: string;
  name: string;
  isAdmin: boolean;
  role: 'ADMIN';
};

type AdminStats = {
  totalUsers: number;
  totalTeams: number;
  totalLeaders: number;
  totalAgents: number;
  totalRequests: number;
  lastCleanup: {
    action: string;
    createdAt: string;
    changes: Record<string, unknown> | null;
  } | null;
};

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  teamName: string | null;
  lastLoginAt: string | null;
  emailManuallySet: boolean;
  dni: string | null;
};

type AdminTeam = {
  id: string;
  name: string;
  leaderEmail: string | null;
  memberCount: number;
};

type UploadFormat = 'auto' | 'telefonico' | 'standard';

type UploadDisplayError =
  | { row: number; field: string; message: string }
  | { dni: string; error: string };

export default function AdminDashboard() {
  const router = useRouter();
  const [adminSession, setAdminSession] = useState<AdminSessionData | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<AdminTeam | null>(null);
  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [newLeaderEmail, setNewLeaderEmail] = useState('');
  const [isUpdatingLeader, setIsUpdatingLeader] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNominaModal, setShowNominaModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [nominaFile, setNominaFile] = useState<File | null>(null);
  const [uploadFormat, setUploadFormat] = useState<UploadFormat>('auto');
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingNomina, setIsUploadingNomina] = useState(false);
  const [isClearingProgramming, setIsClearingProgramming] = useState(false);
  const [isRunningFullCleanup, setIsRunningFullCleanup] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    format?: string;
    processed: number;
    created: number;
    updated: number;
    teamsCreated: number;
    leadersAssigned: number;
    errors: Array<{ dni: string; error: string }>;
  } | null>(null);
  const [nominaResult, setNominaResult] = useState<{
    created: number;
    updated: number;
    leaders: Array<{ name: string; email: string; dni: string }>;
    agents: Array<{ name: string; email: string; dni: string; leader: string }>;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);
  const [uploadErrors, setUploadErrors] = useState<UploadDisplayError[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [editingEmail, setEditingEmail] = useState<{ userId: string; currentEmail: string } | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRoleFilter, setUsersRoleFilter] = useState<'ALL' | 'LEADER' | 'AGENT'>('ALL');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/admin/session', {
          cache: 'no-store',
        });

        if (!res.ok) {
          router.push('/admin/login');
          return;
        }

        const data = await res.json();
        setAdminSession(data.data || null);
      } catch {
        router.push('/admin/login');
      }
    };

    checkSession();
  }, [router]);

  useEffect(() => {
    if (!adminSession) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [usersRes, teamsRes, statsRes] = await Promise.all([
          fetch('/api/admin/users', { cache: 'no-store' }),
          fetch('/api/admin/teams', { cache: 'no-store' }),
          fetch('/api/admin/stats', { cache: 'no-store' }),
        ]);

        if ([usersRes, teamsRes, statsRes].some((res) => res.status === 401)) {
          router.push('/admin/login');
          return;
        }

        const [usersData, teamsData, statsData] = await Promise.all([
          usersRes.json(),
          teamsRes.json(),
          statsRes.json(),
        ]);

        if (!usersRes.ok) {
          throw new Error(usersData.error || 'No se pudieron cargar los usuarios');
        }

        if (!teamsRes.ok) {
          throw new Error(teamsData.error || 'No se pudieron cargar los equipos');
        }

        if (!statsRes.ok) {
          throw new Error(statsData.error || 'No se pudieron cargar las estadisticas');
        }

        setUsers(usersData.data || []);
        setTeams(teamsData.data || []);
        setStats(statsData.data || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [adminSession, router]);

  const refreshData = async () => {
    if (!adminSession) {
      return;
    }

    setLoading(true);

    try {
      const [usersRes, teamsRes, statsRes] = await Promise.all([
        fetch('/api/admin/users', { cache: 'no-store' }),
        fetch('/api/admin/teams', { cache: 'no-store' }),
        fetch('/api/admin/stats', { cache: 'no-store' }),
      ]);

      const [usersData, teamsData, statsData] = await Promise.all([
        usersRes.json(),
        teamsRes.json(),
        statsRes.json(),
      ]);

      if ([usersRes, teamsRes, statsRes].some((res) => res.status === 401)) {
        router.push('/admin/login');
        return;
      }

      if (!usersRes.ok || !teamsRes.ok || !statsRes.ok) {
        throw new Error(
          usersData.error ||
          teamsData.error ||
          statsData.error ||
          'No se pudo refrescar la informacion del panel'
        );
      }

      setUsers(usersData.data || []);
      setTeams(teamsData.data || []);
      setStats(statsData.data || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al refrescar el panel');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignLeader = (team: AdminTeam) => {
    setSelectedTeam(team);
    setNewLeaderEmail(team.leaderEmail || '');
    setShowLeaderModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleUpdateLeader = async () => {
    if (!selectedTeam || !newLeaderEmail) {
      return;
    }

    setIsUpdatingLeader(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/teams/${selectedTeam.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leaderEmail: newLeaderEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar lider');
      }

      setSuccess('Lider actualizado correctamente');
      setShowLeaderModal(false);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar lider');
    } finally {
      setIsUpdatingLeader(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setError(null);
      setUploadErrors([]);
    }
  };

  const handleUploadExcel = async () => {
    if (!uploadFile) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadErrors([]);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('format', uploadFormat);

      const res = await fetch('/api/admin/excel/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadErrors(Array.isArray(data.errors) ? data.errors : []);
        throw new Error(data.error || 'Error al subir el archivo');
      }

      setUploadResult(data.data);
      setUploadErrors([]);
      setSuccess('Archivo procesado correctamente');
      setShowUploadModal(false);
      setUploadFile(null);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', {
      method: 'POST',
    });

    router.push('/admin/login');
    router.refresh();
  };

  const handleClearProgramming = async () => {
    const confirmed = window.confirm(
      'Se eliminaran todos los horarios, breaks y dias de franco cargados. Los usuarios y equipos se conservaran. Queres continuar?'
    );

    if (!confirmed) {
      return;
    }

    setIsClearingProgramming(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/programming/clear', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo limpiar la programacion');
      }

      setUploadResult(null);
      setUploadErrors([]);
      setSuccess(
        `Programacion limpiada: ${data.data?.deletedSchedules || 0} horarios, ${data.data?.deletedBreaks || 0} breaks.`
      );
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al limpiar la programacion');
    } finally {
      setIsClearingProgramming(false);
    }
  };

  const handleFullCleanup = async () => {
    const confirmed = window.confirm(
      'Se eliminaran horarios, breaks, dias de franco, solicitudes, notificaciones, logs, sesiones, equipos y usuarios importados. Solo se conservara el acceso administrador. Queres continuar?'
    );

    if (!confirmed) {
      return;
    }

    setIsRunningFullCleanup(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/system/cleanup', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo ejecutar la limpieza total');
      }

      setUploadResult(null);
      setUploadErrors([]);
      setSuccess(
        `Limpieza total completada: ${data.data?.deletedUsers || 0} usuarios, ${data.data?.deletedTeams || 0} equipos y ${data.data?.deletedSchedules || 0} horarios eliminados.`
      );
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ejecutar la limpieza total');
    } finally {
      setIsRunningFullCleanup(false);
    }
  };

  // Handler para cargar nómina
  const handleNominaFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNominaFile(file);
      setError(null);
    }
  };

  const handleUploadNomina = async () => {
    if (!nominaFile) {
      setError('Por favor selecciona el archivo de nómina');
      return;
    }

    setIsUploadingNomina(true);
    setError(null);
    setNominaResult(null);

    try {
      const formData = new FormData();
      formData.append('file', nominaFile);

      const res = await fetch('/api/admin/nomina', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la nómina');
      }

      setNominaResult(data.data);
      setSuccess(`Nómina procesada: ${data.data.created} agentes creados, ${data.data.updated} actualizados, ${data.data.leaders.length} líderes identificados.`);
      setShowNominaModal(false);
      setNominaFile(null);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la nómina');
    } finally {
      setIsUploadingNomina(false);
    }
  };

  // Handlers para gestión de emails
  const handleLoadUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (usersRoleFilter !== 'ALL') {
        params.append('role', usersRoleFilter);
      }
      if (usersSearch) {
        params.append('search', usersSearch);
      }

      const res = await fetch(`/api/admin/users/list?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al cargar usuarios');
      }

      setAllUsers(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
    }
  }, [usersRoleFilter, usersSearch]);

  const handleEditEmail = (userId: string, currentEmail: string) => {
    setEditingEmail({ userId, currentEmail });
    setNewEmail(currentEmail);
    setError(null);
  };

  const handleUpdateEmail = async () => {
    if (!editingEmail || !newEmail) {
      return;
    }

    setIsUpdatingEmail(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/users/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingEmail.userId,
          email: newEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar email');
      }

      setSuccess('Email actualizado correctamente');
      setEditingEmail(null);
      setNewEmail('');
      await handleLoadUsers();
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar email');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  useEffect(() => {
    if (showUsersModal) {
      handleLoadUsers();
    }
  }, [showUsersModal, usersRoleFilter, usersSearch]);

  const availableLeaders = users.filter(
    (user) => user.email.endsWith('@konecta.com') && user.role !== 'ADMIN'
  );
  const formattedLastCleanup = stats?.lastCleanup
    ? new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(stats.lastCleanup.createdAt))
    : null;

  if (!adminSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BrandLogo href="/admin/dashboard" size="sm" subtitle="Panel Admin" />
            <div>
              <p className="text-sm font-semibold text-slate-900">{adminSession.name}</p>
              <p className="text-sm text-slate-500">{adminSession.email}</p>
            </div>
          </div>
          <Button variant="secondary" onClick={handleLogout}>
            Cerrar sesion
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm">
            {success}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600">Gestion general del sistema</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleFullCleanup}
              disabled={loading || isRunningFullCleanup || isClearingProgramming}
            >
              {isRunningFullCleanup ? 'Limpiando sistema...' : 'Limpieza total'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleClearProgramming}
              disabled={loading || isClearingProgramming || isRunningFullCleanup}
            >
              {isClearingProgramming ? 'Limpiando...' : 'Limpiar programacion'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowNominaModal(true)}
            >
              Cargar Nómina
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowUsersModal(true)}
            >
              Gestionar Emails
            </Button>
            <Button onClick={() => setShowUploadModal(true)}>
              Cargar Programación
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              <StatCard title="Usuarios" value={stats?.totalUsers || 0} />
              <StatCard title="Equipos" value={stats?.totalTeams || 0} />
              <StatCard title="Lideres" value={stats?.totalLeaders || 0} />
              <StatCard title="Agentes" value={stats?.totalAgents || 0} />
              <StatCard title="Solicitudes" value={stats?.totalRequests || 0} />
            </div>

            <Card>
              <CardBody className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-slate-500">Ultima limpieza</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {formattedLastCleanup || 'Todavia no se ejecuto ninguna limpieza'}
                  </p>
                </div>
                {stats?.lastCleanup && (
                  <div className="text-sm text-slate-500">
                    <p>Accion: {stats.lastCleanup.action}</p>
                  </div>
                )}
              </CardBody>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">Equipos</h2>
                </CardHeader>
                <CardBody>
                  {teams.length === 0 ? (
                    <p className="text-slate-500">No hay equipos registrados.</p>
                  ) : (
                    <div className="space-y-3">
                      {teams.slice(0, 8).map((team) => (
                        <div key={team.id} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200">
                          <div>
                            <p className="font-semibold text-slate-900">{team.name}</p>
                            <p className="text-sm text-slate-500">{team.leaderEmail || 'Sin lider'}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="info">{team.memberCount}</Badge>
                            <Button size="sm" variant="secondary" onClick={() => handleAssignLeader(team)}>
                              Asignar lider
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-slate-900">Usuarios recientes</h2>
                </CardHeader>
                <CardBody>
                  {users.length === 0 ? (
                    <p className="text-slate-500">No hay usuarios registrados.</p>
                  ) : (
                    <div className="space-y-3">
                      {users.slice(0, 10).map((user) => (
                        <div key={user.id} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {user.firstName || user.name || user.email}
                              {user.lastName ? ` ${user.lastName}` : ''}
                            </p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={user.role === 'LEADER' ? 'success' : 'default'}>
                              {user.role}
                            </Badge>
                            <p className="text-xs text-slate-500 mt-2">{user.teamName || 'Sin equipo'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </>
        )}
      </div>

      {showLeaderModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Asignar lider</h3>
              <p className="text-sm text-slate-500 mt-1">{selectedTeam.name}</p>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Usuario
              </label>
              <select
                value={newLeaderEmail}
                onChange={(e) => setNewLeaderEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                disabled={isUpdatingLeader}
              >
                <option value="">Seleccionar usuario...</option>
                {availableLeaders.map((user) => (
                  <option key={user.id} value={user.email}>
                    {user.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowLeaderModal(false)} disabled={isUpdatingLeader}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateLeader} disabled={isUpdatingLeader || !newLeaderEmail}>
                {isUpdatingLeader ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Cargar programacion semanal</h3>
              <p className="text-sm text-slate-500 mt-1">Subi el archivo Excel del panel admin</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Formato del archivo
                </label>
                <select
                  value={uploadFormat}
                  onChange={(e) => setUploadFormat(e.target.value as UploadFormat)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  disabled={isUploading}
                >
                  <option value="auto">Detectar automaticamente</option>
                  <option value="telefonico">Formato TELEFONICO</option>
                  <option value="standard">Formato estandar</option>
                </select>
              </div>

              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="block w-full text-sm text-slate-700"
              />

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {uploadFormat === 'telefonico' ? (
                  <p>El archivo debe tener una hoja llamada TELEFONICO con la estructura de programacion de Telefonico.</p>
                ) : uploadFormat === 'standard' ? (
                  <p>El archivo debe incluir columnas como nombre, apellido, email, equipo, lider, dia_franco, horario_break y fecha_vigencia_desde.</p>
                ) : (
                  <p>Se intentara detectar automaticamente si el Excel corresponde al formato TELEFONICO o al formato estandar.</p>
                )}
              </div>

              {uploadResult && (
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 text-sm text-blue-900 space-y-1">
                  {uploadResult.format && <p>Formato detectado: {uploadResult.format}</p>}
                  <p>Procesados: {uploadResult.processed}</p>
                  <p>Creados: {uploadResult.created}</p>
                  <p>Actualizados: {uploadResult.updated}</p>
                  <p>Equipos creados: {uploadResult.teamsCreated}</p>
                  <p>Lideres asignados: {uploadResult.leadersAssigned}</p>
                  <p>Errores: {uploadResult.errors.length}</p>
                </div>
              )}

              {uploadErrors.length > 0 && (
                <div className="max-h-64 overflow-y-auto rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <p className="font-medium mb-3">Errores encontrados ({uploadErrors.length})</p>
                  <ul className="space-y-2">
                    {uploadErrors.map((uploadError, index) => (
                      <li key={`${index}-${'row' in uploadError ? uploadError.row : uploadError.dni}`}>
                        {'row' in uploadError
                          ? `Fila ${uploadError.row}, ${uploadError.field}: ${uploadError.message}`
                          : `Registro ${uploadError.dni}: ${uploadError.error}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-between gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadFormat('auto');
                  setUploadErrors([]);
                }}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button onClick={handleUploadExcel} disabled={isUploading || !uploadFile}>
                {isUploading ? 'Procesando...' : 'Cargar Excel'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para cargar nómina */}
      {showNominaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Cargar Nómina</h3>
              <p className="text-sm text-slate-500 mt-1">Importa agentes y líderes desde el archivo Excel</p>
            </div>

            <div className="p-6 space-y-4">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleNominaFileSelect}
                className="block w-full text-sm text-slate-700"
              />

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium mb-2">El archivo debe tener las columnas:</p>
                <p className="text-xs">DNI, USUARIO, NOMBRE, SUPERIOR, SEGMENTO, HORARIOS, ESTADO, CONTRATO, SITIO, MODALIDAD, JEFE</p>
              </div>

              {nominaResult && (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-900 space-y-1">
                  <p>Agentes creados: {nominaResult.created}</p>
                  <p>Agentes actualizados: {nominaResult.updated}</p>
                  <p>Líderes identificados: {nominaResult.leaders.length}</p>
                  {nominaResult.errors.length > 0 && <p>Errores: {nominaResult.errors.length}</p>}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-between gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowNominaModal(false);
                  setNominaFile(null);
                  setNominaResult(null);
                }}
                disabled={isUploadingNomina}
              >
                Cancelar
              </Button>
              <Button onClick={handleUploadNomina} disabled={isUploadingNomina || !nominaFile}>
                {isUploadingNomina ? 'Procesando...' : 'Cargar Nómina'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para gestionar emails */}
      {showUsersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Gestionar Emails</h3>
              <p className="text-sm text-slate-500 mt-1">Edita los emails de los usuarios cuando no coincidan con la lógica estándar</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Filtros */}
              <div className="flex flex-wrap gap-3">
                <select
                  value={usersRoleFilter}
                  onChange={(e) => setUsersRoleFilter(e.target.value as 'ALL' | 'LEADER' | 'AGENT')}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="ALL">Todos los roles</option>
                  <option value="LEADER">Líderes</option>
                  <option value="AGENT">Agentes</option>
                </select>

                <input
                  type="text"
                  placeholder="Buscar por nombre, email o DNI..."
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                  className="flex-1 min-w-[200px] px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Lista de usuarios */}
              <div className="border border-slate-200 rounded-xl max-h-96 overflow-y-auto">
                {allUsers.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No hay usuarios encontrados</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-slate-700">Nombre</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-700">Email</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-700">Rol</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-700">DNI</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {allUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">{user.firstName || user.name || '-'}</td>
                          <td className="px-4 py-3">
                            {editingEmail?.userId === user.id ? (
                              <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                                disabled={isUpdatingEmail}
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={user.emailManuallySet ? 'font-medium text-primary-600' : ''}>
                                  {user.email}
                                </span>
                                {user.emailManuallySet && (
                                  <Badge variant="info" className="text-xs">Editado</Badge>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={user.role === 'LEADER' ? 'success' : 'default'}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{user.dni || '-'}</td>
                          <td className="px-4 py-3 text-right">
                            {editingEmail?.userId === user.id ? (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setEditingEmail(null);
                                    setNewEmail('');
                                  }}
                                  disabled={isUpdatingEmail}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleUpdateEmail}
                                  disabled={isUpdatingEmail || !newEmail}
                                >
                                  {isUpdatingEmail ? 'Guardando...' : 'Guardar'}
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleEditEmail(user.id, user.email || '')}
                              >
                                Editar
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowUsersModal(false);
                  setAllUsers([]);
                  setUsersSearch('');
                  setUsersRoleFilter('ALL');
                  setEditingEmail(null);
                }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardBody className="p-6">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-4xl font-bold text-slate-900 mt-2">{value}</p>
      </CardBody>
    </Card>
  );
}
