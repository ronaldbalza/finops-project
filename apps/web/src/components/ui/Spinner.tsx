import { cn } from '../../lib/utils';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

export function Spinner({ size = 'md', color = 'primary', className }: SpinnerProps) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'text-primary-600',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  return (
    <svg
      className={cn(
        'animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
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
  );
}

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingOverlay({
  show,
  message = 'Loading...',
  fullScreen = false,
  className,
}: LoadingOverlayProps) {
  if (!show) return null;

  const overlayClasses = fullScreen
    ? 'fixed inset-0 z-50'
    : 'absolute inset-0 z-10';

  return (
    <div
      className={cn(
        overlayClasses,
        'bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center',
        className
      )}
    >
      <Spinner size="lg" />
      {message && (
        <p className="mt-4 text-sm text-gray-600 font-medium">{message}</p>
      )}
    </div>
  );
}

interface ButtonSpinnerProps {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
}

export function ButtonWithSpinner({
  loading = false,
  children,
  className,
  disabled,
  onClick,
  type = 'button',
  variant = 'primary',
}: ButtonSpinnerProps) {
  const baseClasses = 'relative px-4 py-2 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 disabled:bg-primary-400',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-primary-500 disabled:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-400',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        'disabled:cursor-not-allowed',
        className
      )}
    >
      <span className={cn('flex items-center justify-center', loading && 'invisible')}>
        {children}
      </span>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner
            size="sm"
            color={variant === 'secondary' ? 'gray' : 'white'}
          />
        </div>
      )}
    </button>
  );
}

// Page loading component
export function PageLoader({ message = 'Loading page...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Spinner size="xl" className="mx-auto" />
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
}

// Inline loader for data fetching
export function InlineLoader({ text = 'Loading' }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2 text-gray-600">
      <Spinner size="sm" />
      <span className="text-sm">{text}</span>
    </div>
  );
}