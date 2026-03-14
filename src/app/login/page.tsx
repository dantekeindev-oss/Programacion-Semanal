'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (err) {
      setError('Error al iniciar sesión con Google');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg mb-4">
            <svg className="w-10 h-10 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0M9 21h6m-6 0h-6m6 0h6v-2a2 2 0 00-2-2H7a2 2 0 00-2 2v2m12 0v-4a2 2 0 00-2 2h5.586a1 1 0 011.586 0 012 0l.001.033 5.375.013.009-.006.032.006l-.012.001.002a1 1 0 011.994.994.994.994z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">
            Gestor de Horarios
          </h1>
          <p className="text-slate-300 mt-2">
            Sistema corporativo de gestión de turnos
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">
            Iniciar Sesión
          </h2>
          <p className="text-slate-600 mb-6">
            Ingresa con tu cuenta corporativa @konecta.com
          </p>

          {/* Domain Warning */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.583-9.92a1 1 0 00-1.414-1.414L9 10.586 4.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-amber-900">
                  Restricción de Acceso
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Solo se permiten cuentas del dominio <span className="font-mono bg-amber-100 px-2 py-1 rounded">@konecta.com</span>
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  Contacta a soporte si necesitas una cuenta corporativa.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414 1.414L11.414 10l1.293 1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 h-14 text-base font-medium"
            variant="secondary"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-3"></div>
                Iniciando sesión...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12c-.7.775 0-1.33-.257-1.486l-5.583-9.92c-.78-1.36-2.722-1.36-3.486 0l5.583 9.92a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 001.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
                Continuar con Google
              </>
            )}
          </Button>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-start gap-3 text-xs text-slate-500">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 000 16zm-7-4a1 1 0 00-1 414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414 1.414L11.414 10l1.293 1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="flex-1">
                Para ingresar como <span className="font-semibold">Administrador</span>, usa el email dantekein90151@gmail.com
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-sm mt-8">
          © 2026 Gestor de Horarios. Sistema de gestión para @konecta.com
        </p>
      </div>
    </div>
  );
}
