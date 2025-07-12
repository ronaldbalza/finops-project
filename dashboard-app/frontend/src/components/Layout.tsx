import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // <-- use contexts/AuthContext here
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import ChatLauncher from './ChatLauncher';
import { API_BASE_URL } from '../utils/api';

interface LayoutProps {
  children?: ReactNode;
}

interface Branding {
  logoUrl?: string;
  primaryColor?: string;
  theme?: 'light' | 'dark';
}

function PageLoader() {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

export default function Layout({ children }: LayoutProps) {
  const {
    isSuperAdmin,
    isTenantAdmin,
    isTenantViewer,
    auth,
    authFetch,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [brand, setBrand] = useState<Branding>({
    logoUrl: '',
    primaryColor: '#2563eb',
    theme: 'dark',
  });
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Page loading animation during route transitions
  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  // Load tenant branding
  useEffect(() => {
    async function loadBranding() {
      const searchParams = new URLSearchParams(location.search);
      const previewTenantId =
        auth?.type === 'tenant-user'
          ? auth.tenantId
          : auth?.type === 'superadmin' && location.pathname.startsWith('/tenant')
          ? searchParams.get('tenantId') ?? undefined
          : undefined;

      if (previewTenantId && previewTenantId !== 'null') {
        const res = await authFetch(`${API_BASE_URL}/api/admin/tenants/${previewTenantId}`, {
          headers: { 'Cache-Control': 'no-cache' },
        });
        const tenant = await res.json();
        setBrand({
          logoUrl: tenant.logoUrl,
          primaryColor: tenant.primaryColor || '#2563eb',
          theme: tenant.theme || 'dark',
        });
      } else if (auth?.type === 'superadmin') {
        setBrand({ logoUrl: '', primaryColor: '#0284c7', theme: 'dark' });
      }
    }

    if (auth) loadBranding();
    // eslint-disable-next-line
  }, [auth, location.pathname, location.search, authFetch]);

  // Apply CSS theme and primary color
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(brand.theme === 'light' ? 'light' : 'dark');

    const color = brand.primaryColor || '#2563eb';
    root.style.setProperty('--primary-color', color);

    try {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      const textColor = brightness > 180 ? '#000000' : '#ffffff';
      root.style.setProperty('--primary-text-color', textColor);
    } catch {
      root.style.setProperty('--primary-text-color', '#ffffff');
    }
  }, [brand.theme, brand.primaryColor]);

  // Trigger reload if branding is marked for refresh
  useEffect(() => {
    if (localStorage.getItem('refreshBranding')) {
      localStorage.removeItem('refreshBranding');
      window.location.reload();
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    // Use clearAuth function instead of localStorage.clear to preserve report permissions
    // Only clear auth-related data
    localStorage.removeItem('email');
    localStorage.removeItem('type');
    localStorage.removeItem('roles');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    console.log('Logout: Auth cleared, but preserving report permissions');
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const displayName = auth?.email?.split('@')[0].split('.')[0] ?? 'Account';

  const showChat =
    auth?.type === 'tenant-user' &&
    (isTenantAdmin || isTenantViewer);

  return (
    <div className={`min-h-screen ${brand.theme === 'light' ? 'bg-slate-50' : 'bg-slate-900'}`}>
      {loading && <PageLoader />}

      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-slate-800 shadow-lg border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt="Logo" className="h-10 w-auto rounded-lg shadow-sm" />
              ) : (
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg shadow-sm">
                  <span className="text-lg font-bold text-white">S</span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">SecureApp</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isSuperAdmin ? 'Super Admin Panel' : 'Dashboard'}
                </p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {isSuperAdmin && (
                <>
                  <NavButton to="/admin" icon="📊" label="Dashboard" isActive={isActive('/admin')} />
                  <NavButton to="/admin/tenants" icon="🏢" label="Tenants" isActive={isActive('/admin/tenants')} />
                  <NavButton to="/admin/users" icon="👥" label="Users" isActive={isActive('/admin/users')} />

                </>
              )}

              {isTenantAdmin && (
                <NavButton to="/users" icon="👥" label="Users" isActive={isActive('/users')} />
              )}
              
              {(isTenantAdmin || isTenantViewer) && (
                <NavButton to="/tenant/reports" icon="📁" label="Reports" isActive={isActive('/tenant/reports')} />
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 group"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-sm font-semibold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {displayName.charAt(0).toUpperCase() + displayName.slice(1)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {auth?.email}
                  </p>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform duration-200 group-hover:text-slate-600 dark:group-hover:text-slate-300 ${
                    dropdownOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50 py-2">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {displayName.charAt(0).toUpperCase() + displayName.slice(1)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {auth?.email}
                    </p>
                  </div>
                  
                  {isTenantAdmin && (
                    <button
                      onClick={() => {
                        navigate('/tenant/settings');
                        setDropdownOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200"
                    >
                      <span className="mr-3">⚙️</span>
                      Settings
                    </button>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                  >
                    <span className="mr-3">🚪</span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 py-8 relative">
          {children}
          {showChat && <ChatLauncher />}
        </div>
      </main>
    </div>
  );
}

// Navigation Button Component
function NavButton({ to, icon, label, isActive }: { to: string; icon: string; label: string; isActive: boolean }) {
  return (
    <Link
      to={to}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
