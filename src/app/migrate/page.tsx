'use client';

import { useState } from 'react';

export default function MigratePage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);

  const runMigrations = async () => {
    setStatus('loading');
    setResult(null);

    try {
      const res = await fetch('/api/admin/migrate', {
        method: 'POST',
      });

      const data = await res.json();
      setResult(data);

      if (data.success) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
      setResult({ error: error instanceof Error ? error.message : 'Error desconocido' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Migraciones de Base de Datos</h1>
        <p className="text-slate-600 mb-6">
          Este endpoint ejecuta las migraciones necesarias para agregar las columnas y tablas faltantes en la base de datos.
        </p>

        <button
          onClick={runMigrations}
          disabled={status === 'loading'}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-colors"
        >
          {status === 'loading' ? 'Ejecutando migraciones...' : 'Ejecutar Migraciones'}
        </button>

        {status === 'success' && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <p className="font-semibold text-emerald-900">¡Migraciones completadas!</p>
            <p className="text-sm text-emerald-700 mt-2">
              {result?.message || 'Base de datos actualizada correctamente'}
            </p>
            <p className="text-sm text-emerald-700 mt-2">
              Agentes creados: {result?.data?.created || 0}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="font-semibold text-red-900">Error al ejecutar migraciones</p>
            <p className="text-sm text-red-700 mt-2">
              {result?.error || 'Error desconocido'}
            </p>
          </div>
        )}

        {result?.results && (
          <div className="mt-6">
            <h2 className="font-semibold text-slate-900 mb-2">Detalles:</h2>
            <div className="max-h-64 overflow-y-auto bg-slate-50 rounded-xl p-4 text-xs font-mono">
              {result.results.map((r: any, i: number) => (
                <div key={i} className={r.success ? 'text-emerald-700' : 'text-red-700'}>
                  {r.success ? '✓' : '✗'} {r.migration}
                  {r.error && <span className="text-red-500"> - {r.error}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
