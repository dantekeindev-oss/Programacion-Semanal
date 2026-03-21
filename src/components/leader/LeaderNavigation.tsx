'use client';

import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { BrandLogo } from '@/components/BrandLogo';

export default function LeaderNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { href: '/leader/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/leader/team', label: 'Mi Equipo', icon: '👥' },
    { href: '/leader/requests', label: 'Solicitudes', icon: '📋' },
    { href: '/leader/swap', label: 'Enroques', icon: '🔄' },
    { href: '/leader/upload', label: 'Cargar Excel', icon: '📥' },
  ];

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <BrandLogo href="/leader/dashboard" size="sm" subtitle="Konecta" />
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    pathname === item.href
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-md shadow-primary-200'
                      : 'text-slate-600 hover:text-primary-600 hover:bg-primary-50'
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
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold shadow-md shadow-primary-200">
                {session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-slate-900">
                  {session?.user?.firstName || session?.user?.name || 'Usuario'}
                </p>
                <p className="text-xs text-primary-600 font-medium">Líder</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors px-3 py-2 rounded-xl hover:bg-primary-50"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-slate-200 px-4 py-3 bg-white/50 backdrop-blur-sm">
        <div className="flex space-x-2 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                pathname === item.href
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-md'
                  : 'text-slate-600 hover:bg-primary-50 hover:text-primary-600'
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
