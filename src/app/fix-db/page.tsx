'use client';

import { useState } from 'react';

export default function FixDbPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);

  const runMigrations = async () => {
    setStatus('loading');
    setResult(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'migrate', password: '__RUN_MIGRATIONS__' }),
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
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Reparar Base de Datos</h1>
        <p className="text-slate-600 mb-6">
          Ejecuta las migraciones necesarias para agregar las columnas y tablas faltantes.
        </p>

        <button
          onClick={runMigrations}
          disabled={status === 'loading'}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-colors"
        >
          {status === 'loading' ? 'Ejecutando...' : 'Ejecutar Migraciones'}
        </button>

        {status === 'success' && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <p className="font-semibold text-emerald-900">¡Completado!</p>
            <p className="text-sm text-emerald-700 mt-2">{result?.message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-700 mt-2">{result?.error || 'Error desconocido'}</p>
          </div>
        )}

        {result?.results && (
          <div className="mt-6">
            <h2 className="font-semibold text-slate-900 mb-2">Resultados:</h2>
            <div className="max-h-64 overflow-y-auto bg-slate-50 rounded-xl p-4 text-xs font-mono">
              {result.results.map((r: any, i: number) => (
                <div key={i} className={r.success ? 'text-emerald-700' : 'text-red-700'}>
                  {r.success ? '✓' : '✗'} {r.migration}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
