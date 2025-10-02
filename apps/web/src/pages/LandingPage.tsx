import { Link } from 'react-router-dom';
import { ChartBarIcon, CurrencyDollarIcon, LightBulbIcon, ChartPieIcon, CloudArrowUpIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Real-time Cost Visibility',
    description: 'Monitor cloud spending across AWS, Azure, and GCP in real-time with unified dashboards.',
    icon: ChartBarIcon,
  },
  {
    name: 'Smart Cost Allocation',
    description: 'Achieve 80%+ allocation coverage with intelligent tagging and team-based cost distribution.',
    icon: ChartPieIcon,
  },
  {
    name: 'AI-Powered Optimization',
    description: 'Get actionable recommendations to reduce costs by 15-30% with automated optimization.',
    icon: LightBulbIcon,
  },
  {
    name: 'Multi-Cloud Support',
    description: 'Seamlessly manage costs across all major cloud providers from a single platform.',
    icon: CloudArrowUpIcon,
  },
  {
    name: 'FinOps Best Practices',
    description: 'Aligned with FinOps Foundation Framework to ensure maturity progression.',
    icon: CurrencyDollarIcon,
  },
  {
    name: 'Enterprise Security',
    description: 'SOC 2 Type II compliant with end-to-end encryption and RBAC controls.',
    icon: ShieldCheckIcon,
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">FinOps Platform</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-700 hover:text-gray-900 font-medium">
                Sign In
              </Link>
              <Link
                to="/login"
                className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900">
              Take Control of Your
              <span className="text-primary-600"> Cloud Costs</span>
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-600">
              The enterprise-grade FinOps platform that helps you optimize cloud spending,
              improve allocation, and achieve financial excellence across AWS, Azure, and GCP.
            </p>
            <div className="mt-10 flex justify-center space-x-4">
              <Link
                to="/login"
                className="bg-primary-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Start Free Trial
              </Link>
              <button className="bg-white text-primary-600 border-2 border-primary-600 px-8 py-3 rounded-md text-lg font-medium hover:bg-primary-50 transition-colors">
                Watch Demo
              </button>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-50 to-white opacity-50" />
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Everything You Need for Cloud Financial Management
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Built for FinOps teams, by FinOps experts
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <feature.icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">{feature.name}</h3>
                </div>
                <p className="mt-4 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">
              Ready to optimize your cloud costs?
            </h2>
            <p className="mt-4 text-xl text-primary-100">
              Join hundreds of companies saving 15-30% on their cloud bills
            </p>
            <Link
              to="/login"
              className="mt-8 inline-block bg-white text-primary-700 px-8 py-3 rounded-md text-lg font-medium hover:bg-primary-50 transition-colors"
            >
              Start Your Free Trial
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray-400">
            <p>&copy; 2025 FinOps Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}