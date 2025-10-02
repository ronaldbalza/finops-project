import { Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import {
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  BellIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../lib/store';
import { cn } from '../../lib/utils';

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      label: 'Your Profile',
      icon: UserIcon,
      href: '/settings/profile',
    },
    {
      label: 'Organization',
      icon: BuildingOfficeIcon,
      href: '/settings/organization',
      visible: user.role === 'OWNER' || user.role === 'ADMIN',
    },
    {
      label: 'Billing',
      icon: CreditCardIcon,
      href: '/settings/billing',
      visible: user.role === 'OWNER' || user.role === 'ADMIN',
    },
    {
      label: 'Notifications',
      icon: BellIcon,
      href: '/settings/notifications',
    },
    {
      label: 'Settings',
      icon: Cog6ToothIcon,
      href: '/settings',
    },
    {
      type: 'divider',
    },
    {
      label: 'Sign out',
      icon: ArrowRightOnRectangleIcon,
      action: handleLogout,
      className: 'text-red-600 hover:bg-red-50',
    },
  ];

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      OWNER: 'bg-purple-100 text-purple-800',
      ADMIN: 'bg-blue-100 text-blue-800',
      MANAGER: 'bg-green-100 text-green-800',
      ANALYST: 'bg-yellow-100 text-yellow-800',
      VIEWER: 'bg-gray-100 text-gray-800',
    };
    return colors[role as keyof typeof colors] || colors.VIEWER;
  };

  return (
    <Menu as="div" className={cn('relative', className)}>
      <Menu.Button className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors">
        <div className="flex-shrink-0">
          {user.avatar ? (
            <img
              className="h-8 w-8 rounded-full"
              src={user.avatar}
              alt={user.name}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {getUserInitials(user.name)}
              </span>
            </div>
          )}
        </div>
        <div className="hidden lg:flex lg:items-center lg:space-x-2">
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        </div>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              {user.avatar ? (
                <img
                  className="h-10 w-10 rounded-full"
                  src={user.avatar}
                  alt={user.name}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {getUserInitials(user.name)}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <div className="mt-1">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      getRoleBadgeColor(user.role)
                    )}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
            {user.tenant && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">Organization</p>
                <p className="text-sm font-medium text-gray-900">{user.tenant.name}</p>
              </div>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map((item, index) => {
              if (item.visible === false) {
                return null;
              }

              if (item.type === 'divider') {
                return <div key={index} className="border-t border-gray-100 my-1" />;
              }

              return (
                <Menu.Item key={item.label}>
                  {({ active }) => {
                    const itemContent = (
                      <>
                        {item.icon && (
                          <item.icon
                            className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                            aria-hidden="true"
                          />
                        )}
                        {item.label}
                      </>
                    );

                    const itemClassName = cn(
                      'group flex items-center px-4 py-2 text-sm',
                      active ? 'bg-gray-100' : '',
                      item.className || 'text-gray-700'
                    );

                    if (item.href) {
                      return (
                        <Link to={item.href} className={itemClassName}>
                          {itemContent}
                        </Link>
                      );
                    }

                    return (
                      <button
                        className={cn(itemClassName, 'w-full text-left')}
                        onClick={item.action}
                      >
                        {itemContent}
                      </button>
                    );
                  }}
                </Menu.Item>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

// Simplified avatar component for use in other places
export function UserAvatar({
  user,
  size = 'md',
  showName = false,
  className,
}: {
  user: { name: string; email?: string; avatar?: string };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  className?: string;
}) {
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-14 w-14 text-xl',
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn('flex items-center', className)}>
      {user.avatar ? (
        <img
          className={cn('rounded-full', sizeClasses[size])}
          src={user.avatar}
          alt={user.name}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-primary-600 flex items-center justify-center text-white font-medium',
            sizeClasses[size]
          )}
        >
          {getUserInitials(user.name)}
        </div>
      )}
      {showName && (
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          {user.email && <p className="text-xs text-gray-500">{user.email}</p>}
        </div>
      )}
    </div>
  );
}