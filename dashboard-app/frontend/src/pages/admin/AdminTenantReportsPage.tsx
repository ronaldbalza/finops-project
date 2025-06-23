import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { API_BASE_URL } from '../../utils/api';

// Modal component for managing report permissions
function ReportPermissionsModal({ 
  isOpen, 
  onClose, 
  report, 
  tenantId, 
  tenant,
  authFetch, 
  showToast 
}: {
  isOpen: boolean;
  onClose: () => void;
  report: any;
  tenantId: string;
  tenant: any;
  authFetch: any;
  showToast: any;
}) {
  const [users, setUsers] = useState<any[]>([]);
  const [reportPermissions, setReportPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && report && tenant) {
      fetchUsersAndPermissions();
    }
  }, [isOpen, report, tenant]);

  const fetchUsersAndPermissions = async () => {
    setLoading(true);
    try {
      // Fetch tenant users using the correct endpoint
      const usersRes = await authFetch(`${API_BASE_URL}/api/users/tenant/${tenantId}`);
      
      if (!usersRes.ok) {
        throw new Error(`Request failed with status ${usersRes.status}`);
      }
      
      const usersData = await usersRes.json();
      console.log('Users data received:', usersData);
      
      // The API returns an array directly, not nested in a users property
      setUsers(Array.isArray(usersData) ? usersData : []);

      // Load permissions from database API (admin endpoint)
      const workspaceId = tenant?.powerBiGroupId;
      if (workspaceId && report?.id) {
        try {
          const permissionsRes = await authFetch(`${API_BASE_URL}/api/powerbi/permissions/${workspaceId}/admin`);
          
          if (permissionsRes.ok) {
            const permissionsData = await permissionsRes.json();
            console.log('Database permissions received:', permissionsData);
            
            // Filter permissions for this specific report
            const reportPermissions = permissionsData.filter((perm: any) => perm.report?.reportId === report.id);
            
            // Convert to the format expected by the UI (array of {userId, reportId})
            const formattedPermissions = reportPermissions.map((perm: any) => ({
              userId: perm.userId,
              reportId: perm.report.reportId
            }));
            
            setReportPermissions(formattedPermissions);
            console.log(`Loaded ${formattedPermissions.length} permissions for report ${report.id}`);
          } else {
            console.warn('Failed to fetch permissions from database, using empty permissions');
            setReportPermissions([]);
          }
        } catch (error) {
          console.error('Error fetching permissions from database:', error);
          setReportPermissions([]);
        }
      } else {
        console.warn('Missing workspaceId or report.id, using empty permissions');
        setReportPermissions([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('❌ Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = async (userId: string, hasAccess: boolean) => {
    setSaving(true);
    try {
      const workspaceId = tenant?.powerBiGroupId;
      if (!workspaceId) {
        throw new Error('Workspace ID not found');
      }

      if (hasAccess) {
        // Revoke permission
        await authFetch(`${API_BASE_URL}/api/powerbi/permissions/revoke`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            reportId: report.id,
            workspaceId
          }),
        });

        // Update local state
        const newPermissions = reportPermissions.filter(p => p.userId !== userId);
        setReportPermissions(newPermissions);
        
        showToast('✅ Access removed successfully', 'success');
      } else {
        // Grant permission
        await authFetch(`${API_BASE_URL}/api/powerbi/permissions/grant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            reportId: report.id,
            workspaceId,
            canView: true
          }),
        });

        // Update local state
        const newPermissions = [...reportPermissions, { userId, reportId: report.id }];
        setReportPermissions(newPermissions);
        
        showToast('✅ Access granted successfully', 'success');
      }

      console.log(`Permission ${hasAccess ? 'revoked' : 'granted'} for user ${userId} on report ${report.id}`);
    } catch (error) {
      console.error('Error updating permission:', error);
      showToast('❌ Failed to update permissions', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getUserInitials = (user: any) => {
    // If user has firstName and lastName, use those
    if (user.firstName && user.lastName) {
      return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
    }
    // Otherwise use email initials
    const emailParts = user.email.split('@')[0].split('.');
    if (emailParts.length >= 2) {
      return (emailParts[0].charAt(0) + emailParts[1].charAt(0)).toUpperCase();
    }
    return user.email.charAt(0).toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Manage Report Access</h3>
              <p className="text-sm text-slate-400 mt-1">{report?.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-slate-300 mb-4">
                Select which users can access this report. Tenant admins and super admins always have access.
              </div>
              
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-slate-400">No users found for this tenant</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {users.map((user: any) => {
                    const hasAccess = reportPermissions.some(p => p.userId === user.id);
                    const userRole = user.roles?.[0]?.name || 'Viewer';
                    const isAdmin = userRole.toLowerCase() === 'admin';
                    
                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {getUserInitials(user)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email.split('@')[0]}
                            </div>
                            <div className="text-xs text-slate-400">
                              {user.email} • {userRole}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          {isAdmin ? (
                            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
                              Admin Access
                            </span>
                          ) : (
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={hasAccess}
                                onChange={() => handlePermissionToggle(user.id, hasAccess)}
                                disabled={saving}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-700">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminTenantReportsPage() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { showToast } = useToast();
  const [tenant, setTenant] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 10;

  // New state for permissions modal
  const [permissionsModal, setPermissionsModal] = useState({
    isOpen: false,
    report: null as any
  });

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const res = await authFetch(`${API_BASE_URL}/api/admin/tenants/${tenantId}`);
        const data = await res.json();
        setTenant(data);
        if (data.powerBiGroupId) {
          const reportsRes = await authFetch(`${API_BASE_URL}/api/admin/powerbi/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId: data.powerBiGroupId }),
          });
          const reportsData = await reportsRes.json();
          setReports(reportsData.reports || []);
        }
      } catch {
        showToast('❌ Failed to load tenant or reports', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchTenant();
    // eslint-disable-next-line
  }, [tenantId]);

  // New function to handle opening permissions modal
  const openPermissionsModal = (report: any) => {
    setPermissionsModal({ isOpen: true, report });
  };

  // New function to handle closing permissions modal
  const closePermissionsModal = () => {
    setPermissionsModal({ isOpen: false, report: null });
  };

  // Filtered and paginated reports
  const filteredReports = reports.filter((r: any) => r.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
  const paginatedReports = filteredReports.slice((currentPage - 1) * reportsPerPage, currentPage * reportsPerPage);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReportInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="bg-slate-800 text-white p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-slate-700 rounded w-1/4"></div>
          </div>
        </div>
        <div className="p-8">
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="animate-pulse">
              <div className="h-40 bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="bg-slate-800 text-white p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Tenant Reports - Not Found
              </h1>
              <p className="text-slate-300">
                The requested tenant could not be found
              </p>
            </div>
            <div className="bg-slate-700 px-3 py-1 rounded-lg text-sm text-slate-300">
              Super Admin
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Tenant not found</h3>
            <p className="text-slate-400 mb-4">The requested tenant could not be found.</p>
            <button
              onClick={() => navigate('/admin/tenants')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              ← Back to Tenants
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 text-white p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => navigate('/admin/tenants')}
                className="inline-flex items-center px-3 py-1.5 border border-slate-600 text-sm font-medium rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                ← Back
              </button>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {tenant.name} - Power BI Reports
            </h1>
            <p className="text-slate-300">
              Admin Email: {tenant.adminEmail}
            </p>
          </div>
          <div className="bg-slate-700 px-3 py-1 rounded-lg text-sm text-slate-300">
            Super Admin
          </div>
        </div>
      </div>

      <div className="p-8">
        {tenant.powerBiGroupId ? (
          <>
            {/* Search Section */}
            <div className="bg-slate-800 rounded-lg p-6 mb-8">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label htmlFor="search" className="block text-sm font-medium text-slate-300 mb-2">
                    Search Reports
                  </label>
                  <input
                    id="search"
                    type="text"
                    placeholder="Search by report name..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Reports Section */}
            <div className="bg-slate-800 rounded-lg overflow-hidden">
              {/* Section Header */}
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <span className="mr-2">📊</span>
                    Reports ({filteredReports.length})
                  </h2>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                        Report Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                        Last Refreshed
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                        Created By
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-slate-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                              <span className="text-2xl">📊</span>
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">No reports found</h3>
                            <p className="text-slate-400">
                              {search ? 'Try adjusting your search criteria' : 'No Power BI reports are available for this tenant'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedReports.map((report: any) => (
                        <tr key={report.id} className="hover:bg-slate-700/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                                <span className="text-white text-sm font-medium">
                                  {getReportInitials(report.name)}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-white">{report.name}</div>
                                <div className="text-xs text-slate-400">ID: {report.id.slice(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-300">{formatDate(report.lastRefreshTime)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-300">{report.createdBy || '-'}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => openPermissionsModal(report)}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                              >
                                🔐 Manage Access
                              </button>
                              <button
                                onClick={() => navigate(`/admin/tenants/${tenantId}/reports/${report.id}`)}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                              >
                                👁️ View
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
              {filteredReports.length > 0 && totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-300">
                      Showing {((currentPage - 1) * reportsPerPage) + 1} to {Math.min(currentPage * reportsPerPage, filteredReports.length)} of {filteredReports.length} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 text-sm font-medium text-slate-300">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-slate-800 rounded-lg p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No Power BI Workspace</h3>
              <p className="text-slate-400">
                This tenant doesn't have a Power BI workspace configured yet.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Permissions Modal */}
      <ReportPermissionsModal
        isOpen={permissionsModal.isOpen}
        onClose={closePermissionsModal}
        report={permissionsModal.report}
        tenantId={tenantId!}
        tenant={tenant}
        authFetch={authFetch}
        showToast={showToast}
      />
    </div>
  );
} 
