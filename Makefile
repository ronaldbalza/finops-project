.PHONY: help install dev build test clean docker-up docker-down db-migrate db-seed db-studio

# Default target
.DEFAULT_GOAL := help

# Colors for output
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RESET  := $(shell tput -Txterm sgr0)

## help: Display this help message
help:
	@echo "$(GREEN)FinOps Platform - Available Commands$(RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make $(GREEN)<target>$(RESET)\n\nTargets:\n"} \
		/^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

## install: Install all dependencies
install:
	@echo "$(GREEN)Installing dependencies...$(RESET)"
	pnpm install

## dev: Start development servers
dev:
	@echo "$(GREEN)Starting development servers...$(RESET)"
	pnpm run dev

## dev-frontend: Start frontend only
dev-frontend:
	@echo "$(GREEN)Starting frontend...$(RESET)"
	pnpm run dev:frontend

## dev-backend: Start backend only
dev-backend:
	@echo "$(GREEN)Starting backend...$(RESET)"
	pnpm run dev:backend

## build: Build all applications
build:
	@echo "$(GREEN)Building applications...$(RESET)"
	pnpm run build

## test: Run all tests
test:
	@echo "$(GREEN)Running tests...$(RESET)"
	pnpm run test

## test-unit: Run unit tests
test-unit:
	@echo "$(GREEN)Running unit tests...$(RESET)"
	pnpm run test:unit

## test-e2e: Run end-to-end tests
test-e2e:
	@echo "$(GREEN)Running E2E tests...$(RESET)"
	pnpm run test:e2e

## lint: Lint all code
lint:
	@echo "$(GREEN)Linting code...$(RESET)"
	pnpm run lint

## format: Format all code
format:
	@echo "$(GREEN)Formatting code...$(RESET)"
	pnpm run format

## typecheck: Type check all code
typecheck:
	@echo "$(GREEN)Type checking...$(RESET)"
	pnpm run typecheck

## clean: Clean all build artifacts and dependencies
clean:
	@echo "$(YELLOW)Cleaning build artifacts...$(RESET)"
	pnpm run clean
	rm -rf node_modules

## docker-up: Start Docker services
docker-up:
	@echo "$(GREEN)Starting Docker services...$(RESET)"
	docker-compose up -d

## docker-down: Stop Docker services
docker-down:
	@echo "$(YELLOW)Stopping Docker services...$(RESET)"
	docker-compose down

## docker-logs: View Docker logs
docker-logs:
	docker-compose logs -f

## docker-reset: Reset Docker services and volumes
docker-reset:
	@echo "$(YELLOW)Resetting Docker services...$(RESET)"
	docker-compose down -v
	docker-compose up -d

## db-migrate: Run database migrations
db-migrate:
	@echo "$(GREEN)Running database migrations...$(RESET)"
	pnpm run db:migrate

## db-seed: Seed database with test data
db-seed:
	@echo "$(GREEN)Seeding database...$(RESET)"
	pnpm run db:seed

## db-studio: Open Prisma Studio
db-studio:
	@echo "$(GREEN)Opening Prisma Studio...$(RESET)"
	pnpm run db:studio

## db-reset: Reset database
db-reset:
	@echo "$(YELLOW)Resetting database...$(RESET)"
	pnpm run db:reset

## setup: Complete project setup
setup: install docker-up db-migrate db-seed
	@echo "$(GREEN)Setup complete! Run 'make dev' to start development.$(RESET)"

## deploy-staging: Deploy to staging
deploy-staging:
	@echo "$(GREEN)Deploying to staging...$(RESET)"
	pnpm run deploy:staging

## deploy-prod: Deploy to production
deploy-prod:
	@echo "$(YELLOW)Deploying to production...$(RESET)"
	@read -p "Are you sure you want to deploy to production? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		pnpm run deploy:prod; \
	else \
		echo "Deployment cancelled."; \
	fi