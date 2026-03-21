'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-9-9-9-9m0 0a2 2 0 00-2-2h9a2 2 0 00-2 2v9a2 2 0 002 2h-9a2 2 0 00-2-2v2zm-11 9l9-9 9-9m0 0a2 2 0 00-2-2h9a2 2 0 00-2 2v9a2 2 0 002 2h-9a2 2 0 00-2-2v2zm-11 9l9-9 9-9m0 0a2 2 0 00-2-2h9a2 2 0 00-2 2v9a2 2 0 002 2h-9a2 2 0 00-2-2v2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Página no encontrada
            </h1>
            <p className="text-slate-600 mt-2">
              La página que buscas no existe o no tienes acceso.
            </p>
          </div>

          <Link
            href="/"
            className="w-full bg-slate-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-slate-700 transition-colors"
          >
            Volver al inicio
          </Link>

          <p className="mt-6 text-sm text-slate-500">
            Si crees que esto es un error, contacte al equipo de soporte.
          </p>
        </div>
      </div>
    </div>
  );
}
