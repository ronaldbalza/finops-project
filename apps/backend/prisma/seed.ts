import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default tenant
  const defaultTenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo',
      subdomain: 'demo',
      maturityLevel: 'CRAWL',
      focusEnabled: true,
      allocationTarget: 80,
      esrTarget: 0.15,
      plan: 'TRIAL',
      status: 'ACTIVE',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      settings: {
        currency: 'USD',
        timezone: 'America/New_York',
        fiscalYearStart: 'JANUARY'
      }
    }
  });

  console.log(`✅ Created tenant: ${defaultTenant.name}`);

  // Create demo users
  const demoUsers = [
    {
      email: 'admin@demo.com',
      name: 'Admin User',
      role: 'ADMIN' as const,
      provider: 'GOOGLE' as const,
      providerId: 'google-admin-123'
    },
    {
      email: 'analyst@demo.com',
      name: 'Analyst User',
      role: 'ANALYST' as const,
      provider: 'GOOGLE' as const,
      providerId: 'google-analyst-123'
    },
    {
      email: 'viewer@demo.com',
      name: 'Viewer User',
      role: 'VIEWER' as const,
      provider: 'MICROSOFT' as const,
      providerId: 'ms-viewer-123'
    }
  ];

  for (const userData of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        tenantId: defaultTenant.id,
        status: 'ACTIVE',
        emailVerified: true,
        permissions: [],
        preferences: {
          theme: 'light',
          notifications: true
        }
      }
    });
    console.log(`✅ Created user: ${user.email} (${user.role})`);
  }

  // Create sample cloud accounts
  const awsAccount = await prisma.cloudAccount.upsert({
    where: {
      tenantId_provider_accountId: {
        tenantId: defaultTenant.id,
        provider: 'AWS',
        accountId: '123456789012'
      }
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      provider: 'AWS',
      accountId: '123456789012',
      accountName: 'Production AWS Account',
      credentials: {
        encrypted: true,
        roleArn: 'arn:aws:iam::123456789012:role/FinOpsRole'
      },
      regions: ['us-east-1', 'us-west-2', 'eu-west-1'],
      services: ['EC2', 'S3', 'RDS', 'Lambda'],
      status: 'ACTIVE',
      lastSyncAt: new Date()
    }
  });

  console.log(`✅ Created cloud account: ${awsAccount.accountName}`);

  // Create sample budgets
  const budgets = [
    {
      name: 'Monthly Cloud Budget',
      description: 'Overall monthly cloud spending budget',
      amount: 50000,
      period: 'MONTHLY' as const,
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      scope: {
        type: 'all',
        filters: {}
      },
      alertThresholds: [50, 80, 100],
      alertEmails: ['finance@demo.com', 'ops@demo.com'],
      currentSpend: 32450.50,
      forecastedSpend: 48750.25,
      status: 'ACTIVE' as const
    },
    {
      name: 'Q4 Development Budget',
      description: 'Development environment budget for Q4',
      amount: 15000,
      period: 'QUARTERLY' as const,
      startDate: new Date(new Date().getFullYear(), 9, 1), // October 1st
      endDate: new Date(new Date().getFullYear(), 11, 31), // December 31st
      scope: {
        type: 'tags',
        filters: {
          environment: 'development'
        }
      },
      alertThresholds: [60, 80, 95],
      alertEmails: ['dev-lead@demo.com'],
      currentSpend: 8234.75,
      forecastedSpend: 14500.00,
      status: 'ACTIVE' as const
    }
  ];

  for (const budgetData of budgets) {
    const budget = await prisma.budget.create({
      data: {
        ...budgetData,
        tenantId: defaultTenant.id
      }
    });
    console.log(`✅ Created budget: ${budget.name}`);
  }

  // Create sample unit metrics
  const currentDate = new Date();
  const metrics = [
    {
      metricType: 'cost_per_customer',
      metricName: 'Cost per Customer',
      value: 12.50,
      unit: 'USD',
      previousValue: 11.25,
      trend: 'UP' as const,
      changePercentage: 11.11,
      date: currentDate,
      period: 'MONTHLY' as const,
      dimensions: {
        customerCount: 4000,
        totalCost: 50000
      }
    },
    {
      metricType: 'cost_per_transaction',
      metricName: 'Cost per Transaction',
      value: 0.0025,
      unit: 'USD',
      previousValue: 0.0028,
      trend: 'DOWN' as const,
      changePercentage: -10.71,
      date: currentDate,
      period: 'DAILY' as const,
      dimensions: {
        transactionCount: 2000000,
        totalCost: 5000
      }
    }
  ];

  for (const metricData of metrics) {
    const metric = await prisma.unitMetric.create({
      data: {
        ...metricData,
        tenantId: defaultTenant.id
      }
    });
    console.log(`✅ Created unit metric: ${metric.metricName}`);
  }

  // Create sample policies
  const policies = [
    {
      name: 'Mandatory Tagging Policy',
      description: 'All resources must have required tags',
      type: 'TAGGING' as const,
      rules: {
        requiredTags: ['Environment', 'Owner', 'CostCenter', 'Project'],
        enforcement: 'preventCreation'
      },
      enforced: true,
      action: 'PREVENT' as const,
      scope: {
        services: ['EC2', 'RDS', 'S3'],
        regions: ['*']
      },
      status: 'ACTIVE' as const,
      complianceRate: 87.5
    },
    {
      name: 'Instance Type Restrictions',
      description: 'Limit expensive instance types in dev/test',
      type: 'RESOURCE' as const,
      rules: {
        deniedInstanceTypes: ['*.xlarge', '*.2xlarge', '*.4xlarge'],
        environments: ['development', 'testing']
      },
      enforced: false,
      action: 'NOTIFY' as const,
      scope: {
        services: ['EC2'],
        tags: { Environment: ['development', 'testing'] }
      },
      status: 'ACTIVE' as const,
      complianceRate: 92.3
    }
  ];

  for (const policyData of policies) {
    const policy = await prisma.policy.create({
      data: {
        ...policyData,
        tenantId: defaultTenant.id,
        lastEvaluatedAt: new Date()
      }
    });
    console.log(`✅ Created policy: ${policy.name}`);
  }

  console.log('');
  console.log('🎉 Database seed completed successfully!');
  console.log('');
  console.log('Demo credentials:');
  console.log('----------------');
  console.log('Admin: admin@demo.com');
  console.log('Analyst: analyst@demo.com');
  console.log('Viewer: viewer@demo.com');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });