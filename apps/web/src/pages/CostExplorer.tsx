import { TopResourcesTable } from '../components/tables/TopResourcesTable';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { useState } from 'react';
import { startOfMonth } from 'date-fns';

export function CostExplorer() {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfMonth(new Date()),
    end: new Date()
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cost Explorer</h1>
            <p className="mt-2 text-sm text-gray-600">
              Analyze your cloud costs by resource, service, and region
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <DateRangePicker
              value={dateRange}
              onChange={(range) => range && setDateRange(range)}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 mb-8 md:grid-cols-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900">$45,231</p>
              <p className="text-xs text-green-600 mt-1">-8.2% from last period</p>
            </div>
            <div className="text-primary-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resources</p>
              <p className="text-2xl font-bold text-gray-900">847</p>
              <p className="text-xs text-red-600 mt-1">+23 new this month</p>
            </div>
            <div className="text-blue-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Service</p>
              <p className="text-2xl font-bold text-gray-900">EC2</p>
              <p className="text-xs text-gray-600 mt-1">38% of total spend</p>
            </div>
            <div className="text-green-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Untagged</p>
              <p className="text-2xl font-bold text-gray-900">124</p>
              <p className="text-xs text-orange-600 mt-1">14.6% of resources</p>
            </div>
            <div className="text-orange-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Top Resources Table */}
      <TopResourcesTable />
    </div>
  );
}