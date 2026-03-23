interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 20, className = '' }: SpinnerProps) {
  return (
    <svg
      className={`animate-spin text-horse-gray-400 ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = 'Cargando...' }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Spinner size={24} />
      <span className="text-sm text-horse-gray-400">{message}</span>
    </div>
  );
}
