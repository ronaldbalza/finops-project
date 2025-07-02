import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTenantsPage from './pages/admin/AdminTenantsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminDataIntegrationPage from './pages/admin/AdminDataIntegrationPage';
import TenantDashboard from './pages/tenant/TenantDashboard';
import TenantUsersPage from './pages/tenant/TenantUsersPage';
import TenantReportList from './pages/tenant/TenantReportList';
import TenantReportViewer from './pages/tenant/TenantReportViewer';
import TenantSettingsPage from './pages/tenant/TenantSettingsPage';
import LoginPage from './pages/LoginPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import useTheme from './hooks/useTheme';
import AdminTenantReportsPage from './pages/admin/AdminTenantReportsPage';
import AdminTenantReportViewerPage from './pages/admin/AdminTenantReportViewerPage';
import AdminTenantDataIntegrationPage from './pages/admin/AdminTenantDataIntegrationPage';


export default function App() {
  const { auth } = useAuth();

  // Apply tenant-specific theme and color if tenant user
  const theme: 'light' | 'dark' = auth?.type === 'tenant-user' ? auth.theme ?? 'dark' : 'dark';
  const primaryColor: string = auth?.type === 'tenant-user' ? auth.primaryColor ?? '#2563eb' : '#2563eb';

  useTheme(theme, primaryColor);

  // Determine initial redirect path
  const redirectPath = (() => {
    if (!auth) return '/login';
    if (auth.type === 'superadmin') return '/admin';
    if (auth.roles.includes('Admin')) return '/users';
    if (auth.roles.includes('Viewer')) return '/tenant/reports';
    return '/login';
  })();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Root Redirect */}
      <Route path="/" element={<Navigate to={redirectPath} />} />

      {/* Superadmin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allow={['superadmin']} element={<Layout><AdminDashboard /></Layout>} />
        }
      />
      <Route
        path="/admin/tenants"
        element={
          <ProtectedRoute allow={['superadmin']} element={<Layout><AdminTenantsPage /></Layout>} />
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allow={['superadmin']} element={<Layout><AdminUsersPage /></Layout>} />
        }
      />
      <Route
        path="/admin/data-integration"
        element={
          <ProtectedRoute allow={['superadmin']} element={<Layout><AdminDataIntegrationPage /></Layout>} />
        }
      />

      <Route
        path="/admin/tenants/:tenantId/reports"
        element={
          <ProtectedRoute allow={['superadmin']} element={<Layout><AdminTenantReportsPage /></Layout>} />
        }
      />
      <Route
        path="/admin/tenants/:tenantId/reports/:reportId"
        element={
          <ProtectedRoute allow={['superadmin']} element={<Layout><AdminTenantReportViewerPage /></Layout>} />
        }
      />
      <Route
        path="/admin/tenants/:tenantId/data-integration"
        element={
          <ProtectedRoute allow={['superadmin']} element={<Layout><AdminTenantDataIntegrationPage /></Layout>} />
        }
      />

      {/* Tenant Routes */}
      <Route
        path="/tenant/reports"
        element={
          <ProtectedRoute allow={['Admin', 'Viewer']} element={<Layout><TenantReportList /></Layout>} />
        }
      />
      <Route
        path="/tenant/reports/:reportId"
        element={
          <ProtectedRoute allow={['Admin', 'Viewer']} element={<Layout><TenantReportViewer /></Layout>} />
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allow={['Viewer']} element={<Layout><TenantDashboard /></Layout>} />
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute allow={['Admin']} element={<Layout><TenantUsersPage /></Layout>} />
        }
      />
      <Route
        path="/tenant/settings"
        element={
          <ProtectedRoute allow={['Admin']} element={<Layout><TenantSettingsPage /></Layout>} />
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
