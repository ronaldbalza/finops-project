import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'EC2', value: 45000, percentage: 31.6 },
  { name: 'RDS', value: 28000, percentage: 19.7 },
  { name: 'S3', value: 18000, percentage: 12.7 },
  { name: 'CloudFront', value: 15000, percentage: 10.6 },
  { name: 'Lambda', value: 12000, percentage: 8.5 },
  { name: 'DynamoDB', value: 10000, percentage: 7.0 },
  { name: 'Other', value: 14350, percentage: 10.1 },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#94a3b8'];

export function ServiceBreakdownChart() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Service Breakdown</h3>
        <p className="text-sm text-gray-500">Cost distribution by AWS service</p>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 space-y-2">
        {data.slice(0, 5).map((item, index) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: COLORS[index] }}
              />
              <span className="text-gray-600">{item.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 font-medium">${(item.value / 1000).toFixed(1)}k</span>
              <span className="text-gray-500">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}