import Link from 'next/link';

type ErrorPageProps = {
  searchParams?: {
    error?: string;
  };
};

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: 'Solo se permiten cuentas corporativas @konecta.com para el acceso con Google.',
  Configuration: 'La autenticacion con Google no esta configurada correctamente.',
  Verification: 'El enlace de acceso no es valido o ya expiro.',
  Default: 'No se pudo completar el inicio de sesion.',
};

export default function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const errorCode = searchParams?.error || 'Default';
  const message = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.Default;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl p-8 md:p-12">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Konecta</p>
        <h1 className="mt-4 text-3xl font-bold text-white">No se pudo iniciar sesion</h1>
        <p className="mt-4 text-base text-slate-300">{message}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-2xl bg-white text-slate-900 px-5 py-4 font-semibold text-center hover:bg-slate-100 transition-colors"
          >
            Volver al inicio
          </Link>
          <Link
            href="/admin/login"
            className="rounded-2xl border border-slate-700 px-5 py-4 font-semibold text-center text-slate-100 hover:bg-slate-800 transition-colors"
          >
            Ir al panel admin
          </Link>
        </div>

        <p className="mt-8 text-sm text-slate-400">
          Codigo de error: <span className="font-mono">{errorCode}</span>
        </p>
      </div>
    </main>
  );
}
