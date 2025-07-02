import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SkeletonRow from '../../components/SkeletonRow';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/api';
import '../../styles/modal.css';

interface Tenant {
  id: string;
  name: string;
  adminEmail: string;
  status: string;
  logoUrl?: string;
  primaryColor?: string;
  theme?: 'light' | 'dark';
  powerBiGroupId?: string;
}

export default function AdminTenantsPage() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [form, setForm] = useState({
    name: '',
    adminEmail: '',
    status: 'active',
    logoUrl: '',
    primaryColor: '#2563eb',
    theme: 'dark',
    createPowerBIWorkspace: true,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const tenantsPerPage = 5;
  const { showToast } = useToast();
  const { authFetch } = useAuth();

  useEffect(() => {
    loadTenants();
    // eslint-disable-next-line
  }, []);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/tenants`);
      const data = await res.json();
      setTenants(Array.isArray(data) ? data : []);
    } catch {
      showToast('❌ Failed to load tenants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return;
    const formData = new FormData();
    formData.append('logo', logoFile);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/upload-logo`, {
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
    setSubmitting(true);
    const url = editingId
      ? `${API_BASE_URL}/api/admin/tenants/${editingId}`
      : `${API_BASE_URL}/api/admin/tenants`;
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        await loadTenants();
        showToast(
          editingId 
            ? `✅ Tenant "${form.name}" updated successfully` 
            : `✅ Tenant "${form.name}" created successfully`, 
          'success'
        );
        closeModal();
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(
          `❌ ${editingId ? 'Failed to update' : 'Failed to create'} tenant: ${errorData.error || 'Unknown error'}`, 
          'error'
        );
      }
    } catch (error) {
      console.error('Submit tenant error:', error);
      showToast(
        `❌ ${editingId ? 'Failed to update' : 'Failed to create'} tenant: Network error`, 
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (tenant: Tenant) => {
    setForm({
      name: tenant.name,
      adminEmail: tenant.adminEmail,
      status: tenant.status,
      logoUrl: tenant.logoUrl || '',
      primaryColor: tenant.primaryColor || '#2563eb',
      theme: tenant.theme || 'dark',
      createPowerBIWorkspace: false, // Don't auto-create workspace when editing
    });
    setEditingId(tenant.id);
    setShowModal(true);
    showToast(`✏️ Editing tenant "${tenant.name}"`, 'info');
  };

  const handleDelete = async (id: string, tenantName: string) => {
    if (!confirm(`Are you sure you want to delete tenant "${tenantName}"? This action cannot be undone.`)) return;
    
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/tenants/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        await loadTenants();
        showToast(`🗑️ Tenant "${tenantName}" deleted successfully`, 'success');
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(`❌ Failed to delete tenant: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Delete tenant error:', error);
      showToast('❌ Network error while deleting tenant', 'error');
    }
  };

  const closeModal = () => {
    setIsExiting(true);
    setTimeout(() => {
      setShowModal(false);
      setIsExiting(false);
      resetForm();
    }, 250);
  };

  const resetForm = () => {
    setForm({
      name: '',
      adminEmail: '',
      status: 'active',
      logoUrl: '',
      primaryColor: '#2563eb',
      theme: 'dark',
      createPowerBIWorkspace: true,
    });
    setEditingId(null);
  };

  const paginatedTenants = tenants.slice(
    (currentPage - 1) * tenantsPerPage,
    currentPage * tenantsPerPage
  );
  const totalPages = Math.ceil(tenants.length / tenantsPerPage);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Tenant Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage tenant organizations and their settings</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Create New Tenant</span>
        </button>
      </div>

      {showModal && (
        <div className={`fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4 ${isExiting ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}>
          <div className={`modal-container bg-white dark:bg-slate-800 p-8 w-full max-w-3xl transform ${isExiting ? 'animate-fade-out' : 'animate-fade-in'} max-h-[90vh] overflow-y-auto`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                  <span>{editingId ? '✏️' : '➕'}</span>
                  <span>{editingId ? 'Edit Tenant' : 'Create New Tenant'}</span>
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  {editingId ? 'Update tenant information and settings' : 'Add a new tenant organization to the system'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                  <span>📋</span>
                  <span>Basic Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="tenantName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Tenant Name
                    </label>
                    <input
                      id="tenantName"
                      type="text"
                      placeholder="Enter tenant name"
                      value={form.name}
                      onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="adminEmail" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Admin Email
                    </label>
                    <input
                      id="adminEmail"
                      type="email"
                      placeholder="admin@company.com"
                      value={form.adminEmail}
                      onChange={e => setForm(prev => ({ ...prev, adminEmail: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                {/* Status (Edit Mode Only) */}
                {editingId && (
                  <div className="space-y-2">
                    <label htmlFor="status" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Status
                    </label>
                    <select
                      id="status"
                      value={form.status}
                      onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Organization Branding Section */}
              <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                  <span>🎨</span>
                  <span>Organization Branding</span>
                </h3>
                
                {/* Logo Upload */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Organization Logo
                  </label>
                  <div className="space-y-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setLogoFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-600 dark:file:text-slate-200 dark:hover:file:bg-slate-500 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={uploadLogo}
                      className="inline-flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-medium"
                    >
                      <span className="mr-2">📤</span>
                      Upload Logo
                    </button>
                    {form.logoUrl && (
                      <div className="flex items-center space-x-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <img
                          src={form.logoUrl}
                          alt="Logo Preview"
                          className="h-16 w-16 object-cover rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm"
                        />
                        <div>
                          <p className="text-sm font-medium text-green-700 dark:text-green-300">Logo uploaded successfully</p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">Your logo will appear in the navigation bar</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Color and Theme */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="primaryColor" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Primary Color
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        id="primaryColor"
                        type="color"
                        value={form.primaryColor}
                        onChange={e => setForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-16 h-12 rounded-lg border-2 border-slate-300 dark:border-slate-600 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{form.primaryColor}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Used for buttons and accents</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="theme" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Theme Preference
                    </label>
                    <select
                      id="theme"
                      value={form.theme}
                      onChange={e => setForm(prev => ({ ...prev, theme: e.target.value as 'dark' | 'light' }))}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="dark">Dark Theme</option>
                      <option value="light">Light Theme</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Power BI Integration Section - Only show for new tenants */}
              {!editingId && (
                <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                    <span>📊</span>
                    <span>Power BI Integration</span>
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <input
                        id="createPowerBIWorkspace"
                        type="checkbox"
                        checked={form.createPowerBIWorkspace}
                        onChange={e => setForm(prev => ({ ...prev, createPowerBIWorkspace: e.target.checked }))}
                        className="mt-1 h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <div className="flex-1">
                        <label htmlFor="createPowerBIWorkspace" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Automatically create Power BI workspace
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Creates a dedicated Power BI workspace for this tenant. The workspace will be named "{form.name ? `${form.name} - ${new Date().getFullYear()}` : 'Tenant Name - YYYY'}".
                          {!form.createPowerBIWorkspace && (
                            <span className="block mt-2 text-amber-600 dark:text-amber-400">
                              ⚠️ You can manually assign a workspace later by editing the tenant settings.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-8 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 min-w-[140px]"
                >
                  {submitting && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  )}
                  <span>
                    {submitting 
                      ? (editingId ? 'Updating...' : 'Creating...') 
                      : (editingId ? '✏️ Update Tenant' : '➕ Create Tenant')
                    }
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tenants Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        {/* Table Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center">
            <span className="mr-2">🏢</span>
            Tenants ({tenants.length})
          </h2>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Organization
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Admin Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} columns={4} />)
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🏢</span>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No tenants found</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Create your first tenant to get started</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTenants.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {t.logoUrl ? (
                          <img src={t.logoUrl} alt={`${t.name} logo`} className="w-8 h-8 rounded-lg mr-3 object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-sm font-semibold text-white">
                              {t.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.name}</span>
                          {t.primaryColor && (
                            <div className="flex items-center mt-1">
                              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: t.primaryColor }}></div>
                              <span className="text-xs text-slate-500 dark:text-slate-400">{t.theme} theme</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{t.adminEmail}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        t.status === 'active' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => startEdit(t)} 
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(t.id, t.name)} 
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                        >
                          🗑️ Delete
                        </button>
                        {t.powerBiGroupId && (
                          <button
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                            onClick={() => navigate(`/admin/tenants/${t.id}/reports`)}
                          >
                            📊 Reports
                          </button>
                        )}
                        <button
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                          onClick={() => navigate(`/admin/tenants/${t.id}/data-integration`)}
                        >
                          🔗 Data Integration
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-700 dark:text-slate-300">
                Showing {((currentPage - 1) * tenantsPerPage) + 1} to {Math.min(currentPage * tenantsPerPage, tenants.length)} of {tenants.length} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
