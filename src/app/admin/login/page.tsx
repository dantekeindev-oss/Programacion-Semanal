'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [migrateResult, setMigrateResult] = useState<any>(null);
  const [showMigrate, setShowMigrate] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo iniciar sesion');
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesion');
      setIsLoading(false);
    }
  };

  const handleMigrate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'migrate', password: '__RUN_MIGRATIONS__' }),
      });

      const data = await res.json();
      setMigrateResult(data);

      if (data.success) {
        alert('Migraciones completadas exitosamente');
      } else {
        setError(data.error || 'Error en migraciones');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ejecutar migraciones');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center overflow-hidden rounded-[28px] bg-white/95 p-3 shadow-2xl ring-1 ring-white/20">
            <Image
              src="/logo.jpg"
              alt="Logo de Konecta"
              width={160}
              height={160}
              className="h-full w-full rounded-2xl object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-white">
            Panel de Administracion
          </h1>
          <p className="text-slate-300 mt-2">
            Gestor de Horarios - Konecta
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">
            Iniciar Sesion
          </h2>
          <p className="text-slate-600 mb-6">
            Ingresa tus credenciales de administrador
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414 1.414L11.414 10l1.293 1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-colors"
                placeholder="admin@gmail.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Contrasena
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-medium"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Iniciando sesion...
                </div>
              ) : (
                'Iniciar Sesion'
              )}
            </Button>
          </form>

          {/* TEMPORAL: Botón de migración */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <button
              onClick={() => setShowMigrate(!showMigrate)}
              className="text-xs text-slate-400 underline"
            >
              {showMigrate ? 'Ocultar' : 'Mostrar'} herramientas de reparación
            </button>

            {showMigrate && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-500">
                  Ejecuta las migraciones de base de datos para corregir errores de columnas faltantes.
                </p>
                <Button
                  onClick={handleMigrate}
                  disabled={isLoading}
                  variant="secondary"
                  className="w-full text-sm"
                >
                  Ejecutar Migraciones
                </Button>
                {migrateResult?.results && (
                  <div className="text-xs bg-slate-50 rounded p-2 max-h-32 overflow-y-auto">
                    {migrateResult.results.map((r: any, i: number) => (
                      <div key={i} className={r.success ? 'text-green-700' : 'text-red-700'}>
                        {r.success ? '✓' : '✗'} {r.migration?.substring(0, 60)}...
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-slate-400 text-sm mt-8">
          © 2026 Gestor de Horarios. Sistema de gestion para Konecta
        </p>
      </div>
    </div>
  );
}
