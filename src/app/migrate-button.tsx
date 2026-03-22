'use client';

import { useState } from 'react';

// v2 - Force redeploy
export default function MigrateButton() {
  const [status, setStatus] = useState<string>('');
  const [show, setShow] = useState(false);

  const runMigrate = async () => {
    setStatus('Ejecutando...');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'migrate', password: '__RUN_MIGRATIONS__' }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('✓ Completado! Recarga la página.');
      } else {
        setStatus('✗ Error: ' + (data.error || 'desconocido'));
      }
    } catch (e) {
      setStatus('✗ Error: ' + (e instanceof Error ? e.message : 'desconocido'));
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setShow(!show)}
        className="text-xs text-slate-400 hover:text-slate-600 underline"
      >
        {show ? 'Ocultar' : 'Mostrar'} herramientas
      </button>
      {show && (
        <div className="mt-2 p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-600 mb-2">Ejecutar migraciones de BD:</p>
          <button
            onClick={runMigrate}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Ejecutar
          </button>
          {status && <p className="text-xs mt-2 text-slate-700">{status}</p>}
        </div>
      )}
    </div>
  );
}
