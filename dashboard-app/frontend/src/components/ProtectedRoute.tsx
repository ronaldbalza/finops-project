import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { ReactElement } from 'react';

interface ProtectedRouteProps {
  allow: string[];
  element: ReactElement;
}

export default function ProtectedRoute({ allow, element }: ProtectedRouteProps) {
  const { auth } = useAuth();

  if (auth === null) {
    // Optional: you could add a spinner here
    return <div className="text-white p-4">🔐 Loading...</div>;
  }

  const hasAccess =
    (allow.includes('superadmin') && auth.type === 'superadmin') ||
    allow.some(role => auth.roles?.includes(role));

  return hasAccess ? element : <Navigate to="/login" />;
}
