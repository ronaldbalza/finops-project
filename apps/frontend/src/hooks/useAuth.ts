import { useAuth as useAuthContext } from '../contexts/AuthContext';

export function useAuth() {
  const { auth, login, logout } = useAuthContext();

  const email = auth?.email || localStorage.getItem('email') || '';
  const type = auth?.type || localStorage.getItem('type') || '';
  const roles: string[] = auth?.roles || JSON.parse(localStorage.getItem('roles') || '[]');
  const id = auth?.id || JSON.parse(localStorage.getItem('auth') || '{}').id || '';

  const isSuperAdmin = type === 'superadmin';
  const isTenantUser = type === 'tenant-user';

  const isTenantAdmin = isTenantUser && roles.includes('Admin');
  const isTenantViewer = isTenantUser && roles.includes('Viewer');

  return {
    id,
    email,
    type,
    roles,
    isSuperAdmin,
    isTenantUser,
    isTenantAdmin,
    isTenantViewer,
    auth,
    login,
    logout,
  };
}
