import { useEffect, useState } from 'react';
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
}

export default function AdminDataIntegrationPage() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const { authFetch } = useAuth();

  useEffect(() => {
    fetchDataSources();
    fetchIntegrations();
  }, []);

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
      setError('Failed to load data sources');
    }
  };

  const fetchIntegrations = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/admin/integrations`);
      if (!response.ok) {
        throw new Error('Failed to fetch integrations');
      }
      const data = await response.json();
      setIntegrations(data);
    } catch (error) {
      console.error('Error fetching integrations:', error);
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
        body: JSON.stringify({ sourceId }),
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
      fetchIntegrations();
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Data Integration</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Connect and manage external data sources for your tenants
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
          {dataSources.map((source) => (
            <DataSourceCard
              key={source.id}
              source={source}
              onConnect={() => handleSourceConnect(source)}
              getCategoryIcon={getCategoryIcon}
              getStatusColor={getStatusColor}
            />
          ))}
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
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Tenant</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Last Sync</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {integrations.map((integration) => (
                  <tr key={integration.id} className="border-b border-slate-100 dark:border-slate-700/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">
                          {getCategoryIcon(dataSources.find(s => s.id === integration.sourceId)?.category || 'accounting')}
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {integration.sourceName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {integration.tenantName}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                        {integration.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {new Date(integration.lastSync).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => disconnectIntegration(integration.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
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
  return (
    <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors duration-200 border border-slate-200 dark:border-slate-600">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-2xl">{source.icon}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{source.name}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm">{getCategoryIcon(source.category)}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{source.category}</span>
            </div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(source.status)}`}>
          {source.status}
        </span>
      </div>
      
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{source.description}</p>
      
      <button
        onClick={onConnect}
        disabled={source.status === 'connected'}
        className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
          source.status === 'connected'
            ? 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {source.status === 'connected' ? 'Connected' : 'Connect'}
      </button>
    </div>
  );
} 