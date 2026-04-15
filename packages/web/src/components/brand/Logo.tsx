import React from 'react';

/**
 * REENTRY logomark — two arcs (the release, the return) forming a door.
 * Monochrome by default, takes a `color` prop so it can invert on dark
 * surfaces without importing a separate asset.
 */
export function Logo({
  size = 28,
  color = 'currentColor',
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="REENTRY"
      className={className}
    >
      {/* outer arc — the door frame */}
      <path
        d="M4 28 V14 A12 12 0 0 1 28 14 V28"
        stroke={color}
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      {/* inner rising path — the way forward */}
      <path
        d="M10 28 V18 A6 6 0 0 1 22 18 V28"
        stroke={color}
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      {/* horizon line */}
      <line x1="3" y1="28" x2="29" y2="28" stroke={color} strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

export function LogoMark({
  className = '',
  subtitle,
}: {
  className?: string;
  subtitle?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Logo color="currentColor" size={28} />
      <div className="flex flex-col leading-tight">
        <span className="font-display font-bold tracking-tight text-[1.05rem]">REENTRY</span>
        {subtitle && (
          <span className="text-[11px] uppercase tracking-wider text-slate-500">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
