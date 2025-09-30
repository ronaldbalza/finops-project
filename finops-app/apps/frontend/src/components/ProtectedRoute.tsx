import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  allow: string[];
  element: ReactElement;
}

export default function ProtectedRoute({ allow, element }: ProtectedRouteProps) {
  const { auth } = useAuth();
  const [authTimeout, setAuthTimeout] = useState(false);

  // Add timeout to prevent infinite loading if user is not authenticated
  useEffect(() => {
    if (auth === null) {
      const timeout = setTimeout(() => {
        console.log('AuthContext: Authentication timeout - redirecting to login');
        setAuthTimeout(true);
      }, 3000); // 3 second timeout

      return () => clearTimeout(timeout);
    } else {
      setAuthTimeout(false);
    }
  }, [auth]);

  // If auth timeout occurred, redirect to login
  if (authTimeout) {
    return <Navigate to="/login" />;
  }

  if (auth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white p-4 text-center">
          <div className="text-2xl mb-2">🔐</div>
          <div>Loading authentication...</div>
        </div>
      </div>
    );
  }

  const hasAccess =
    (allow.includes('superadmin') && auth.type === 'superadmin') ||
    allow.some(role => auth.roles?.includes(role));

  return hasAccess ? element : <Navigate to="/login" />;
}
