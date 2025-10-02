import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

// Mock data - will be replaced with API calls
const generateMockData = () => {
  const data = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    data.push({
      date: format(date, 'MMM dd'),
      actual: Math.floor(Math.random() * 2000) + 3000 + (29 - i) * 50,
      forecast: Math.floor(Math.random() * 1000) + 3500 + (29 - i) * 55,
      budget: 4500,
    });
  }

  return data;
};

const data = generateMockData();

export function CostTrendChart() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Cost Trend Analysis</h3>
        <p className="text-sm text-gray-500">Daily cloud spend over the last 30 days</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value: number) => `$${value.toLocaleString()}`}
            labelStyle={{ color: '#111827' }}
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Actual Spend"
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Forecast"
          />
          <Line
            type="monotone"
            dataKey="budget"
            stroke="#ef4444"
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
            name="Budget"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-primary-500 rounded-full mr-2"></div>
          <span className="text-gray-600">MTD: $112,350</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Forecast: $148,000</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Budget: $135,000</span>
        </div>
      </div>
    </div>
  );
}