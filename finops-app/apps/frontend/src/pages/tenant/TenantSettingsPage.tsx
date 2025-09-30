import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils/api';

export default function TenantSettingsPage() {
  const { auth, login, authFetch } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const tenantId = auth?.type === 'tenant-user' ? auth.tenantId : null;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    logoUrl: '',
    primaryColor: '#2563eb',
    theme: 'dark' as 'dark' | 'light',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    const fetchTenant = async () => {
      setLoading(true);
      try {
        const res = await authFetch(`${API_BASE_URL}/api/tenants/${tenantId}/settings`, { cache: 'no-store' });
        const tenant = await res.json();
        if (tenant) {
          setForm({
            logoUrl: tenant.logoUrl || '',
            primaryColor: tenant.primaryColor || '#2563eb',
            theme: tenant.theme || 'dark',
          });
        }
      } catch {
        showToast('❌ Failed to load tenant info', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchTenant();
  }, [tenantId, showToast, authFetch]);

  const uploadLogo = async () => {
    if (!logoFile) return;
    const formData = new FormData();
    formData.append('logo', logoFile);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/upload-logo`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setForm(prev => ({ ...prev, logoUrl: data.url }));
      showToast('✅ Logo uploaded successfully', 'success');
    } catch {
      showToast('❌ Logo upload failed', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || auth?.type !== 'tenant-user') return;
    setSubmitting(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/tenants/${tenantId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        showToast('✅ Tenant settings updated', 'success');

        // Update auth context in-memory without needing the token
        if (auth) {
          login({
            ...auth,
            primaryColor: form.primaryColor,
            theme: form.theme,
            // Use a dummy token that will be ignored since we're using HTTP-only cookies
            token: 'dummy',
          });
        }

        navigate('/tenant/reports');
      } else {
        showToast('❌ Failed to update tenant', 'error');
      }
    } catch {
      showToast('❌ Error updating tenant', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 text-gray-900 dark:text-white">
      <h1 className="text-3xl font-bold mb-6">⚙️ Tenant Settings</h1>
      {loading ? (
        <div className="space-y-4 max-w-xl animate-pulse">
          <div className="h-10 bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-700 rounded w-1/2"></div>
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="h-10 bg-gray-700 rounded w-2/3"></div>
          <div className="h-10 bg-gray-700 rounded w-40"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) setLogoFile(e.target.files[0]);
            }}
            className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 border border-gray-600"
          />

          <button
            type="button"
            onClick={uploadLogo}
            className="bg-[var(--primary-color)] text-white px-4 py-1 rounded hover:opacity-90"
          >
            Upload Logo
          </button>
          {form.logoUrl && (
            <img src={form.logoUrl} alt="Logo" className="h-16 rounded mt-2 border border-gray-600" />
          )}

          <label className="block">Primary Color</label>
          <input
            type="color"
            value={form.primaryColor}
            onChange={e => setForm(prev => ({ ...prev, primaryColor: e.target.value }))}
          />

          <label className="block">Theme</label>
          <select
            className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 border border-gray-600"
            value={form.theme}
            onChange={e => setForm(prev => ({ ...prev, theme: e.target.value as 'dark' | 'light' }))}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>

          <button
            type="submit"
            disabled={submitting}
            className="bg-[var(--primary-color)] text-white px-4 py-2 rounded font-semibold hover:opacity-90"
          >
            {submitting ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      )}
    </div>
  );
}
