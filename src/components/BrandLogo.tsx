import Image from 'next/image';
import Link from 'next/link';

type BrandLogoProps = {
  href?: string;
  title?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  stacked?: boolean;
  priority?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: {
    frame: 'h-10 w-10 rounded-xl p-1.5',
    text: 'text-lg',
    subtitle: 'text-[11px]',
  },
  md: {
    frame: 'h-14 w-14 rounded-2xl p-2',
    text: 'text-xl',
    subtitle: 'text-xs',
  },
  lg: {
    frame: 'h-24 w-24 rounded-[28px] p-3',
    text: 'text-2xl',
    subtitle: 'text-sm',
  },
};

export function BrandLogo({
  href,
  title = 'Gestor de Horarios',
  subtitle = 'Konecta',
  size = 'md',
  stacked = false,
  priority = false,
  className = '',
}: BrandLogoProps) {
  const classes = sizeClasses[size];
  const content = (
    <div className={`flex items-center gap-3 ${stacked ? 'flex-col text-center' : ''} ${className}`.trim()}>
      <div className={`flex items-center justify-center overflow-hidden bg-white shadow-lg ring-1 ring-slate-200/80 ${classes.frame}`}>
        <Image
          src="/logo.jpg"
          alt="Logo de Konecta"
          width={160}
          height={160}
          className="h-full w-full rounded-[inherit] object-contain"
          priority={priority}
        />
      </div>
      <div>
        <p className={`${classes.text} font-bold leading-none text-slate-900`}>{title}</p>
        <p className={`${classes.subtitle} mt-1 font-semibold uppercase tracking-[0.25em] text-primary-600`}>
          {subtitle}
        </p>
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="inline-flex">
      {content}
    </Link>
  );
}
