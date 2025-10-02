import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  LightBulbIcon,
  DocumentChartBarIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  ChartPieIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useAuthStore, useAppStore } from '../../lib/store';
import { UserMenu } from '../ui/UserMenu';
import { Breadcrumb } from '../ui/Breadcrumb';
import { PageErrorBoundary } from '../ui/ErrorBoundary';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Cost Analysis', href: '/dashboard/costs', icon: CurrencyDollarIcon },
  { name: 'Allocation', href: '/dashboard/allocation', icon: ChartPieIcon },
  { name: 'Optimization', href: '/dashboard/optimization', icon: LightBulbIcon },
  { name: 'Budgets', href: '/dashboard/budgets', icon: BanknotesIcon },
  { name: 'Reports', href: '/dashboard/reports', icon: DocumentChartBarIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
];

export function DashboardLayout() {
  const location = useLocation();
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">FinOps Platform</span>
            </div>
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    className={clsx(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-primary-700' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Tenant Info */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 font-medium text-sm">
                    {user?.tenant?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.tenant?.name}</p>
                <p className="text-xs text-gray-500">Professional Plan</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6 text-gray-500" />
            </button>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-500 hover:text-gray-700">
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
              </button>

              {/* User menu */}
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-2 border-b border-gray-200 bg-white">
            <Breadcrumb />
          </div>
          <PageErrorBoundary>
            <Outlet />
          </PageErrorBoundary>
        </main>
      </div>
    </div>
  );
}