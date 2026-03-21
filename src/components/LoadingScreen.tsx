'use client';

import Image from 'next/image';

type LoadingScreenProps = {
  message?: string;
};

export function LoadingScreen({ message = 'Cargando...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary-25 via-white to-primary-50">
      <div className="flex flex-col items-center gap-6">
        {/* Logo con animación */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary-200/30"></div>
          <div className="relative h-24 w-24 animate-bounce">
            <Image
              src="/logo.jpg"
              alt="Konecta"
              width={96}
              height={96}
              className="h-full w-full rounded-2xl object-contain shadow-xl"
            />
          </div>
        </div>

        {/* Mensaje */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-semibold text-slate-700">{message}</p>

          {/* Spinner */}
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.3s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.15s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-primary-500"></div>
          </div>
        </div>

        {/* Brand */}
        <p className="text-sm font-semibold uppercase tracking-widest text-primary-600">
          Konecta
        </p>
      </div>
    </div>
  );
}
