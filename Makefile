.PHONY: help build up down restart logs clean test

# Default target
.DEFAULT_GOAL := help

# ============================================
# Help
# ============================================
help: ## Show this help message
	@echo "=========================================="
	@echo "MCP Server UI Automation - Docker Commands"
	@echo "=========================================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ============================================
# Setup
# ============================================
setup: ## Initial setup - copy .env file
	@if [ ! -f .env ]; then \
		cp .env.docker.example .env; \
		echo "✅ Created .env file from .env.docker.example"; \
		echo "⚠️  Please edit .env and add your OPENAI_API_KEY"; \
	else \
		echo "ℹ️  .env file already exists"; \
	fi

# ============================================
# Docker Compose Commands
# ============================================
build: ## Build all Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d
	@echo ""
	@echo "✅ Services started!"
	@echo "📊 MCP Server: http://localhost:8080"
	@echo "🌐 SolidJS App: http://localhost:3000"
	@echo "🗄️  Redis: localhost:6379"
	@echo ""
	@echo "Run 'make logs' to view logs"

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

stop: ## Stop all services without removing containers
	docker-compose stop

start: ## Start stopped services
	docker-compose start

# ============================================
# Logs
# ============================================
logs: ## View logs from all services
	docker-compose logs -f

logs-server: ## View logs from MCP server only
	docker-compose logs -f mcp-server

logs-app: ## View logs from SolidJS app only
	docker-compose logs -f solidjs-app

logs-redis: ## View logs from Redis only
	docker-compose logs -f redis

# ============================================
# Development
# ============================================
dev: setup build up logs ## Setup, build, and start with logs

rebuild: ## Rebuild and restart all services
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	@echo "✅ Services rebuilt and restarted!"

# ============================================
# Maintenance
# ============================================
clean: ## Remove all containers, volumes, and images
	docker-compose down -v --rmi all
	@echo "✅ Cleaned up all Docker resources"

clean-volumes: ## Remove all volumes (WARNING: deletes Redis data)
	docker-compose down -v
	@echo "⚠️  All volumes removed (including Redis data)"

prune: ## Remove unused Docker resources
	docker system prune -f
	@echo "✅ Pruned unused Docker resources"

# ============================================
# Status & Health
# ============================================
ps: ## Show status of all services
	docker-compose ps

health: ## Check health of all services
	@echo "Checking service health..."
	@docker-compose ps
	@echo ""
	@echo "MCP Server health:"
	@curl -s http://localhost:8080/health || echo "❌ MCP Server not healthy"
	@echo ""
	@echo "SolidJS App health:"
	@curl -s http://localhost:3000/health || echo "❌ SolidJS App not healthy"

# ============================================
# Shell Access
# ============================================
shell-server: ## Open shell in MCP server container
	docker-compose exec mcp-server /bin/sh

shell-app: ## Open shell in SolidJS app container
	docker-compose exec solidjs-app /bin/sh

shell-redis: ## Open Redis CLI
	docker-compose exec redis redis-cli

# ============================================
# Testing
# ============================================
test: ## Test the deployment
	@echo "Testing MCP Server..."
	@curl -s http://localhost:8080/health && echo "✅ MCP Server: OK" || echo "❌ MCP Server: FAILED"
	@echo ""
	@echo "Testing SolidJS App..."
	@curl -s http://localhost:3000/health && echo "✅ SolidJS App: OK" || echo "❌ SolidJS App: FAILED"
	@echo ""
	@echo "Testing Redis..."
	@docker-compose exec -T redis redis-cli ping && echo "✅ Redis: OK" || echo "❌ Redis: FAILED"

# ============================================
# Production
# ============================================
prod-up: ## Start services in production mode
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-down: ## Stop production services
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
