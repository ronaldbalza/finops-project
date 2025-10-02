import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '../components/layout/RootLayout';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';

// Pages
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { CostExplorer } from '../pages/CostExplorer';
import { AllocationPage } from '../pages/AllocationPage';
import { OptimizationPage } from '../pages/OptimizationPage';
import { BudgetsPage } from '../pages/BudgetsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SettingsPage } from '../pages/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'costs',
            element: <CostExplorer />,
          },
          {
            path: 'allocation',
            element: <AllocationPage />,
          },
          {
            path: 'optimization',
            element: <OptimizationPage />,
          },
          {
            path: 'budgets',
            element: <BudgetsPage />,
          },
          {
            path: 'reports',
            element: <ReportsPage />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
]);