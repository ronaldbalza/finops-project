import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { API_ENDPOINTS } from '../utils/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Simple validation - just check if token exists
    // Real validation will happen when we try to reset
    if (!token) {
      setTokenValid(false);
    } else {
      setTokenValid(true);
    }
  }, [token]);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return "Must be at least 8 characters";
    if (!/[A-Z]/.test(pwd)) return "Must contain an uppercase letter";
    if (!/[0-9]/.test(pwd)) return "Must contain a number";
    if (pwd !== confirmPassword) return "Passwords don't match";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validatePassword(password);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.auth.login.replace('/login', '/reset-password')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to reset password');
      }

      showToast('✅ Password reset successfully! You can now log in.', 'success');
      navigate('/login');
    } catch (err) {
      console.error('Reset password error:', err);
      showToast(
        `❌ ${err instanceof Error ? err.message : 'Failed to reset password'}`,
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (tokenValid === null) {
    return <div className="text-center p-8">Validating token...</div>;
  }

  if (!tokenValid) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-gray-800 text-white rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Invalid Token</h1>
        <p className="mb-4">This password reset link is invalid or has expired.</p>
        <button
          onClick={() => navigate('/forgot-password')}
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded"
        >
          Request New Link
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-gray-800 text-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">🔑 Reset Password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block mb-1">
            New Password
          </label>
          <input
            id="password"
            type="password"
            required
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError('');
            }}
            minLength={8}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setPasswordError('');
            }}
            minLength={8}
          />
        </div>

        {passwordError && (
          <p className="text-red-400 text-sm">{passwordError}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-green-600 hover:bg-green-700 py-2 rounded font-semibold disabled:opacity-70"
        >
          {submitting ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}