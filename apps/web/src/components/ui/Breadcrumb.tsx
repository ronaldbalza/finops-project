import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
  separator?: 'chevron' | 'slash' | 'arrow';
  showHome?: boolean;
}

// Route configuration for automatic breadcrumb generation
const routeConfig: Record<string, { label: string; parent?: string }> = {
  '/dashboard': { label: 'Dashboard' },
  '/costs': { label: 'Cost Analysis' },
  '/costs/allocation': { label: 'Allocation', parent: '/costs' },
  '/costs/explorer': { label: 'Cost Explorer', parent: '/costs' },
  '/costs/anomalies': { label: 'Anomalies', parent: '/costs' },
  '/optimization': { label: 'Optimization' },
  '/optimization/recommendations': { label: 'Recommendations', parent: '/optimization' },
  '/optimization/rightsizing': { label: 'Rightsizing', parent: '/optimization' },
  '/optimization/commitments': { label: 'Commitments', parent: '/optimization' },
  '/budgets': { label: 'Budgets' },
  '/budgets/new': { label: 'Create Budget', parent: '/budgets' },
  '/budgets/:id': { label: 'Budget Details', parent: '/budgets' },
  '/reports': { label: 'Reports' },
  '/reports/new': { label: 'Create Report', parent: '/reports' },
  '/reports/:id': { label: 'Report Details', parent: '/reports' },
  '/governance': { label: 'Governance' },
  '/governance/policies': { label: 'Policies', parent: '/governance' },
  '/governance/compliance': { label: 'Compliance', parent: '/governance' },
  '/settings': { label: 'Settings' },
  '/settings/profile': { label: 'Profile', parent: '/settings' },
  '/settings/organization': { label: 'Organization', parent: '/settings' },
  '/settings/billing': { label: 'Billing', parent: '/settings' },
  '/settings/notifications': { label: 'Notifications', parent: '/settings' },
  '/settings/cloud-accounts': { label: 'Cloud Accounts', parent: '/settings' },
  '/settings/api-keys': { label: 'API Keys', parent: '/settings' },
  '/settings/users': { label: 'Users', parent: '/settings' },
  '/settings/security': { label: 'Security', parent: '/settings' },
};

export function Breadcrumb({
  items,
  className,
  separator = 'chevron',
  showHome = true,
}: BreadcrumbProps) {
  const location = useLocation();

  // Generate breadcrumb items from current route if not provided
  const breadcrumbItems = items || generateBreadcrumbItems(location.pathname);

  // Add home item if requested
  const allItems = showHome
    ? [{ label: 'Home', href: '/', icon: HomeIcon }, ...breadcrumbItems]
    : breadcrumbItems;

  if (allItems.length === 0) {
    return null;
  }

  const Separator = () => {
    switch (separator) {
      case 'slash':
        return <span className="mx-2 text-gray-400">/</span>;
      case 'arrow':
        return <span className="mx-2 text-gray-400">→</span>;
      case 'chevron':
      default:
        return <ChevronRightIcon className="mx-2 h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <nav className={cn('flex', className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const Icon = item.icon;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && <Separator />}
              {isLast || !item.href ? (
                <span
                  className={cn(
                    'text-sm',
                    isLast ? 'font-medium text-gray-900' : 'text-gray-500'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {Icon && <Icon className="inline-block h-4 w-4 mr-1" />}
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {Icon && <Icon className="inline-block h-4 w-4 mr-1" />}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Generate breadcrumb items from route path
function generateBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];

  // Clean up the pathname
  const cleanPath = pathname.endsWith('/') && pathname !== '/'
    ? pathname.slice(0, -1)
    : pathname;

  // Check if we have a direct route configuration
  const routeInfo = routeConfig[cleanPath];

  if (routeInfo) {
    // Build the breadcrumb trail by following parent links
    const buildTrail = (path: string): BreadcrumbItem[] => {
      const info = routeConfig[path];
      if (!info) return [];

      const trail: BreadcrumbItem[] = [];

      if (info.parent) {
        trail.push(...buildTrail(info.parent));
      }

      trail.push({
        label: info.label,
        href: path === cleanPath ? undefined : path,
      });

      return trail;
    };

    return buildTrail(cleanPath);
  }

  // Fallback: Generate breadcrumbs from URL segments
  const segments = cleanPath.split('/').filter(Boolean);
  let currentPath = '';

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const routeInfo = routeConfig[currentPath];
    const isLast = index === segments.length - 1;

    items.push({
      label: routeInfo?.label || formatSegmentLabel(segment),
      href: isLast ? undefined : currentPath,
    });
  });

  return items;
}

// Format URL segment to readable label
function formatSegmentLabel(segment: string): string {
  // Handle special segments
  if (segment.startsWith(':')) {
    return segment.substring(1).charAt(0).toUpperCase() + segment.substring(2);
  }

  // Convert kebab-case to Title Case
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Simplified breadcrumb for inline use
export function SimpleBreadcrumb({ items }: { items: string[] }) {
  return (
    <div className="flex items-center text-sm text-gray-500">
      {items.map((item, index) => (
        <span key={index} className="flex items-center">
          {index > 0 && <ChevronRightIcon className="mx-1 h-3 w-3" />}
          <span className={index === items.length - 1 ? 'text-gray-900' : ''}>
            {item}
          </span>
        </span>
      ))}
    </div>
  );
}

// Hook to get breadcrumb items for current route
export function useBreadcrumb(): BreadcrumbItem[] {
  const location = useLocation();
  return generateBreadcrumbItems(location.pathname);
}