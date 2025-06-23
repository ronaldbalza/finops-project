import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import SkeletonRow from '../../components/SkeletonRow';
import LoadingSpinner from '../../components/LoadingSpinner';
import { API_BASE_URL } from '../../utils/api';

const roles: Role[] = ['Admin', 'Viewer'];
type Role = 'Admin' | 'Viewer';

type User = {
  id: string;
  email: string;
  roles?: { name: Role }[];
};

export default function TenantUsersPage() {
  const { auth, authFetch } = useAuth();
  const { showToast } = useToast();

  if (auth?.type !== 'tenant-user') {
    return <p className="text-red-500">Unauthorized access</p>;
  }

  // Debug current user context
  console.log('TenantUsersPage - Current auth context:', {
    id: auth.id,
    email: auth.email,
    type: auth.type,
    tenantId: auth.tenantId,
    roles: auth.roles
  });

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Viewer');
  const [filter, setFilter] = useState<Role | ''>('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<Role>('Viewer');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  useEffect(() => {
    if (!auth?.tenantId) return;
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.tenantId]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const fetchUsers = async () => {
    setLoading(true);
    if (!auth || !auth.tenantId) {
      showToast('❌ No tenant context found', 'error');
      setLoading(false);
      return;
    }
    
    console.log('Fetching users with auth context:', {
      userId: auth.id,
      userEmail: auth.email,
      userRoles: auth.roles,
      tenantId: auth.tenantId
    });
    
    // Use the general users endpoint which filters by the authenticated user's tenant
    const url = `${API_BASE_URL}/api/users`;
    try {
      const res = await authFetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('API Error Response:', {
          status: res.status,
          statusText: res.statusText,
          errorData
        });
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
      }
      const data = await res.json();
      console.log('Users API response:', data);
      // The backend might return a paginated result, so check for users array
      const usersArray = data.users || data;
      setUsers(Array.isArray(usersArray) ? usersArray : []);
    } catch (error) {
      console.error('fetchUsers error:', error);
      const message = error instanceof Error ? error.message : 'Failed to load users';
      showToast(`❌ ${message}`, 'error');
      // If we get a permission error, we might want to redirect or disable certain features
      if (message.includes('permission')) {
        setUsers([]); // Clear users list
      }
    } finally {
      setLoading(false);
    }
  };

  // Add permission check for user management actions
  // Check for both 'Admin' and 'admin' to handle case sensitivity issues
  const canManageUsers = auth?.type === 'tenant-user' && (
    auth.roles.includes('Admin') || auth.roles.includes('admin')
  );
  
  console.log('Permission check:', {
    authType: auth?.type,
    roles: auth?.roles,
    hasAdminRole: auth?.roles.includes('Admin'),
    hasAdminRoleLower: auth?.roles.includes('admin'),
    canManageUsers
  });

  // Client-side filtering based on selected role filter
  const filteredUsers = filter 
    ? users.filter(user => user.roles?.some(role => role.name === filter))
    : users;

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !auth.tenantId) {
      showToast('❌ No tenant context found', 'error');
      return;
    }
    if (!canManageUsers) {
      showToast('❌ You do not have permission to create users', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tenantId: auth.tenantId, role, password: 'changeme123' }),
      });
      await res.json();
      showToast(`✅ User "${email}" added as ${role}`, 'success');
      setEmail('');
      fetchUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating user';
      showToast(`❌ ${message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!auth || !auth.tenantId) {
      showToast('❌ No tenant context found', 'error');
      return;
    }
    if (!canManageUsers) {
      showToast('❌ You do not have permission to delete users', 'error');
      return;
    }
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await authFetch(`${API_BASE_URL}/api/users/${id}`, {
        method: 'DELETE',
      });
      showToast('🗑️ User deleted successfully', 'success');
      fetchUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deleting user';
      showToast(`❌ ${message}`, 'error');
    }
  };

  const startEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditingRole(user.roles?.[0]?.name || 'Viewer');
  };

  const cancelEdit = () => setEditingUserId(null);

  const saveEdit = async () => {
    if (!auth || !auth.tenantId) {
      showToast('❌ No tenant context found', 'error');
      return;
    }
    if (!canManageUsers) {
      showToast('❌ You do not have permission to edit user roles', 'error');
      return;
    }
    setSavingEdit(true);
    try {
      await authFetch(`${API_BASE_URL}/api/users/${editingUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editingRole }),
      });
      showToast('✅ Role updated successfully', 'success');
      setEditingUserId(null);
      fetchUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user role';
      showToast(`❌ ${message}`, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">User Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage users within your organization</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
            Tenant Admin
          </span>
        </div>
      </div>

      {/* Create User Form */}
      {canManageUsers && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center">
            <span className="mr-2">➕</span>
            Add New User
          </h2>
          
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                placeholder="user@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Role
              </label>
              <select
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                value={role}
                onChange={e => setRole(e.target.value as Role)}
              >
                {roles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Action
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <LoadingSpinner />
                    <span className="ml-2">Creating...</span>
                  </div>
                ) : (
                  <span>Create User</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        {/* Filter Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center">
              <span className="mr-2">👥</span>
              Users ({filteredUsers.length})
            </h2>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter by role:</label>
              <select
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                value={filter}
                onChange={e => setFilter(e.target.value as Role | '')}
              >
                <option value="">All Roles</option>
                {roles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Role
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                Array.from({ length: usersPerPage }).map((_, i) => (
                  <SkeletonRow key={i} columns={3} />
                ))
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                        <span className="text-2xl">👤</span>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No users found</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {canManageUsers ? 'Create a new user above to get started' : 'No users available to display'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-semibold text-white">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingUserId === user.id ? (
                        <select
                          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                          value={editingRole}
                          onChange={e => setEditingRole(e.target.value as Role)}
                        >
                          {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      ) : (
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          Array.isArray(user.roles) && user.roles[0]?.name === 'Admin' 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          {Array.isArray(user.roles)
                            ? user.roles.map(r => r.name).join(', ')
                            : 'No roles'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canManageUsers ? (
                        editingUserId === user.id ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={saveEdit}
                              disabled={savingEdit}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors duration-200"
                            >
                              {savingEdit && <LoadingSpinner />}
                              {savingEdit ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 text-sm leading-4 font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={() => startEdit(user)} 
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            >
                              ✏️ Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(user.id)} 
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        )
                      ) : (
                        <span className="text-sm text-slate-500 dark:text-slate-400">View Only</span>
                      )}
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
                Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage === totalPages}
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
