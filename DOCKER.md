# 🐳 Docker Deployment Guide

This guide explains how to deploy the MCP Server UI Automation system using Docker.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB of available RAM
- OpenAI API key (for Step 2 & 3 features)

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Clone the repository (if not already done)
cd Interact-UI-Agent

# Copy environment template
make setup
# Or manually:
cp .env.docker.example .env

# Edit .env and add your OPENAI_API_KEY
nano .env  # or use your favorite editor
```

### 2. Build and Start Services

```bash
# Build all images and start services
make dev

# Or manually:
docker-compose build
docker-compose up -d
```

### 3. Access Services

Once started, access the services at:

- **MCP Server API**: http://localhost:8080
- **SolidJS Demo App**: http://localhost:3000
- **Redis**: localhost:6379 (if USE_REDIS=true)

### 4. Verify Deployment

```bash
# Check service status
make ps

# Run health checks
make health

# View logs
make logs
```

## 📦 Services Overview

### MCP Server (Rust Backend)
- **Port**: 8080
- **Image**: Based on Debian Bullseye Slim
- **Features**:
  - Chromium browser for automation
  - OpenAI GPT-4 integration
  - Session management (in-memory or Redis)
  - JWT authentication
  - Rate limiting

### SolidJS Demo App (Frontend)
- **Port**: 3000 (maps to port 80 in container)
- **Image**: Based on Nginx Alpine
- **Features**:
  - Static file serving with Nginx
  - SPA routing support
  - Gzip compression
  - Security headers

### Redis (Optional Session Storage)
- **Port**: 6379
- **Image**: Redis 7 Alpine
- **Features**:
  - Persistent storage with AOF
  - Health checks
  - Optional for development (USE_REDIS=false by default)

## 🛠️ Makefile Commands

```bash
# Setup and Development
make setup          # Copy .env template
make dev            # Setup, build, start with logs
make build          # Build all images
make rebuild        # Rebuild from scratch

# Service Management
make up             # Start all services
make down           # Stop and remove containers
make restart        # Restart all services
make stop           # Stop services (keep containers)
make start          # Start stopped services

# Logs
make logs           # View all logs
make logs-server    # View MCP server logs only
make logs-app       # View SolidJS app logs only
make logs-redis     # View Redis logs only

# Maintenance
make clean          # Remove all containers, volumes, images
make clean-volumes  # Remove volumes (deletes Redis data)
make prune          # Remove unused Docker resources

# Status & Health
make ps             # Show service status
make health         # Check service health
make test           # Test deployment

# Shell Access
make shell-server   # Shell into MCP server container
make shell-app      # Shell into SolidJS app container
make shell-redis    # Open Redis CLI
```

## 🔧 Configuration

### Environment Variables

Edit `.env` file to configure:

```bash
# Required
OPENAI_API_KEY=sk-...              # Your OpenAI API key
OPENAI_MODEL=gpt-4                 # Model to use

# Optional
USE_REDIS=false                    # Use Redis for sessions
JWT_SECRET=your_secret_here        # JWT signing secret
RATE_LIMIT_PER_MINUTE=60          # Rate limit
SESSION_EXPIRATION_SECONDS=3600    # Session TTL
```

### Service-specific Configuration

**MCP Server:**
- Configure in `rust-mcp-server/.env.example`
- Runtime config via docker-compose environment variables

**SolidJS App:**
- Build-time config in `solidjs-demo-app/src/services/mcpService.ts`
- Update `MCP_SERVER_URL` if deploying separately

**Redis:**
- Default: No password (development)
- Production: Set `REDIS_PASSWORD` in `.env` and use `docker-compose.prod.yml`

## 🔒 Production Deployment

### Using Production Compose File

```bash
# Start with production settings
make prod-up

# Or manually:
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Production Considerations

1. **Security:**
   ```bash
   # Generate secure JWT secret
   openssl rand -hex 32

   # Set in .env
   JWT_SECRET=<generated_secret>

   # Set Redis password
   REDIS_PASSWORD=<strong_password>
   ```

2. **Enable Redis:**
   ```bash
   USE_REDIS=true
   ```

3. **Resource Limits:**
   - Production compose file includes CPU and memory limits
   - Adjust in `docker-compose.prod.yml` based on your needs

4. **SSL/TLS:**
   - Use reverse proxy (nginx, Caddy, Traefik) for HTTPS
   - Example nginx config:
   ```nginx
   server {
       listen 443 ssl http2;
       server_name your-domain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       location / {
           proxy_pass http://localhost:3000;
       }

       location /api/ {
           proxy_pass http://localhost:8080/;
       }
   }
   ```

5. **Monitoring:**
   - Services have health checks built-in
   - Use `make health` to verify
   - Integrate with Prometheus/Grafana for metrics

## 🐛 Troubleshooting

### Chromium Issues

If MCP server fails with Chromium errors:

```bash
# Check logs
make logs-server

# Increase shared memory
# Already configured in docker-compose.yml (shm_size: 2gb)
# If still issues, try:
docker-compose down
docker-compose up -d --force-recreate mcp-server
```

### Redis Connection Issues

```bash
# Check Redis is running
docker-compose ps redis

# Test Redis connection
make shell-redis
> ping
PONG
```

### Build Errors

```bash
# Clean rebuild
make clean
make build

# Check Docker disk space
docker system df

# Prune if needed
make prune
```

### Port Conflicts

If ports 8080, 3000, or 6379 are already in use:

```bash
# Edit docker-compose.yml and change port mappings
# Example: Change 8080:8080 to 8081:8080
nano docker-compose.yml
```

## 📊 Resource Usage

Typical resource usage:

- **MCP Server**: 1-2 GB RAM, 1-2 CPU cores
- **SolidJS App**: 50-100 MB RAM, minimal CPU
- **Redis**: 50-100 MB RAM, minimal CPU

Total recommended: **4GB RAM minimum**

## 🔄 Updating

```bash
# Pull latest changes
git pull

# Rebuild and restart
make rebuild

# Or rebuild specific service
docker-compose build mcp-server
docker-compose up -d mcp-server
```

## 📝 Logs and Debugging

```bash
# Follow all logs
make logs

# Follow specific service
make logs-server

# View last 100 lines
docker-compose logs --tail=100 mcp-server

# Export logs to file
docker-compose logs > logs.txt
```

## 🧪 Testing

```bash
# Run health checks
make test

# Test API endpoints
curl http://localhost:8080/health
curl http://localhost:8080/sessions

# Test with authentication
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

## 🆘 Getting Help

If you encounter issues:

1. Check logs: `make logs`
2. Check service status: `make ps`
3. Run health checks: `make health`
4. Review this guide's Troubleshooting section
5. Check GitHub issues

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Project Main README](./README.md)
- [MCP Server README](./rust-mcp-server/README.md)
