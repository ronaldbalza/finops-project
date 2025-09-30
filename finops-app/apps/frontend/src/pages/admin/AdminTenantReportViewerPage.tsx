import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import PowerBIEmbed from '../../components/PowerBIEmbed';
import LoadingSpinner from '../../components/LoadingSpinner';
import { API_BASE_URL } from '../../utils/api';

export default function AdminTenantReportViewerPage() {
  const { tenantId, reportId } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { showToast } = useToast();
  const [tenant, setTenant] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [embedInfo, setEmbedInfo] = useState<{ embedToken: string; embedUrl: string; reportId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tenantRes = await authFetch(`${API_BASE_URL}/api/admin/tenants/${tenantId}`);
        const tenantData = await tenantRes.json();
        setTenant(tenantData);
        if (tenantData.powerBiGroupId) {
          const reportsRes = await authFetch(`${API_BASE_URL}/api/admin/powerbi/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId: tenantData.powerBiGroupId }),
          });
          const reportsData = await reportsRes.json();
          const foundReport = (reportsData.reports || []).find((r: any) => r.id === reportId);
          setReport(foundReport);
          if (foundReport) {
            const embedRes = await authFetch(`${API_BASE_URL}/api/admin/powerbi/embed-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reportId, groupId: tenantData.powerBiGroupId }),
            });
            const embedData = await embedRes.json();
            setEmbedInfo(embedData);
          }
        }
      } catch {
        showToast('❌ Failed to load report', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, [tenantId, reportId]);

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

  if (!tenant || !report) return <div className="p-6 text-red-500">Report not found.</div>;

  return (
    <div className={`${isFullscreen ? '' : 'p-6'} text-gray-900 dark:text-white`}>
      {!isFullscreen && (
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold mb-2">{tenant.name} - {report.name}</h1>
          <div className="flex gap-2">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => setIsFullscreen(true)}
            >
              Enter Fullscreen
            </button>
            <button
              className="bg-gray-700 text-white px-4 py-2 rounded"
              onClick={() => navigate(`/admin/tenants/${tenantId}/reports`)}
            >
              ← Back to Reports List
            </button>
          </div>
        </div>
      )}
      {embedInfo && (
        <PowerBIEmbed
          embedToken={embedInfo.embedToken}
          embedUrl={embedInfo.embedUrl}
          reportId={embedInfo.reportId}
          isFullscreen={isFullscreen}
        />
      )}
    </div>
  );
} 
