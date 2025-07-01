import { useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/api';

interface Tenant {
  id: string;
  name: string;
  status: string;
}



export default function AdminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [totalUserCount, setTotalUserCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const { authFetch } = useAuth();

  useEffect(() => {
    const fetchMetrics = async () => {
      setError(null);
      try {
        // Get tenants
        const tenantsRes = await authFetch(`${API_BASE_URL}/api/admin/tenants`);
        if (!tenantsRes.ok) {
          throw new Error('Failed to fetch tenants');
        }
        const tenantsData = await tenantsRes.json();
        setTenants(Array.isArray(tenantsData) ? tenantsData : []);

        // Get users count
        const usersRes = await authFetch(`${API_BASE_URL}/api/admin/users`);
        const userData = await usersRes.json();
        
        if (!usersRes.ok) {
          throw new Error(userData.error || 'Failed to fetch user count');
        }
        
        setTotalUserCount(userData.count || 0);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load dashboard metrics';
        setError(message);
        showToast(`❌ ${message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [authFetch, showToast]);

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.status === 'active').length;
  const inactiveTenants = tenants.filter(t => t.status === 'inactive').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Welcome to your Super Admin control panel</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
          <span>🕐</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))
        ) : error ? (
          <div className="col-span-full">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
              <span className="text-red-600 dark:text-red-400 text-lg">⚠️</span>
              <p className="text-red-700 dark:text-red-300 mt-2">{error}</p>
            </div>
          </div>
        ) : (
          <>
            <MetricCard 
              label="Total Tenants" 
              value={totalTenants} 
              icon="🏢"
              color="blue"
              trend={{ value: 12, isPositive: true }}
            />
            <MetricCard 
              label="Active Tenants" 
              value={activeTenants} 
              icon="✅"
              color="green"
              trend={{ value: 8, isPositive: true }}
            />
            <MetricCard 
              label="Inactive Tenants" 
              value={inactiveTenants} 
              icon="⏸️"
              color="yellow"
              trend={{ value: 2, isPositive: false }}
            />
            <MetricCard 
              label="Total Users" 
              value={totalUserCount} 
              icon="👥"
              color="purple"
              trend={{ value: 15, isPositive: true }}
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard 
            title="Manage Tenants"
            description="Create, edit, and manage tenant organizations"
            icon="🏢"
            href="/admin/tenants"
          />
          <QuickActionCard 
            title="User Management"
            description="View and manage all system users"
            icon="👥"
            href="/admin/users"
          />
          <QuickActionCard 
            title="Data Integration"
            description="Configure data sources and integrations"
            icon="🔗"
            href="/admin/data-integration"
          />
          <QuickActionCard 
            title="System Analytics"
            description="View detailed system usage analytics"
            icon="📊"
            href="#"
          />
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function MetricCard({ label, value, icon, color, trend }: MetricCardProps) {
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
        {trend && (
          <div className={`flex items-center text-sm ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            <span className="mr-1">{trend.isPositive ? '↗️' : '↘️'}</span>
            <span>{trend.value}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">{label}</p>
        <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

function QuickActionCard({ title, description, icon, href }: { title: string; description: string; icon: string; href: string }) {
  return (
    <a 
      href={href}
      className="block p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors duration-200 group"
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
    </a>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-600 rounded-lg"></div>
        <div className="w-12 h-4 bg-slate-200 dark:bg-slate-600 rounded"></div>
      </div>
      <div>
        <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-2/3 mb-2"></div>
        <div className="h-8 bg-slate-200 dark:bg-slate-600 rounded w-1/2"></div>
      </div>
    </div>
  );
}
