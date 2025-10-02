import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';

interface Anomaly {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  cost: number;
  service: string;
  detected: Date;
  status: 'NEW' | 'INVESTIGATING' | 'RESOLVED';
}

const anomalies: Anomaly[] = [
  {
    id: '1',
    title: 'Unusual spike in EC2 usage',
    description: '250% increase in m5.xlarge instances in us-east-1',
    severity: 'HIGH',
    cost: 3200,
    service: 'EC2',
    detected: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    status: 'NEW',
  },
  {
    id: '2',
    title: 'Data transfer costs increased',
    description: 'Egress charges up 180% compared to baseline',
    severity: 'MEDIUM',
    cost: 890,
    service: 'CloudFront',
    detected: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    status: 'INVESTIGATING',
  },
  {
    id: '3',
    title: 'Unexpected NAT Gateway charges',
    description: 'New NAT Gateway in ap-southeast-1 not in inventory',
    severity: 'LOW',
    cost: 245,
    service: 'VPC',
    detected: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    status: 'NEW',
  },
  {
    id: '4',
    title: 'RDS backup storage surge',
    description: 'Backup retention increased without approval',
    severity: 'MEDIUM',
    cost: 567,
    service: 'RDS',
    detected: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    status: 'RESOLVED',
  },
];

const severityConfig = {
  CRITICAL: {
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    iconColor: 'text-red-500',
  },
  HIGH: {
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    iconColor: 'text-orange-500',
  },
  MEDIUM: {
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-500',
  },
  LOW: {
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-500',
  },
};

const statusIcons = {
  NEW: ExclamationTriangleIcon,
  INVESTIGATING: ExclamationTriangleIcon,
  RESOLVED: CheckCircleIcon,
};

export function AnomaliesList() {
  const activeAnomalies = anomalies.filter(a => a.status !== 'RESOLVED');
  const totalImpact = activeAnomalies.reduce((sum, a) => sum + a.cost, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Cost Anomalies</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {activeAnomalies.length} active
          </span>
        </div>
        <p className="text-sm text-gray-500">
          Estimated impact: <span className="font-semibold text-red-600">${totalImpact.toLocaleString()}/day</span>
        </p>
      </div>

      <div className="space-y-3">
        {anomalies.map((anomaly) => {
          const StatusIcon = statusIcons[anomaly.status];
          const severityStyle = severityConfig[anomaly.severity];

          return (
            <div
              key={anomaly.id}
              className={clsx(
                'p-3 border rounded-lg cursor-pointer transition-colors',
                anomaly.status === 'RESOLVED'
                  ? 'border-gray-200 bg-gray-50 opacity-60'
                  : 'border-gray-200 hover:bg-gray-50'
              )}
            >
              <div className="flex items-start space-x-3">
                <StatusIcon
                  className={clsx(
                    'h-5 w-5 mt-0.5 flex-shrink-0',
                    anomaly.status === 'RESOLVED' ? 'text-green-500' : severityStyle.iconColor
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {anomaly.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {anomaly.description}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={clsx(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                          anomaly.status === 'RESOLVED'
                            ? 'bg-green-100 text-green-800'
                            : severityStyle.bgColor + ' ' + severityStyle.textColor
                        )}
                      >
                        {anomaly.status === 'RESOLVED' ? 'RESOLVED' : anomaly.severity}
                      </span>
                      <span className="text-xs text-gray-500">
                        {anomaly.service}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(anomaly.detected, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="mt-4 w-full px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors">
        View Anomaly Details
      </button>
    </div>
  );
}