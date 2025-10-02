import { useEffect, useState } from 'react';
import { clsx } from 'clsx';

export function AllocationGauge() {
  const [percentage, setPercentage] = useState(0);
  const targetPercentage = 78;
  const targetGoal = 80;

  useEffect(() => {
    // Animate the gauge on mount
    const timer = setTimeout(() => {
      setPercentage(targetPercentage);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const getColor = (value: number) => {
    if (value >= 90) return 'text-green-600';
    if (value >= 70) return 'text-primary-600';
    if (value >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStrokeColor = (value: number) => {
    if (value >= 90) return '#16a34a'; // green-600
    if (value >= 70) return '#2563eb'; // primary-600
    if (value >= 50) return '#ca8a04'; // yellow-600
    return '#dc2626'; // red-600
  };

  // Calculate SVG path for the gauge
  const radius = 80;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * Math.PI * 1.5; // 3/4 circle
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Cost Allocation Coverage</h3>
        <p className="text-sm text-gray-500">Percentage of costs allocated to teams</p>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative">
          <svg height={radius * 2} width={radius * 2}>
            {/* Background arc */}
            <circle
              stroke="#e5e7eb"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{ strokeLinecap: 'round' }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              transform={`rotate(135 ${radius} ${radius})`}
            />
            {/* Progress arc */}
            <circle
              stroke={getStrokeColor(percentage)}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{
                strokeDashoffset,
                strokeLinecap: 'round',
                transition: 'stroke-dashoffset 1s ease-in-out',
              }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              transform={`rotate(135 ${radius} ${radius})`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={clsx('text-3xl font-bold', getColor(percentage))}>
              {percentage}%
            </span>
            <span className="text-sm text-gray-500">allocated</span>
          </div>
        </div>

        <div className="mt-6 w-full space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Current</span>
            <span className="font-medium text-gray-900">{percentage}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Target (Crawl)</span>
            <span className="font-medium text-gray-900">{targetGoal}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Unallocated</span>
            <span className="font-medium text-red-600">${((100 - percentage) * 1423.5).toFixed(0)}</span>
          </div>
        </div>

        {percentage < targetGoal && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-md">
            <p className="text-xs text-yellow-800">
              <span className="font-medium">Action needed:</span> {targetGoal - percentage}% more allocation
              required to meet target. Focus on tagging unallocated resources.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}