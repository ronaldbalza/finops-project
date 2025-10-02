import { clsx } from 'clsx';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'stable';
  icon?: React.ComponentType<{ className?: string }>;
  positive?: boolean;
  progress?: number;
  info?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  change,
  changeLabel,
  trend = 'stable',
  icon: Icon,
  positive = false,
  progress,
  info,
}: KPICardProps) {
  const isPositiveChange = positive || (change && change > 0 && trend === 'up');
  const isNegativeChange = !positive && change && change < 0 && trend === 'up';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {info && (
          <div className="group relative">
            <InformationCircleIcon className="h-4 w-4 text-gray-400 hover:text-gray-500 cursor-help" />
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-10">
              <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                {info}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {Icon && (
          <Icon
            className={clsx(
              'h-5 w-5',
              isPositiveChange ? 'text-green-500' : isNegativeChange ? 'text-red-500' : 'text-gray-400'
            )}
          />
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      )}

      {change !== undefined && (
        <div className="mt-2 flex items-center text-sm">
          <span
            className={clsx(
              'font-medium',
              isPositiveChange ? 'text-green-600' : isNegativeChange ? 'text-red-600' : 'text-gray-600'
            )}
          >
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
          {changeLabel && (
            <span className="ml-1 text-gray-500">{changeLabel}</span>
          )}
        </div>
      )}

      {progress !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={clsx(
                'h-1.5 rounded-full transition-all duration-300',
                progress >= 100 ? 'bg-green-500' : progress >= 70 ? 'bg-primary-500' : 'bg-yellow-500'
              )}
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}