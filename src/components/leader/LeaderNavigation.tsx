'use client';

import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function LeaderNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { href: '/leader/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/leader/team', label: 'Mi Equipo', icon: '👥' },
    { href: '/leader/requests', label: 'Solicitudes', icon: '📋' },
    { href: '/leader/upload', label: 'Cargar Excel', icon: '📥' },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/leader/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0M9 21h6m-6 0h-6m6 0h-6v-2a2 2 0 00-2-2H7a2 2 0 00-2 2v2m12 0v-4a2 2 0 00-2-2H7a2 2 0 00-2 2v4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900">Gestor de Horarios</span>
            </Link>
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname === item.href
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3 pl-4 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold shadow-sm">
                {session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-slate-900">
                  {session?.user?.firstName || session?.user?.name || 'Usuario'}
                </p>
                <p className="text-xs text-slate-500">Líder</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-slate-200 px-4 py-2">
        <div className="flex space-x-2 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === item.href
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
