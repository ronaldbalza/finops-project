import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200';

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const variantClasses = {
    text: 'rounded-md h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={cn(
        baseClasses,
        animationClasses[animation],
        variantClasses[variant],
        className
      )}
      style={style}
    />
  );
}

// Skeleton components for specific use cases
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-lg shadow p-6', className)}>
      <Skeleton variant="text" width="60%" height={24} className="mb-4" />
      <Skeleton variant="text" width="40%" height={16} className="mb-2" />
      <Skeleton variant="text" width="80%" height={16} className="mb-2" />
      <Skeleton variant="text" width="70%" height={16} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <Skeleton variant="text" width="30%" height={20} />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <Skeleton variant="text" width="80%" height={16} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <Skeleton variant="text" width="90%" height={16} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SkeletonChart({ height = 300 }: { height?: number }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Skeleton variant="text" width="40%" height={20} className="mb-4" />
      <Skeleton variant="rectangular" width="100%" height={height} className="rounded-md" />
    </div>
  );
}

export function SkeletonKPICard() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="text" width={60} height={16} />
      </div>
      <Skeleton variant="text" width="70%" height={32} className="mb-2" />
      <Skeleton variant="text" width="50%" height={16} />
    </div>
  );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <Skeleton variant="text" width="40%" height={20} />
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="p-4 flex items-center space-x-4">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="flex-1">
              <Skeleton variant="text" width="60%" height={16} className="mb-2" />
              <Skeleton variant="text" width="40%" height={14} />
            </div>
            <Skeleton variant="text" width={80} height={16} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonKPICard />
        <SkeletonKPICard />
        <SkeletonKPICard />
        <SkeletonKPICard />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart height={250} />
      </div>

      {/* Table */}
      <SkeletonTable />
    </div>
  );
}