# FinOps Platform

A cloud-native, multi-tenant FinOps platform leveraging Cloudflare's edge computing infrastructure to deliver real-time cloud cost management aligned with the FinOps Foundation Framework 2025.

## Project Overview

**Codename**: CloudLens
**Framework Compliance**: FinOps Foundation Framework 2025 + FOCUS v1.2
**Target Market**: Mid-market companies managing $50K-$5M in annual cloud spend

## Tech Stack

### Frontend
- React 18+ with TypeScript
- Tailwind CSS for styling
- D3.js, Recharts, and Apache ECharts for visualizations
- Zustand for state management
- React Query for server state
- Vite for build tooling

### Backend
- Cloudflare Workers (Edge computing)
- Hono web framework
- Prisma ORM with PostgreSQL
- Prisma Accelerate for connection pooling
- Workers KV for session storage
- R2 for report storage
- Durable Objects for real-time state

### Database
- PostgreSQL (Primary database)
- D1 (Edge cache)
- Workers KV (Sessions)
- R2 (Object storage)

## Prerequisites

- Node.js 20 LTS (use nvm: `nvm use`)
- pnpm 8+
- Git 2.40+
- Docker Desktop (for local PostgreSQL)
- Cloudflare account with Workers subscription
- Wrangler CLI 3+

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd finops-app
```

### 2. Install Node.js version

```bash
nvm use
# or nvm install 20
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 5. Start local database

```bash
docker-compose up -d
```

### 6. Run database migrations

```bash
pnpm run db:migrate
```

### 7. Start development server

```bash
pnpm run dev
```

## Branch Strategy

We follow a Git Flow-inspired branching strategy:

- **`main`** - Production-ready code, protected branch
- **`develop`** - Integration branch for features, protected branch
- **`feature/*`** - Feature branches (e.g., `feature/auth-oauth`)
- **`bugfix/*`** - Bug fix branches (e.g., `bugfix/allocation-calculation`)
- **`hotfix/*`** - Urgent production fixes (e.g., `hotfix/security-patch`)
- **`release/*`** - Release preparation branches (e.g., `release/v1.0.0`)

### Workflow

1. Create feature branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature
   ```

2. Make changes and commit:
   ```bash
   git add .
   git commit -m "feat: add my feature"
   ```

3. Push and create pull request to `develop`:
   ```bash
   git push origin feature/my-feature
   ```

4. After PR approval and merge to `develop`, create release branch:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v1.0.0
   ```

5. Merge release to `main` and tag:
   ```bash
   git checkout main
   git merge release/v1.0.0
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin main --tags
   ```

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Examples:**
```
feat(auth): add OAuth 2.0 with Google provider
fix(allocation): correct ESR calculation formula
docs(api): update cost allocation endpoint documentation
```

## Project Structure

```
finops-app/
├── apps/
│   ├── frontend/          # React frontend application
│   └── workers/           # Cloudflare Workers backend
├── packages/
│   ├── database/          # Prisma schema and migrations
│   ├── shared/            # Shared types and utilities
│   └── ui/                # Shared UI components
├── docs/                  # Documentation
├── .github/               # GitHub Actions workflows
├── CLAUDE.md              # Development guide for AI
├── PLANNING.md            # Strategic planning document
├── TASKS.md               # Task tracking
├── docker-compose.yml     # Local development services
├── turbo.json             # Turborepo configuration
└── package.json           # Root package configuration
```

## Available Scripts

```bash
# Development
pnpm run dev              # Start all apps in development mode
pnpm run dev:frontend     # Start only frontend
pnpm run dev:workers      # Start only workers

# Build
pnpm run build            # Build all apps
pnpm run build:frontend   # Build only frontend
pnpm run build:workers    # Build only workers

# Testing
pnpm run test             # Run all tests
pnpm run test:unit        # Run unit tests
pnpm run test:e2e         # Run E2E tests
pnpm run test:coverage    # Generate coverage report

# Database
pnpm run db:migrate       # Run database migrations
pnpm run db:seed          # Seed database with test data
pnpm run db:studio        # Open Prisma Studio
pnpm run db:reset         # Reset database

# Linting & Formatting
pnpm run lint             # Lint all code
pnpm run format           # Format all code
pnpm run typecheck        # Type check all code

# Deployment
pnpm run deploy:staging   # Deploy to staging
pnpm run deploy:prod      # Deploy to production
```

## Environment Variables

See `.env.example` for required environment variables:

- **Cloud Provider APIs**: AWS, Azure, GCP credentials
- **Database**: PostgreSQL connection string
- **Cloudflare**: Account ID, API token, KV namespace
- **OAuth**: Google and Microsoft client credentials
- **FinOps Settings**: Allocation targets, ESR goals

## Documentation

- **[PLANNING.md](PLANNING.md)** - Strategic planning and architecture
- **[CLAUDE.md](CLAUDE.md)** - Development guide aligned with FinOps Framework
- **[TASKS.md](TASKS.md)** - Task tracking and milestones
- **[API Documentation](docs/api/)** - API endpoint documentation
- **[Architecture](docs/architecture/)** - System architecture details

## FinOps Framework Alignment

This platform implements the FinOps Foundation Framework 2025:

### Six Core Principles
1. Teams Collaborate
2. Business Value Drives Decisions
3. Everyone Takes Ownership
4. Data is Accessible & Timely
5. Centrally Enabled
6. Variable Cost Model

### Four Domains
1. **Understand Usage & Cost** - Cost data ingestion, allocation, anomaly detection
2. **Quantify Business Value** - Unit economics, forecasting, benchmarking
3. **Optimize Usage & Cost** - ESR tracking, rightsizing, commitment management
4. **Manage FinOps Practice** - Maturity assessments, policies, governance

### FOCUS v1.2 Compliance
All cost data is normalized to the FinOps Open Cost & Usage Specification (FOCUS) standard.

## Key Metrics

- **Allocation**: Target >80% of costs allocated
- **ESR**: Target >15% effective savings rate
- **Unit Economics**: Track cost-per-customer
- **Forecast Accuracy**: Target <15% variance
- **Uptime**: 99.9% SLA

## Contributing

1. Read [CLAUDE.md](CLAUDE.md) for development guidelines
2. Create feature branch from `develop`
3. Follow commit conventions
4. Write tests for new features
5. Update documentation
6. Submit pull request

## Security

- All credentials encrypted at rest
- OAuth 2.0 with PKCE for authentication
- Row-level security for multi-tenancy
- Regular security audits
- SOC 2 compliance (target)

Report security vulnerabilities to: security@finops-platform.com

## License

Proprietary - All rights reserved

## Support

- Documentation: [docs.finops-platform.com](https://docs.finops-platform.com)
- Email: support@finops-platform.com
- Slack: [finops-platform.slack.com](https://finops-platform.slack.com)

## Acknowledgments

- [FinOps Foundation](https://finops.org) - Framework guidance
- [FOCUS](https://focus.finops.org) - Data specification
- [Cloudflare](https://cloudflare.com) - Edge computing platform

---

**Version**: 1.0.0
**Last Updated**: September 30, 2025
**Status**: In Development