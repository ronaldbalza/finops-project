import { useState, useMemo } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowsUpDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { cn, formatCurrency, formatCompactNumber, getTrend } from '../../lib/utils';
import { Spinner } from '../ui/Spinner';

interface Resource {
  id: string;
  name: string;
  type: string;
  service: string;
  region: string;
  account: string;
  tags: Record<string, string>;
  currentCost: number;
  previousCost: number;
  usage: number;
  usageUnit: string;
  status: 'running' | 'stopped' | 'terminated';
  lastModified: Date;
}

interface TopResourcesTableProps {
  resources?: Resource[];
  loading?: boolean;
  error?: string;
  onResourceClick?: (resource: Resource) => void;
  className?: string;
}

type SortField = 'name' | 'service' | 'currentCost' | 'usage' | 'trend';
type SortOrder = 'asc' | 'desc';

export function TopResourcesTable({
  resources = [],
  loading = false,
  error,
  onResourceClick,
  className,
}: TopResourcesTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('currentCost');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Extract unique services and regions for filters
  const services = useMemo(() => {
    const serviceSet = new Set(resources.map(r => r.service));
    return Array.from(serviceSet).sort();
  }, [resources]);

  const regions = useMemo(() => {
    const regionSet = new Set(resources.map(r => r.region));
    return Array.from(regionSet).sort();
  }, [resources]);

  // Filter resources
  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      const matchesSearch =
        searchQuery === '' ||
        resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.account.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesService = selectedService === 'all' || resource.service === selectedService;
      const matchesRegion = selectedRegion === 'all' || resource.region === selectedRegion;

      return matchesSearch && matchesService && matchesRegion;
    });
  }, [resources, searchQuery, selectedService, selectedRegion]);

  // Sort resources
  const sortedResources = useMemo(() => {
    const sorted = [...filteredResources];

    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'service':
          aValue = a.service;
          bValue = b.service;
          break;
        case 'currentCost':
          aValue = a.currentCost;
          bValue = b.currentCost;
          break;
        case 'usage':
          aValue = a.usage;
          bValue = b.usage;
          break;
        case 'trend':
          aValue = ((a.currentCost - a.previousCost) / a.previousCost) * 100;
          bValue = ((b.currentCost - b.previousCost) / b.previousCost) * 100;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  }, [filteredResources, sortField, sortOrder]);

  // Paginate resources
  const paginatedResources = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedResources.slice(startIndex, endIndex);
  }, [sortedResources, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedResources.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExport = () => {
    // Convert to CSV
    const headers = ['Name', 'Type', 'Service', 'Region', 'Account', 'Current Cost', 'Previous Cost', 'Trend %', 'Usage', 'Status'];
    const rows = sortedResources.map(r => {
      const trend = getTrend(r.currentCost, r.previousCost);
      return [
        r.name,
        r.type,
        r.service,
        r.region,
        r.account,
        r.currentCost.toString(),
        r.previousCost.toString(),
        trend.percentage.toFixed(2),
        `${r.usage} ${r.usageUnit}`,
        r.status,
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `top-resources-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4 text-primary-600" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 text-primary-600" />
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'stopped':
        return 'bg-yellow-100 text-yellow-800';
      case 'terminated':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={cn('bg-white rounded-lg shadow p-8', className)}>
        <div className="flex items-center justify-center">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-600">Loading resources...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('bg-white rounded-lg shadow p-8', className)}>
        <div className="text-center">
          <p className="text-red-600">Error loading resources: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg shadow', className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Resources by Cost</h3>
          <button
            onClick={handleExport}
            className="flex items-center px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Service Filter */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Services</option>
              {services.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>

          {/* Region Filter */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Resource</span>
                  <SortIcon field="name" />
                </div>
              </th>
              <th
                onClick={() => handleSort('service')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Service</span>
                  <SortIcon field="service" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Region
              </th>
              <th
                onClick={() => handleSort('currentCost')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Current Cost</span>
                  <SortIcon field="currentCost" />
                </div>
              </th>
              <th
                onClick={() => handleSort('trend')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Trend</span>
                  <SortIcon field="trend" />
                </div>
              </th>
              <th
                onClick={() => handleSort('usage')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Usage</span>
                  <SortIcon field="usage" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedResources.map((resource) => {
              const trend = getTrend(resource.currentCost, resource.previousCost);

              return (
                <tr
                  key={resource.id}
                  onClick={() => onResourceClick?.(resource)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{resource.name}</p>
                      <p className="text-xs text-gray-500">{resource.type}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{resource.service}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{resource.region}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(resource.currentCost)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Prev: {formatCurrency(resource.previousCost)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {trend.direction === 'up' && (
                        <ChevronUpIcon className={cn('h-4 w-4', trend.color)} />
                      )}
                      {trend.direction === 'down' && (
                        <ChevronDownIcon className={cn('h-4 w-4', trend.color)} />
                      )}
                      <span className={cn('text-sm ml-1', trend.color)}>
                        {trend.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">
                      {formatCompactNumber(resource.usage)} {resource.usageUnit}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        getStatusColor(resource.status)
                      )}
                    >
                      {resource.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, sortedResources.length)}
              </span>{' '}
              of{' '}
              <span className="font-medium">{sortedResources.length}</span>{' '}
              results
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={cn(
                  'px-3 py-1 text-sm border rounded-md',
                  currentPage === 1
                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                )}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  );
                })
                .map((page, index, array) => {
                  if (index > 0 && array[index - 1] !== page - 1) {
                    return [
                      <span key={`ellipsis-${page}`} className="px-2 py-1 text-gray-400">
                        ...
                      </span>,
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          'px-3 py-1 text-sm border rounded-md',
                          page === currentPage
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        {page}
                      </button>,
                    ];
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        'px-3 py-1 text-sm border rounded-md',
                        page === currentPage
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      {page}
                    </button>
                  );
                })
                .flat()}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  'px-3 py-1 text-sm border rounded-md',
                  currentPage === totalPages
                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                )}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}