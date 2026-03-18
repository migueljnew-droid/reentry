'use client';

import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 ease-out focus:outline-none focus:ring-4',
        {
          'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus:ring-primary-300':
            variant === 'primary',
          'bg-white text-primary-700 border-2 border-primary-200 hover:border-primary-400 hover:bg-primary-50 focus:ring-primary-300':
            variant === 'secondary',
          'bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800 focus:ring-accent-300':
            variant === 'accent',
          'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300':
            variant === 'ghost',
          'px-4 py-2.5 text-sm min-h-[44px] min-w-[44px]': size === 'sm',
          'px-6 py-3 text-base min-h-[48px] min-w-[48px]': size === 'md',
          'px-8 py-4 text-lg min-h-[56px] min-w-[56px]': size === 'lg',
          'opacity-50 cursor-not-allowed': disabled || loading,
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
