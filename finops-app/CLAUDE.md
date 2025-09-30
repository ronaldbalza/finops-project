# CLAUDE.md - FinOps Platform Development Guide

## Project Overview

Building a multi-tenant FinOps platform that consolidates cloud costs from AWS, Azure, and GCP, providing real-time visibility, optimization recommendations, and automated cost management aligned with the FinOps Foundation Framework.

**Project Name**: FinOps Platform  
**Version**: 1.0  
**Framework Alignment**: FinOps Foundation Framework 2025  
**Target Market**: Mid-size companies (100-5,000 employees) with $50K-$5M annual cloud spend  
**Revenue Model**: Usage-based pricing tied to cloud spend under management

## Core Tech Stack

```yaml
Frontend:
  - React 18+ with TypeScript
  - Tailwind CSS
  - D3.js for visualizations
  - Recharts for standard charts
  - Apache ECharts for complex dashboards
  - Zustand for state management
  - React Query for API calls
  - Vite for build tooling

Backend:
  - Cloudflare Workers (Edge computing)
  - Prisma ORM with PostgreSQL
  - Prisma Accelerate for connection pooling
  - Workers KV for session storage
  - R2 for report storage
  - Durable Objects for real-time state

Database:
  - PostgreSQL (Primary database)
  - D1 (Edge cache)
  - Workers KV (Sessions)
  - R2 (Object storage)

Authentication:
  - OAuth 2.0 (Google & Microsoft)
  - JWT tokens in Workers KV
  - Role-based access control (RBAC)
```

## FinOps Framework Alignment

### Maturity Model Implementation
```typescript
enum MaturityLevel {
  CRAWL = "crawl",  // Basic visibility, manual processes
  WALK = "walk",    // Automated reporting, defined KPIs
  RUN = "run"       // Full automation, proactive optimization
}

// Each capability tracked at different maturity
interface CapabilityMaturity {
  capability: string;
  currentLevel: MaturityLevel;
  targetLevel: MaturityLevel;
  gapAnalysis: string[];
}
```

### Six Core Principles (Must Implement)
1. **Teams Collaborate** - Real-time dashboards, shared visibility
2. **Business Value Drives Decisions** - Unit economics tracking
3. **Everyone Takes Ownership** - Team-based cost allocation
4. **Data is Accessible & Timely** - Real-time cost updates
5. **Centrally Enabled** - Central FinOps team features
6. **Variable Cost Model** - Continuous optimization cycles

### Four Domains Coverage

#### 1. Understand Usage & Cost
- Cost data ingestion every 4 hours
- Allocation to teams/projects (target: 80%+ coverage)
- Anomaly detection with ML
- FOCUS-compliant data normalization

#### 2. Quantify Business Value
- Unit economics (cost-per-customer primary metric)
- Forecasting with <15% variance target
- Budget tracking and alerts
- Benchmarking capabilities

#### 3. Optimize Usage & Cost
- Rate optimization (ESR tracking)
- Workload rightsizing recommendations
- Commitment discount management
- Waste identification

#### 4. Manage FinOps Practice
- Maturity assessments
- Policy governance
- Training tracking
- Chargeback/showback

## Key Metrics Implementation

### Primary KPIs (Must Track)
```typescript
interface CoreMetrics {
  // Allocation
  allocationPercentage: number; // Target: 80% Crawl, 90%+ Run
  unallocatedCosts: number;
  
  // Optimization
  effectiveSavingsRate: number; // (Contracted - Effective) / Contracted
  utilizationRate: number; // Target: 80% for RIs
  wastePercentage: number;
  
  // Business Value
  costPerCustomer: number;
  cloudSpendAsPercentOfRevenue: number;
  unitEconomicsTrend: TrendData[];
  
  // Forecasting
  forecastVariance: number; // Target: <15% Walk, <12% Run
  budgetVariance: number; // Target: <5% Run
  
  // Practice
  maturityScore: Record<string, MaturityLevel>;
  automationCoverage: number;
  stakeholderEngagement: number;
}
```

### FOCUS Compliance
```typescript
// Implement FOCUS v1.2 standard columns
interface FOCUSDataModel {
  // Required metrics
  billedCost: Decimal;
  effectiveCost: Decimal;
  listCost: Decimal;
  contractedCost: Decimal;
  consumedQuantity: Decimal;
  pricingQuantity: Decimal;
  
  // Required dimensions
  providerId: string;
  serviceId: string;
  resourceId: string;
  region: string;
  availabilityZone: string;
  invoiceId: string; // v1.2 addition
  billingAccountType: string; // v1.2 addition
}
```

## Database Schema Requirements

```prisma
// Core models aligned with FinOps Framework
model Tenant {
  id                String    @id @default(cuid())
  name              String
  maturityLevel     String    @default("crawl")
  focusEnabled      Boolean   @default(false)
  
  // FinOps metrics
  allocationTarget  Int       @default(80) // percentage
  esrTarget         Decimal   @default(0.15) // 15% savings target
  
  // Relationships
  users             User[]
  cloudAccounts     CloudAccount[]
  costData          CostData[]
  budgets           Budget[]
  unitMetrics       UnitMetric[]
}

model CostData {
  // FOCUS-compliant fields
  billedCost        Decimal   @db.Decimal(15, 4)
  effectiveCost     Decimal   @db.Decimal(15, 4)
  listCost          Decimal   @db.Decimal(15, 4)
  
  // Allocation fields
  allocated         Boolean   @default(false)
  allocationKeys    Json?     // Tags for allocation
  teamId            String?
  projectId         String?
  
  // Optimization tracking
  optimizable       Boolean   @default(false)
  wasteType         String?   // idle, orphaned, oversized
  savingsOpportunity Decimal? @db.Decimal(15, 4)
}

model UnitMetric {
  id                String    @id @default(cuid())
  tenantId          String
  metricType        String    // cost_per_customer, cost_per_transaction
  value             Decimal   @db.Decimal(15, 4)
  trend             String    // up, down, stable
  date              DateTime  @db.Date
  
  @@index([tenantId, metricType, date])
}
```

## API Endpoints (FinOps-Aligned)

```typescript
// Core FinOps APIs
const finOpsRoutes = {
  // Inform Phase
  'GET /api/costs/allocation': 'Get allocation breakdown',
  'GET /api/costs/unallocated': 'List unallocated costs',
  'GET /api/costs/anomalies': 'Detected anomalies',
  'GET /api/costs/focus': 'FOCUS-formatted data',
  
  // Optimize Phase  
  'GET /api/optimization/esr': 'Effective Savings Rate',
  'GET /api/optimization/rightsizing': 'Rightsizing opportunities',
  'GET /api/optimization/waste': 'Waste identification',
  'POST /api/optimization/recommendations/:id/action': 'Act on recommendation',
  
  // Operate Phase
  'GET /api/governance/policies': 'Active policies',
  'GET /api/governance/violations': 'Policy violations',
  'POST /api/chargeback/generate': 'Generate chargeback',
  'GET /api/maturity/assessment': 'Maturity assessment',
  
  // Unit Economics
  'GET /api/unit-economics': 'Unit metrics',
  'POST /api/unit-economics/define': 'Define new metric',
  
  // Forecasting
  'GET /api/forecast': 'Cost forecast',
  'GET /api/forecast/variance': 'Forecast accuracy',
  'POST /api/budgets': 'Create budget',
  'GET /api/budgets/:id/variance': 'Budget variance'
};
```

## Development Guidelines

### 1. Always Start with Allocation
- First priority: achieve 80% allocation coverage
- Use account structure before complex tagging
- Track allocation percentage as primary KPI

### 2. Implement Unit Economics Early
```typescript
// Start simple with cost-per-customer
async function calculateCostPerCustomer(tenantId: string) {
  const totalCost = await getTotalCloudCost(tenantId);
  const customerCount = await getActiveCustomerCount(tenantId);
  
  return {
    metric: 'cost_per_customer',
    value: totalCost / customerCount,
    date: new Date(),
    trend: await calculateTrend('cost_per_customer', tenantId)
  };
}
```

### 3. Focus on ESR for Optimization
```typescript
// Primary optimization metric
function calculateESR(costs: CostData[]): number {
  const contractedCost = sum(costs.map(c => c.contractedCost));
  const effectiveCost = sum(costs.map(c => c.effectiveCost));
  
  return (contractedCost - effectiveCost) / contractedCost;
}
```

### 4. Respect Maturity Progression
- Don't implement Run features before Walk stability
- Build culture before complex automation
- Start with showback, add chargeback when ready

### 5. FOCUS Data Normalization
```typescript
// Transform provider data to FOCUS format
async function normalizeTOFOCUS(
  providerData: any,
  provider: 'aws' | 'azure' | 'gcp'
): Promise<FOCUSDataModel> {
  // Map provider-specific fields to FOCUS standard
  const focusData = {
    billedCost: extractBilledCost(providerData, provider),
    effectiveCost: calculateEffectiveCost(providerData, provider),
    // ... map all required FOCUS fields
  };
  
  return validateFOCUSCompliance(focusData);
}
```

## Component Patterns

### Dashboard Components
```typescript
// FinOps-aligned dashboard structure
<FinOpsDashboard>
  {/* Inform Phase Widgets */}
  <AllocationWidget target={80} current={allocationPercentage} />
  <CostTrendChart data={costTrends} showAnomalies />
  <UnallocatedCostsTable costs={unallocatedCosts} />
  
  {/* Optimize Phase Widgets */}
  <ESRGauge current={esr} target={0.15} />
  <OptimizationRecommendations items={recommendations} />
  <WasteHeatmap data={wasteByService} />
  
  {/* Operate Phase Widgets */}
  <MaturityRadar capabilities={maturityScores} />
  <PolicyComplianceRate rate={complianceRate} />
  
  {/* Business Value */}
  <UnitEconomicsChart metric="cost_per_customer" />
  <ForecastAccuracy variance={forecastVariance} />
</FinOpsDashboard>
```

### Visualization Requirements
```typescript
// D3.js visualizations for complex FinOps data
const requiredCharts = {
  'Cost Allocation Sunburst': 'Hierarchical cost breakdown',
  'ESR Timeline': 'Savings rate over time',
  'Maturity Radar Chart': 'Capability maturity visualization',
  'Unit Economics Trends': 'Business metrics over time',
  'Waste Heatmap': 'Service x Time waste identification',
  'Forecast Confidence Bands': 'Prediction with uncertainty',
  'Budget Burn Rate': 'Actual vs budget consumption'
};
```

## Testing Requirements

### Metric Accuracy Tests
```typescript
describe('FinOps Metrics', () => {
  test('ESR calculation matches FinOps Foundation formula', () => {
    const costs = generateTestCosts();
    const esr = calculateESR(costs);
    expect(esr).toMatchFinOpsStandard();
  });
  
  test('Allocation percentage excludes adjustments', () => {
    const allocation = calculateAllocationPercentage(costs);
    expect(allocation).toExcludeAdjustments();
  });
  
  test('Unit metrics update with cost changes', () => {
    const metrics = calculateUnitEconomics(tenantId);
    expect(metrics.costPerCustomer).toReflectLatestCosts();
  });
});
```

## Error Handling Patterns

```typescript
// FinOps-specific error handling
class FinOpsError extends Error {
  constructor(
    message: string,
    public code: string,
    public capability: string,
    public impact: 'critical' | 'high' | 'medium' | 'low'
  ) {
    super(message);
  }
}

// Example usage
if (allocationPercentage < 50) {
  throw new FinOpsError(
    'Allocation below critical threshold',
    'ALLOCATION_TOO_LOW',
    'allocation',
    'critical'
  );
}
```

## Performance Targets

```yaml
API Response Times:
  - Cost queries: <200ms p95
  - Aggregations: <500ms p95
  - Reports: <10s for monthly data
  
Data Freshness:
  - Cloud provider sync: Every 4 hours
  - Anomaly detection: Within 1 hour
  - Dashboard updates: Real-time via WebSocket
  
Scale Requirements:
  - 1,000+ tenants
  - 1TB+ daily billing data
  - 10,000+ concurrent users
```

## Common Pitfalls to Avoid

1. **Don't Skip Allocation** - It's the foundation of everything
2. **Don't Over-Engineer Early** - Start with cost-per-customer
3. **Don't Focus Only on Cost** - Track business value metrics
4. **Don't Ignore FOCUS** - Standardize data early
5. **Don't Rush to Chargeback** - Build trust with showback first
6. **Don't Automate Too Early** - Establish processes first
7. **Don't Neglect Training** - Track FinOps education metrics

## Session Instructions for Claude

When working on this project:

1. **Always check FinOps alignment** - Every feature should map to a Framework capability
2. **Prioritize allocation** - If allocation is <80%, focus there first
3. **Track maturity** - Know which maturity level we're building for
4. **Use FOCUS terminology** - Standardize on FOCUS field names
5. **Calculate ESR correctly** - It's the primary optimization metric
6. **Start with showback** - Don't implement chargeback without explicit request
7. **Implement unit economics** - At minimum, track cost-per-customer
8. **Follow the three phases** - Inform → Optimize → Operate
9. **Respect the principles** - All six must be evident in the implementation
10. **Measure everything** - If it's not measured, it's not FinOps

## Quick Reference

### Priority Order for New Features
1. Allocation improvements (if <80%)
2. Unit economics implementation
3. ESR and optimization metrics
4. Forecast accuracy improvements
5. Anomaly detection enhancements
6. Governance and policy automation
7. Advanced ML/AI features

### Key Files to Create/Modify
```
src/
  lib/
    finops/
      metrics.ts         # Core metric calculations
      allocation.ts      # Allocation engine
      optimization.ts    # ESR and recommendations
      focus.ts          # FOCUS data normalization
      maturity.ts       # Maturity assessment
  components/
    dashboard/
      AllocationWidget.tsx
      ESRGauge.tsx
      UnitEconomicsChart.tsx
      MaturityRadar.tsx
  api/
    costs/
      allocation.ts
      anomalies.ts
    optimization/
      esr.ts
      recommendations.ts
    governance/
      policies.ts
      assessment.ts
```

### Environment Variables Required
```env
# Cloud Provider APIs
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
GCP_SERVICE_ACCOUNT_KEY=

# Database
DATABASE_URL=postgresql://...
PRISMA_ACCELERATE_URL=

# Cloudflare
CF_ACCOUNT_ID=
CF_API_TOKEN=
KV_NAMESPACE_ID=
R2_BUCKET_NAME=

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# FinOps Settings
ALLOCATION_TARGET=80
ESR_TARGET=0.15
FORECAST_VARIANCE_TARGET=15
```

## Success Criteria

The platform is successful when:
1. **Allocation**: >80% of costs allocated to teams/projects
2. **ESR**: Achieving >15% effective savings rate
3. **Unit Economics**: Cost-per-customer tracked and trending down
4. **Forecast Accuracy**: <15% variance between forecast and actual
5. **Adoption**: >70% of stakeholders actively using dashboards
6. **Maturity**: At least Walk level in core capabilities
7. **FOCUS Compliance**: All data normalized to FOCUS standard
8. **Business Value**: Demonstrable ROI through optimization savings

### Always read PLANNING.md at the start of every new conversation, check TASKS.md before starting your work, mark completed tasks to TASKS.md immediately, and add newly discovered tasks to TASKS.md when found.


*This guide aligns with FinOps Foundation Framework 2025 and FOCUS v1.2 specifications.*
