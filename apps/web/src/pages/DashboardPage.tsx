import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { KPICard } from '../components/dashboard/KPICard';
import { CostTrendChart } from '../components/charts/CostTrendChart';
import { ServiceBreakdownChart } from '../components/charts/ServiceBreakdownChart';
import { AllocationGauge } from '../components/dashboard/AllocationGauge';
import { OptimizationsList } from '../components/dashboard/OptimizationsList';
import { AnomaliesList } from '../components/dashboard/AnomaliesList';

// Mock data for development
const kpiData = {
  currentMonthSpend: 142350.67,
  lastMonthSpend: 135200.45,
  forecastedSpend: 148000.00,
  savingsRealized: 12450.00,
  allocationPercentage: 78,
  effectiveSavingsRate: 0.145,
  unitCost: 23.45,
  budgetUtilization: 72,
};

export function DashboardPage() {
  const spendChange = ((kpiData.currentMonthSpend - kpiData.lastMonthSpend) / kpiData.lastMonthSpend) * 100;
  const isSpendUp = spendChange > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900">FinOps Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Real-time cloud cost visibility and optimization insights
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Current Month Spend"
          value={`$${kpiData.currentMonthSpend.toLocaleString()}`}
          change={spendChange}
          changeLabel={`vs last month`}
          trend={isSpendUp ? 'up' : 'down'}
          icon={isSpendUp ? ArrowUpIcon : ArrowDownIcon}
        />

        <KPICard
          title="Forecasted Spend"
          value={`$${kpiData.forecastedSpend.toLocaleString()}`}
          subtitle="End of month projection"
          info="Based on current run rate"
        />

        <KPICard
          title="Savings Realized"
          value={`$${kpiData.savingsRealized.toLocaleString()}`}
          change={15.2}
          changeLabel="YTD savings"
          trend="up"
          positive
        />

        <KPICard
          title="Effective Savings Rate"
          value={`${(kpiData.effectiveSavingsRate * 100).toFixed(1)}%`}
          subtitle="Target: 15%"
          progress={(kpiData.effectiveSavingsRate / 0.15) * 100}
        />
      </div>

      {/* Second row of KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Cost Allocation"
          value={`${kpiData.allocationPercentage}%`}
          subtitle="Target: 80%"
          progress={(kpiData.allocationPercentage / 80) * 100}
        />

        <KPICard
          title="Unit Cost"
          value={`$${kpiData.unitCost}`}
          subtitle="Per customer"
          change={-5.3}
          changeLabel="vs last month"
          trend="down"
          positive
        />

        <KPICard
          title="Budget Utilization"
          value={`${kpiData.budgetUtilization}%`}
          subtitle="$142k of $197k"
          progress={kpiData.budgetUtilization}
        />

        <KPICard
          title="Optimization Score"
          value="B+"
          subtitle="Good performance"
          info="3 new recommendations"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CostTrendChart />
        </div>
        <div className="lg:col-span-1">
          <ServiceBreakdownChart />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AllocationGauge />
        </div>
        <div className="lg:col-span-1">
          <OptimizationsList />
        </div>
        <div className="lg:col-span-1">
          <AnomaliesList />
        </div>
      </div>
    </div>
  );
}