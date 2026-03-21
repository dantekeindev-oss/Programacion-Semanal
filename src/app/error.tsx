'use client';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Error',
};

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4-4m0 4v6m4-4-4-4-4m6 0v4m0 4-6" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Algo salio mal
            </h1>
            <p className="text-slate-600 mt-2">
              {error.message || 'Ha ocurrido un error inesperado.'}
            </p>
          </div>

          <button
            onClick={reset}
            className="w-full bg-slate-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-slate-700 transition-colors"
          >
            Intentar nuevamente
          </button>

          <p className="mt-6 text-sm text-slate-500">
            Si el problema persiste, contacte al equipo de soporte.
          </p>
        </div>
      </div>
    </div>
  );
}
