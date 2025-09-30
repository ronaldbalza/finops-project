import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { API_BASE_URL } from '../../utils/api';

interface PowerBIReport {
  id: string;
  name: string;
  embedUrl: string;
  reportId: string;
  groupId: string;
  lastRefreshTime?: string;
  createdBy?: string;
}

interface Tenant {
  id: string;
  name: string;
  powerBiGroupId?: string;
}

export default function TenantReportList() {
  const { auth, authFetch } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const tenantId = auth?.type === 'tenant-user' ? auth.tenantId : '';

  const [reports, setReports] = useState<PowerBIReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 10;

  useEffect(() => {
    if (!tenantId) return;

    const fetchReports = async () => {
      setLoading(true);
      try {
        // First get the tenant's workspace ID
        const tenantRes = await authFetch(`${API_BASE_URL}/api/tenants/${tenantId}/settings`);
        if (!tenantRes.ok) throw new Error('Failed to fetch tenant info');
        const tenantData: Tenant = await tenantRes.json();
        
        if (!tenantData.powerBiGroupId) {
          showToast('❌ No PowerBI workspace configured for this tenant', 'error');
          setReports([]);
          setLoading(false);
          return;
        }

        // Get user's current permissions from localStorage
        const getUserPermissions = () => {
          const permissions: string[] = [];
          
          // Get all localStorage keys that match report permission pattern
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('report_permissions_')) {
              try {
                const reportId = key.replace('report_permissions_', '');
                const permissionData = localStorage.getItem(key);
                
                if (permissionData) {
                  const parsedPermissions = JSON.parse(permissionData);
                  
                  // Check if current user has permission for this report
                  const userHasPermission = parsedPermissions.some((p: any) => p.userId === auth?.id);
                  
                  if (userHasPermission) {
                    permissions.push(reportId);
                  }
                }
              } catch (error) {
                console.error('Error parsing permission data:', error);
              }
            }
          }
          return permissions;
        };

        const userPermissions = getUserPermissions();
        console.log('User permissions for reports:', userPermissions);

        // Then fetch reports using the workspace ID and user permissions
        const reportsRes = await authFetch(`${API_BASE_URL}/api/powerbi/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            groupId: tenantData.powerBiGroupId,
            userPermissions: userPermissions // Send user's permitted report IDs
          }),
        });
        
        if (!reportsRes.ok) {
          const errorData = await reportsRes.text();
          console.error('Report fetch error:', errorData);
          throw new Error(`Failed to fetch reports: ${reportsRes.status} ${reportsRes.statusText}`);
        }
        
        const data = await reportsRes.json();
        const reportsList = data.reports || [];
        setReports(reportsList);
        
        // Provide helpful feedback based on results
        if (reportsList.length === 0) {
          if (userPermissions.length === 0) {
            showToast('ℹ️ No report permissions found. Contact your administrator to grant access to reports.', 'info');
          } else {
            showToast('ℹ️ No reports found. Reports may still be syncing from Power BI.', 'info');
          }
        } else {
          console.log(`✅ Successfully loaded ${reportsList.length} reports`);
        }
        
      } catch (error) {
        console.error('Error fetching reports:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        showToast(`❌ Failed to load reports: ${errorMessage}`, 'error');
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [tenantId, authFetch, showToast]);

  // Filtered and paginated reports
  const filteredReports = reports.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
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

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 text-white p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Power BI Reports
            </h1>
            <p className="text-slate-300">
              View and access your Power BI reports
            </p>
          </div>
          <div className="bg-slate-700 px-3 py-1 rounded-lg text-sm text-slate-300">
            Tenant User
          </div>
        </div>
      </div>

      <div className="p-8">
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
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="hover:bg-slate-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-slate-600 rounded-full mr-3 animate-pulse"></div>
                          <div className="animate-pulse">
                            <div className="h-4 bg-slate-600 rounded w-32 mb-1"></div>
                            <div className="h-3 bg-slate-700 rounded w-20"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="animate-pulse">
                          <div className="h-4 bg-slate-600 rounded w-24"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="animate-pulse">
                          <div className="h-4 bg-slate-600 rounded w-20"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="animate-pulse">
                          <div className="h-8 bg-slate-600 rounded w-20 ml-auto"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : filteredReports.length === 0 ? (
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
                  paginatedReports.map((report) => (
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
                        <button
                          onClick={() => navigate(`/tenant/reports/${report.id}`)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                          👁️ View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredReports.length > 0 && totalPages > 1 && (
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
      </div>
    </div>
  );
}
