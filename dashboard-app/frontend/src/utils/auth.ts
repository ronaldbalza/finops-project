// frontend/src/utils/auth.ts
export function saveAuth({ email, type, roles, tenantId }: { email: string; type: string; roles: string[]; tenantId?: string }) {
  localStorage.setItem('email', email);
  localStorage.setItem('type', type);
  localStorage.setItem('roles', JSON.stringify(roles || []));
  if (tenantId) localStorage.setItem('tenantId', tenantId);
}

export function clearAuth() {
  // Only clear auth-related data, preserve report permissions
  localStorage.removeItem('email');
  localStorage.removeItem('type');
  localStorage.removeItem('roles');
  localStorage.removeItem('tenantId');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  
  // Preserve report permissions by not using localStorage.clear()
  console.log('Auth cleared, but preserving report permissions');
}
