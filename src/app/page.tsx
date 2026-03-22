import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signIn } from '@/lib/auth';
import { BrandLogo } from '@/components/BrandLogo';
import MigrateButton from './migrate-button';

// Force redeploy - v3
export default async function Home() {
  const session = await auth();

  if (session?.user) {
    const userRole = session.user.role as string;
    const userEmail = session.user.email;

    if (userRole === 'ADMIN' || userEmail === (process.env.ADMIN_EMAIL || 'dantekein90151@gmail.com')) {
      redirect('/admin/dashboard');
    }

    if (userRole === 'LEADER') {
      redirect('/leader/dashboard');
    }

    redirect('/agent/dashboard');
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-25 via-white to-primary-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-200/40 to-primary-100/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-primary-300/30 to-primary-200/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary-100/20 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-2xl glass-card shadow-soft-blue-lg p-8 md:p-12 relative z-10">
        {/* Logo/Brand section */}
        <BrandLogo size="md" priority title="Gestor de Horarios" subtitle="Konecta" />

        <h1 className="mt-6 text-4xl font-bold text-slate-900">Tu espacio de gestion semanal</h1>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          Plataforma interna para gestión de horarios, solicitudes y equipos.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <form
            action={async () => {
              'use server';
              await signIn('google', { redirectTo: '/' });
            }}
          >
            <button
              type="submit"
              className="w-full rounded-xl bg-white text-slate-900 px-5 py-4 font-semibold text-center hover:bg-primary-50 hover:border-primary-300 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Ingresar con Google
            </button>
          </form>
          <Link
            href="/admin/login"
            className="rounded-xl border border-slate-200 px-5 py-4 font-semibold text-center text-slate-700 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-300 transition-all duration-200"
          >
            Panel de Administración
          </Link>
        </div>

        <div className="mt-8 rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50 to-primary-25 p-4 text-sm">
          <p className="text-slate-700">
            <span className="font-semibold text-primary-700">Acceso corporativo:</span> Habilidado para cuentas{' '}
            <span className="font-mono font-semibold text-primary-600">@konecta.com</span>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <MigrateButton />
          <p className="text-xs text-slate-500 mt-4">
            Sistema de Gestión de Horarios © {new Date().getFullYear()} Konecta
          </p>
        </div>
      </div>
    </main>
  );
}
