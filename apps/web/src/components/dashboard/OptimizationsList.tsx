import { LightBulbIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface Optimization {
  id: string;
  title: string;
  type: 'RIGHTSIZING' | 'RESERVED_INSTANCES' | 'WASTE_REDUCTION' | 'SAVINGS_PLANS';
  savings: number;
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
}

const optimizations: Optimization[] = [
  {
    id: '1',
    title: 'Rightsize 5 oversized RDS instances',
    type: 'RIGHTSIZING',
    savings: 2450,
    effort: 'LOW',
    impact: 'HIGH',
  },
  {
    id: '2',
    title: 'Purchase RIs for steady-state EC2',
    type: 'RESERVED_INSTANCES',
    savings: 4200,
    effort: 'MEDIUM',
    impact: 'HIGH',
  },
  {
    id: '3',
    title: 'Delete 23 unattached EBS volumes',
    type: 'WASTE_REDUCTION',
    savings: 680,
    effort: 'LOW',
    impact: 'LOW',
  },
  {
    id: '4',
    title: 'Convert to Savings Plans',
    type: 'SAVINGS_PLANS',
    savings: 3100,
    effort: 'MEDIUM',
    impact: 'HIGH',
  },
  {
    id: '5',
    title: 'Terminate idle dev environments',
    type: 'WASTE_REDUCTION',
    savings: 1250,
    effort: 'LOW',
    impact: 'MEDIUM',
  },
];

const typeColors = {
  RIGHTSIZING: 'bg-blue-100 text-blue-800',
  RESERVED_INSTANCES: 'bg-purple-100 text-purple-800',
  WASTE_REDUCTION: 'bg-red-100 text-red-800',
  SAVINGS_PLANS: 'bg-green-100 text-green-800',
};

const effortColors = {
  LOW: 'text-green-600',
  MEDIUM: 'text-yellow-600',
  HIGH: 'text-red-600',
};

export function OptimizationsList() {
  const totalSavings = optimizations.reduce((sum, opt) => sum + opt.savings, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Optimization Opportunities</h3>
          <LightBulbIcon className="h-5 w-5 text-yellow-500" />
        </div>
        <p className="text-sm text-gray-500">
          Potential monthly savings: <span className="font-semibold text-green-600">${totalSavings.toLocaleString()}</span>
        </p>
      </div>

      <div className="space-y-3">
        {optimizations.map((opt) => (
          <div
            key={opt.id}
            className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-medium text-gray-900 flex-1">{opt.title}</p>
              <ArrowRightIcon className="h-4 w-4 text-gray-400 ml-2" />
            </div>

            <div className="flex items-center justify-between">
              <span
                className={clsx(
                  'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                  typeColors[opt.type]
                )}
              >
                {opt.type.replace(/_/g, ' ')}
              </span>
              <div className="flex items-center space-x-3 text-xs">
                <span className={effortColors[opt.effort]}>
                  {opt.effort} effort
                </span>
                <span className="font-semibold text-green-600">
                  ${opt.savings.toLocaleString()}/mo
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors">
        View All Recommendations
      </button>
    </div>
  );
}