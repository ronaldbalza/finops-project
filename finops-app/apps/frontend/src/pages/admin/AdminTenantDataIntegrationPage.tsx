import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';

interface DataSource {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'available' | 'connected' | 'error';
  category: 'accounting' | 'crm' | 'commerce' | 'analytics';
  authType: 'oauth2' | 'api_key' | 'basic';
}

interface Integration {
  id: string;
  sourceId: string;
  sourceName: string;
  tenantId: string;
  tenantName: string;
  status: 'active' | 'inactive' | 'error';
  lastSync: string;
  createdAt: string;
  fabricWorkspaceId?: string;
  fabricDatasetId?: string;
}

export default function AdminTenantDataIntegrationPage() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const { authFetch, login } = useAuth();



  useEffect(() => {
    if (tenantId) {
      fetchDataSources();
      fetchTenantIntegrations();
    } else {
      console.error('No tenantId provided');
      setError('Invalid tenant ID');
      setLoading(false);
    }
  }, [tenantId]);

  // Handle OAuth callback authentication and success message
  useEffect(() => {
    const token = searchParams.get('token');
    const success = searchParams.get('success');
    const source = searchParams.get('source');

    // If we have a token from OAuth callback, authenticate the user
    if (token) {
      console.log('OAuth token found, authenticating user...');
      const authData = {
        id: 'oauth-superadmin',
        email: 'oauth@system.admin',
        type: 'superadmin' as const,
        roles: ['superadmin'],
        token: token
      };
      
      // Use login function from AuthContext
      login(authData);
      
      console.log('User authenticated via OAuth callback');
    }

    // Handle success message
    if (success === 'connected' && source) {
      showToast(`✅ ${source} integration connected successfully! Credentials stored in Microsoft Fabric Data Warehouse.`, 'success');
      // Clean up URL after a short delay to ensure toast is shown
      setTimeout(() => {
        navigate(`/admin/tenants/${tenantId}/data-integration`, { replace: true });
      }, 100);
    }
  }, [searchParams, tenantId, navigate, showToast, login]);

  const fetchDataSources = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/admin/data-sources`);
      if (!response.ok) {
        throw new Error('Failed to fetch data sources');
      }
      const sources = await response.json();
      setDataSources(sources);
    } catch (error) {
      console.error('Error fetching data sources:', error);
      setError('Failed to load data sources from API, using fallback data');
      // Set fallback mock data sources to allow page to render
      setDataSources([
        {
          id: 'mock-xero-source',
          name: 'Xero',
          description: 'Connect to Xero accounting software',
          icon: 'XERO',
          status: 'available',
          category: 'accounting',
          authType: 'oauth2'
        },
        {
          id: 'mock-xero-practice-manager-source',
          name: 'Xero Practice Manager',
          description: 'Connect to Xero Practice Manager',
          icon: 'XPM',
          status: 'available',
          category: 'accounting',
          authType: 'oauth2'
        }
      ]);
    }
  };

  // Helper function to get source status based on integrations
  const getSourceStatus = (sourceId: string): 'available' | 'connected' | 'error' => {
    const integration = integrations.find(i => i.sourceId === sourceId);
    if (!integration) return 'available';
    
    switch (integration.status) {
      case 'active':
        return 'connected';
      case 'error':
        return 'error';
      default:
        return 'available';
    }
  };

  const fetchTenantIntegrations = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/admin/tenants/${tenantId}/integrations`);
      if (!response.ok) {
        throw new Error('Failed to fetch integrations');
      }
      const data = await response.json();
      setIntegrations(data);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      // Set empty array to allow page to render
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  const initiateOAuth = async (sourceId: string) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/admin/oauth/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceId, tenantId }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate OAuth flow');
      }

      const { authUrl } = await response.json();
      
      // Redirect to OAuth provider
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      showToast('❌ Failed to start authentication flow', 'error');
    }
  };

  const handleSourceConnect = (source: DataSource) => {
    if (source.authType === 'oauth2') {
      initiateOAuth(source.id);
    } else {
      showToast('🚧 This integration type is coming soon', 'info');
    }
  };

  const disconnectIntegration = async (integrationId: string) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/admin/integrations/${integrationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect integration');
      }

      showToast('✅ Integration disconnected successfully', 'success');
      fetchTenantIntegrations();
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      showToast('❌ Failed to disconnect integration', 'error');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'accounting': return '📊';
      case 'crm': return '👥';
      case 'commerce': return '🛒';
      case 'analytics': return '📈';
      default: return '🔗';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'error':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      case 'inactive':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      default:
        return 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-700';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Ensure we never show a completely blank page
  if (!tenantId) {
    return (
      <div className="space-y-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center">
            <span className="text-red-600 dark:text-red-400 text-lg mr-3">⚠️</span>
            <p className="text-red-700 dark:text-red-300">Invalid tenant ID. Please navigate from the tenants page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <button
              onClick={() => navigate('/admin/tenants')}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              ← Back to Tenants
            </button>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
            Data Integration
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Connect and manage external data sources
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
          <span>🔗</span>
          <span>{integrations.filter(i => i.status === 'active').length} Active Connections</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center">
            <span className="text-red-600 dark:text-red-400 text-lg mr-3">⚠️</span>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Available Data Sources */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
          Available Data Sources
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dataSources.map((source) => {
            const sourceWithStatus = {
              ...source,
              status: getSourceStatus(source.id)
            };
            return (
              <DataSourceCard
                key={source.id}
                source={sourceWithStatus}
                onConnect={() => handleSourceConnect(source)}
                getCategoryIcon={getCategoryIcon}
                getStatusColor={getStatusColor}
              />
            );
          })}
        </div>
      </div>

      {/* Active Integrations */}
      {integrations.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Active Integrations
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Source</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Fabric Dataset</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Last Sync</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Connected</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {integrations.map((integration) => (
                  <tr key={integration.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getCategoryIcon('accounting')}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {integration.sourceName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                        {integration.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-600 dark:text-slate-400">
                        {integration.fabricDatasetId ? (
                          <div>
                            <p className="font-mono text-xs">{integration.fabricDatasetId}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">Microsoft Fabric</p>
                          </div>
                        ) : (
                          <span className="text-slate-400">Not configured</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {new Date(integration.lastSync).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {new Date(integration.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => disconnectIntegration(integration.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                      >
                        Disconnect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

interface DataSourceCardProps {
  source: DataSource;
  onConnect: () => void;
  getCategoryIcon: (category: string) => string;
  getStatusColor: (status: string) => string;
}

function DataSourceCard({ source, onConnect, getCategoryIcon, getStatusColor }: DataSourceCardProps) {
  const getLogoDisplay = (icon: string, name: string) => {
    // Handle text-based logos with brand colors
    switch (icon) {
      case 'XERO':
        return (
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs">XERO</span>
          </div>
        );
      case 'XPM':
        return (
          <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs">XPM</span>
          </div>
        );
      case 'SF':
        return (
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs">SF</span>
          </div>
        );
      case 'QB':
        return (
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs">QB</span>
          </div>
        );
      default:
        // Fallback for URLs or other formats
        if (icon.startsWith('http')) {
          return (
            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm">
              <img src={icon} alt={name} className="w-6 h-6" onError={(e) => {
                // Fallback to first two letters if image fails
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = `<span class="text-slate-600 dark:text-slate-300 font-bold text-xs">${name.substring(0, 2).toUpperCase()}</span>`;
              }} />
            </div>
          );
        } else {
          // For emoji or other text
          return (
            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-lg">{icon}</span>
            </div>
          );
        }
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-600">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getLogoDisplay(source.icon, source.name)}
          <div>
            <h3 className="font-medium text-slate-800 dark:text-slate-200">{source.name}</h3>
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(source.status)}`}>
              {source.status}
            </span>
          </div>
        </div>
        <span className="text-sm">{getCategoryIcon(source.category)}</span>
      </div>
      
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        {source.description}
      </p>

      <button
        onClick={onConnect}
        disabled={source.status === 'connected'}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          source.status === 'connected'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {source.status === 'connected' ? '✅ Connected' : '🔗 Connect'}
      </button>
    </div>
  );
} 