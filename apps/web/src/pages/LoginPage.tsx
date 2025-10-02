import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../lib/store';
import api from '../lib/api/client';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const provider = searchParams.get('provider');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(`OAuth error: ${errorParam}`);
        return;
      }

      if (code && state && provider) {
        setIsLoading(true);
        try {
          const response = await api.auth.callback(provider, code, state);
          const { token, user, sessionId } = response as any;

          // Store auth data
          login(
            {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              tenant: user.tenant || {
                id: user.tenantId,
                name: 'Organization',
                slug: 'org',
              },
            },
            token,
            undefined,
            sessionId
          );

          navigate('/dashboard');
        } catch (error) {
          console.error('OAuth callback error:', error);
          setError('Authentication failed. Please try again.');
          setIsLoading(false);
        }
      }
    };

    handleCallback();
  }, [searchParams, login, navigate]);

  const handleOAuthLogin = async (provider: 'google' | 'microsoft') => {
    setIsLoading(true);
    setError(null);

    try {
      // In production, get the auth URL and redirect
      if (import.meta.env.PROD) {
        const { authUrl } = await api.auth.login(provider);
        window.location.href = authUrl;
      } else {
        // Mock login for development
        setTimeout(() => {
          login(
            {
              id: '1',
              email: 'demo@finops.app',
              name: 'Demo User',
              role: 'ADMIN',
              tenant: {
                id: '1',
                name: 'Demo Company',
                slug: 'demo',
              },
            },
            'mock-jwt-token',
            'mock-refresh-token',
            'mock-session-id'
          );
          navigate('/dashboard');
        }, 1000);
      }
    } catch (error) {
      console.error('OAuth login error:', error);
      setError('Failed to initiate login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <ChartBarIcon className="h-12 w-12 text-primary-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Sign in to FinOps Platform
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/" className="font-medium text-primary-600 hover:text-primary-500">
            start your free trial
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
            {/* Google OAuth */}
            <button
              onClick={() => handleOAuthLogin('google')}
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </button>

            {/* Microsoft OAuth */}
            <button
              onClick={() => handleOAuthLogin('microsoft')}
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#F25022" d="M11 11H0V0h11v11z" />
                <path fill="#00A4EF" d="M24 11H13V0h11v11z" />
                <path fill="#7FBA00" d="M11 24H0V13h11v11z" />
                <path fill="#FFB900" d="M24 24H13V13h11v11z" />
              </svg>
              {isLoading ? 'Signing in...' : 'Continue with Microsoft'}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>

            <form className="mt-6 space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sign in
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Demo mode: Click any OAuth button to sign in as a demo user
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}