import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

interface SuperAdminAuth {
  id: string;
  type: 'superadmin';
  email: string;
  roles: string[];
}

interface TenantUserAuth {
  id: string;
  type: 'tenant-user';
  email: string;
  roles: string[];
  tenantId: string;
  theme: 'light' | 'dark';
  primaryColor: string;
}

type AuthData = SuperAdminAuth | TenantUserAuth;

interface AuthContextType {
  auth: AuthData | null;
  login: (data: AuthData & { token: string }) => void;
  logout: () => void;
  authFetch: typeof fetch;
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
  isTenantViewer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthData | null>(null);

  const login = (data: AuthData & { token: string }) => {
    const { token, ...userData } = data;
    setAuth(userData);
    
    // Store auth data with token in sessionStorage for Authorization header fallback
    const authDataWithToken = { ...userData, token };
    sessionStorage.setItem('auth', JSON.stringify(authDataWithToken));
    
    console.log('Stored auth data with token in sessionStorage');
    
    // Only set the cookie if it's a real token (not our dummy token for in-memory updates)
    if (token !== 'dummy') {
      // Set cookie (cannot use HttpOnly from JavaScript)
      const cookieOptions = [
        `token=${token}`,
        'Path=/',
        'SameSite=None', // Changed from Strict to None for cross-domain
        'Secure', // Required when SameSite=None
        `Max-Age=${60 * 60}` // 1 hour expiration
      ].join('; ');
      
      document.cookie = cookieOptions;
      console.log('JWT token cookie set:', token.substring(0, 20) + '...');
      console.log('Cookie options:', cookieOptions);
      
      // Verify cookie was set
      setTimeout(() => {
        const cookieValue = document.cookie.split(';').find(c => c.trim().startsWith('token='));
        console.log('Cookie verification after 100ms:', cookieValue ? 'SET' : 'NOT SET');
        if (cookieValue) {
          console.log('Cookie value:', cookieValue.substring(0, 30) + '...');
        }
      }, 100);
    }
  };

  const logout = () => {
    setAuth(null);
    sessionStorage.removeItem('auth');
    document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  };

  const authFetch: typeof fetch = async (input, init = {}) => {
    const headers = new Headers(init?.headers);
    
    // Try to get token from localStorage as fallback
    const stored = sessionStorage.getItem('auth');
    if (stored) {
      try {
        const authData = JSON.parse(stored);
        if (authData.token) {
          headers.set('Authorization', `Bearer ${authData.token}`);
          console.log('Added Authorization header with token from sessionStorage');
        }
      } catch (e) {
        console.warn('Failed to parse stored auth data:', e);
      }
    }
    
    try {
      const response = await fetch(input, {
        ...init,
        credentials: 'include', // Still try cookies
        headers
      });

      // Handle different auth-related status codes
      if (response.status === 401) {
        logout();
        throw new Error('Session expired');
      } else if (response.status === 403) {
        throw new Error('You do not have permission to perform this action');
      } else if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          logout();
        }
        // Re-throw the error with the custom message
        throw error;
      }
      // For network errors or other unknown errors
      throw new Error('Network error or server is unreachable');
    }
  };

  useEffect(() => {
    const initializeAuth = () => {
      const stored = sessionStorage.getItem('auth');
      
      if (!stored) {
        return;
      }

      try {
        const parsed = JSON.parse(stored);
        
        const isValid = 
          parsed &&
          typeof parsed.email === 'string' &&
          typeof parsed.id === 'string' &&
          Array.isArray(parsed.roles);

        const isSuperadmin = parsed.type === 'superadmin';
        const isTenantUser = 
          parsed.type === 'tenant-user' &&
          typeof parsed.tenantId === 'string';

        if ((isSuperadmin || isTenantUser) && isValid) {
          setAuth(parsed);
        } else {
          logout();
        }
      } catch (error) {
        console.error('AuthContext: Error parsing auth data:', error);
        logout();
      }
    };

    initializeAuth();
  }, []);

  const isSuperAdmin = auth?.type === 'superadmin';
  const isTenantAdmin = auth?.type === 'tenant-user' && auth.roles.includes('Admin');
  const isTenantViewer = auth?.type === 'tenant-user' && auth.roles.includes('Viewer');

  return (
    <AuthContext.Provider
      value={{
        auth,
        login,
        logout,
        authFetch,
        isSuperAdmin,
        isTenantAdmin,
        isTenantViewer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}