import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import PowerBIEmbed from '../../components/PowerBIEmbed';
import LoadingSpinner from '../../components/LoadingSpinner';
import { API_BASE_URL } from '../../utils/api';

interface Tenant {
  id: string;
  name: string;
  powerBiGroupId?: string;
}

export default function TenantReportViewer() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { auth, authFetch } = useAuth();
  const { showToast } = useToast();
  const tenantId = auth?.type === 'tenant-user' ? auth.tenantId : '';
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [report, setReport] = useState<any>(null);
  const [embedInfo, setEmbedInfo] = useState<{ embedToken: string; embedUrl: string; reportId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Get user permissions from localStorage
  const getUserPermissions = () => {
    if (!auth?.id) return [];
    
    const allKeys = Object.keys(localStorage);
    const permissionKeys = allKeys.filter(key => key.startsWith('report_permissions_'));
    const userPermissions: string[] = [];
    
    permissionKeys.forEach(key => {
      try {
        const permissions = JSON.parse(localStorage.getItem(key) || '[]');
        const userPermission = permissions.find((p: any) => p.userId === auth.id);
        if (userPermission) {
          const reportId = key.replace('report_permissions_', '');
          userPermissions.push(reportId);
        }
      } catch (error) {
        console.error('Error parsing permissions for key:', key, error);
      }
    });
    
    return userPermissions;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!tenantId || !reportId) return;
      
      try {
        // First get tenant info to get the workspace ID
        const tenantRes = await authFetch(`${API_BASE_URL}/api/tenants/${tenantId}`);
        if (!tenantRes.ok) throw new Error('Failed to fetch tenant info');
        const tenantData: Tenant = await tenantRes.json();
        setTenant(tenantData);

        if (!tenantData.powerBiGroupId) {
          throw new Error('No PowerBI workspace configured for this tenant');
        }

        // Get user permissions for regular users
        const userPermissions = getUserPermissions();
        
        // Get reports to find the specific report
        const reportsRes = await authFetch(`${API_BASE_URL}/api/powerbi/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            groupId: tenantData.powerBiGroupId,
            userPermissions: userPermissions // Include permissions
          }),
        });
        
        if (!reportsRes.ok) throw new Error('Failed to fetch reports');
        const reportsData = await reportsRes.json();
        const foundReport = (reportsData.reports || []).find((r: any) => r.id === reportId);
        if (!foundReport) throw new Error('Report not found');
        setReport(foundReport);

        // Get embed token using both reportId and groupId
        const embedRes = await authFetch(`${API_BASE_URL}/api/powerbi/embed-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            reportId,
            groupId: tenantData.powerBiGroupId 
          }),
        });

        if (!embedRes.ok) throw new Error('Failed to get embed token');
        const embedData = await embedRes.json();
        setEmbedInfo(embedData);
      } catch (error: any) {
        console.error('Error loading report:', error);
        showToast(`❌ ${error.message || 'Failed to load report'}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reportId, tenantId, authFetch, showToast]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="large" className="mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!tenant || !report || !embedInfo || !embedInfo.embedToken) {
    return (
      <div className="p-6 text-red-500">
        {loading ? 'Loading report...' : 'Failed to load report. Please try refreshing the page.'}
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? '' : 'p-6'} text-gray-900 dark:text-white`}>
      {!isFullscreen && (
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold mb-2">{report.name}</h1>
          <div className="flex gap-2">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => setIsFullscreen(true)}
            >
              Enter Fullscreen
            </button>
            <button
              className="bg-gray-700 text-white px-4 py-2 rounded"
              onClick={() => navigate('/tenant/reports')}
            >
              ← Back to Reports List
            </button>
          </div>
        </div>
      )}
      <PowerBIEmbed
        embedToken={embedInfo.embedToken}
        embedUrl={embedInfo.embedUrl}
        reportId={embedInfo.reportId}
        isFullscreen={isFullscreen}
      />
    </div>
  );
}
