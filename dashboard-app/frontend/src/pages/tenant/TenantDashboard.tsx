import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface DashboardSummary {
  users: number;
  status: string;
}

export default function TenantDashboard() {
  const { auth, authFetch } = useAuth();
  const navigate = useNavigate();
  const tenantId = auth?.type === 'tenant-user' ? auth.tenantId : '';

  const [summary, setSummary] = useState<DashboardSummary>({ users: 0, status: 'Loading...' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    const fetchSummary = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call when ready!
        // const res = await authFetch(`/api/tenant-dashboard-summary/${tenantId}`);
        // const data = await res.json();
        // setSummary({ users: data.userCount, status: data.status });
        await new Promise(resolve => setTimeout(resolve, 800));
        setSummary({ users: 3, status: 'Active Tenant' });
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [tenantId, authFetch]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Welcome to your organization dashboard</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
          <span>🕐</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))
        ) : (
          <>
            <MetricCard 
              label="Available Reports" 
              value={summary.users} 
              icon="📊"
              color="blue"
            />
            <MetricCard 
              label="Organization Status" 
              value={summary.status === 'Active Tenant' ? 'Active' : summary.status} 
              icon="✅"
              color="green"
              isStatus
            />
            <MetricCard 
              label="User Access" 
              value="Enabled" 
              icon="👥"
              color="purple"
              isStatus
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickActionCard 
            title="Browse Reports"
            description="View and access available analytics reports"
            icon="📁"
            onClick={() => navigate('/tenant/reports')}
          />
          <QuickActionCard 
            title="Manage Users"
            description="View and manage organization users"
            icon="👥"
            onClick={() => navigate('/users')}
          />
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
  isStatus?: boolean;
}

function MetricCard({ label, value, icon, color, isStatus = false }: MetricCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color]} rounded-lg flex items-center justify-center shadow-sm`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
      <div>
        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">{label}</p>
        <p className={`text-slate-800 dark:text-slate-200 ${isStatus ? 'text-lg font-semibold' : 'text-3xl font-bold'}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
}

function QuickActionCard({ title, description, icon, onClick }: { title: string; description: string; icon: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="block p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors duration-200 group text-left w-full"
    >
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
          <span className="text-lg">{icon}</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
        </div>
        <span className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">→</span>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-600 rounded-lg"></div>
      </div>
      <div>
        <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-2/3 mb-2"></div>
        <div className="h-8 bg-slate-200 dark:bg-slate-600 rounded w-1/2"></div>
      </div>
    </div>
  );
}
