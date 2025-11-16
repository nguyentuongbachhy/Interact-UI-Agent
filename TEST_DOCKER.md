# 🧪 Docker Testing Guide

Hướng dẫn test Docker deployment trên máy local của bạn.

## ⚠️ Note

Docker **không có sẵn** trong môi trường Claude Code này, nhưng tất cả các Docker files đã được verify và sẵn sàng để test trên máy của bạn.

## ✅ Files Verified

Đã kiểm tra và confirm các files sau đều có mặt và đúng cấu trúc:

```
✓ docker-compose.yml
✓ docker-compose.prod.yml
✓ .env.docker.example
✓ Makefile
✓ DOCKER.md
✓ README.md
✓ rust-mcp-server/Dockerfile
✓ rust-mcp-server/.dockerignore
✓ solidjs-demo-app/Dockerfile
✓ solidjs-demo-app/.dockerignore
✓ solidjs-demo-app/nginx.conf
```

## 🚀 Quick Test (Trên Máy Của Bạn)

### 1. Prerequisites

Cài đặt Docker và Docker Compose:

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo systemctl start docker
sudo usermod -aG docker $USER
# Log out and back in
```

**macOS:**
```bash
# Download and install Docker Desktop
# https://www.docker.com/products/docker-desktop
```

**Windows:**
```powershell
# Download and install Docker Desktop
# https://www.docker.com/products/docker-desktop
```

### 2. Clone Repository (Nếu Chưa)

```bash
git clone <your-repo-url>
cd Interact-UI-Agent
```

### 3. Setup Environment

```bash
# Copy environment template
make setup
# Or manually:
cp .env.docker.example .env
```

### 4. Configure OpenAI API Key

```bash
# Edit .env file
nano .env  # or vim, code, etc.

# Add your OpenAI API key:
OPENAI_API_KEY=sk-your-actual-key-here
```

### 5. Build and Start Services

```bash
# Option 1: One command (recommended)
make dev

# Option 2: Step by step
make build    # Build all images (takes 5-10 minutes)
make up       # Start all services
make logs     # Follow logs
```

### 6. Verify Services

```bash
# Check service status
make ps

# Should show:
# Name                Command               State           Ports
# -------------------------------------------------------------------------
# mcp-redis      redis-server --appendonly yes  Up      6379/tcp
# mcp-server     /app/mcp-server                Up      0.0.0.0:8080->8080/tcp
# solidjs-app    nginx -g daemon off;           Up      0.0.0.0:3000->80/tcp
```

### 7. Test Health Endpoints

```bash
# Test all services
make health

# Or manually:
curl http://localhost:8080/health  # Should return: OK
curl http://localhost:3000/health  # Should return: healthy
docker-compose exec redis redis-cli ping  # Should return: PONG
```

### 8. Test API Endpoints

```bash
# Create a session
curl -X POST http://localhost:8080/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "initial_url": "http://localhost:3000",
    "viewport_width": 1280,
    "viewport_height": 720
  }'

# Should return something like:
# {"session_id":"550e8400-e29b-41d4-a716-446655440000"}

# Get sessions list
curl http://localhost:8080/sessions | jq '.'

# Test authentication
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}' | jq '.'
```

### 9. Test Agent Execution

```bash
# Get session ID from previous step
SESSION_ID="your-session-id-here"

# Test single-step agent
curl -X POST http://localhost:8080/${SESSION_ID}/agent/execute \
  -H "Content-Type: application/json" \
  -d '{"task":"Click the Home link"}' | jq '.'

# Test multi-step agent
curl -X POST http://localhost:8080/${SESSION_ID}/agent/execute_multi_step \
  -H "Content-Type: application/json" \
  -d '{
    "task":"Navigate to the products page and click the first product",
    "max_steps": 10,
    "max_retries_per_step": 3
  }' | jq '.'
```

### 10. Access Web Interfaces

Open in browser:
- **MCP Server API**: http://localhost:8080
- **SolidJS Demo App**: http://localhost:3000

## 🐛 Troubleshooting

### Issue: Port Already in Use

```bash
# Check what's using the port
sudo lsof -i :8080  # or :3000, :6379

# Stop docker-compose and change ports in docker-compose.yml
make down
nano docker-compose.yml  # Change port mappings
make up
```

### Issue: Chromium Crashes

```bash
# Check MCP server logs
make logs-server

# If you see Chromium crashes, increase shared memory:
# Already configured in docker-compose.yml (shm_size: 2gb)
# If still issues, try increasing to 4gb
```

### Issue: Build Fails

```bash
# Clean rebuild
make clean
make build

# If dependency issues, check network connectivity
# Docker needs to pull images and download dependencies
```

### Issue: OpenAI API Errors

```bash
# Check your API key is correct in .env
cat .env | grep OPENAI_API_KEY

# Check MCP server logs for API errors
make logs-server

# Test API key manually:
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Issue: Redis Connection Failed

```bash
# Check Redis is running
make shell-redis
# In redis-cli:
> ping
PONG

# If USE_REDIS=true, make sure Redis is healthy
docker-compose ps redis
```

## 📊 Expected Resource Usage

During build:
- **CPU**: 80-100% (normal)
- **RAM**: 2-4GB
- **Time**: 5-10 minutes for first build

During runtime:
- **MCP Server**: 1-2GB RAM, 1-2 CPU cores
- **SolidJS App**: 50-100MB RAM
- **Redis**: 50-100MB RAM
- **Total**: ~2-3GB RAM

## 🧹 Cleanup After Testing

```bash
# Stop all services
make down

# Remove everything (containers, volumes, images)
make clean

# Or keep images but remove volumes
make clean-volumes
```

## ✅ Success Criteria

Deployment thành công nếu:

- ✅ All 3 services running (`make ps`)
- ✅ Health checks pass (`make health`)
- ✅ Can create session via API
- ✅ Can access SolidJS app in browser
- ✅ Agent can execute tasks (if OPENAI_API_KEY set)
- ✅ No errors in logs (`make logs`)

## 📝 Testing Checklist

```bash
□ Docker and Docker Compose installed
□ Repository cloned
□ .env file created and configured
□ OpenAI API key added
□ make build completed successfully
□ make up started all services
□ make health shows all services healthy
□ Can access http://localhost:8080/health
□ Can access http://localhost:3000
□ Can create session via API
□ Can execute agent task (if API key set)
□ No errors in make logs
```

## 🎥 Demo Script

Complete end-to-end test:

```bash
# 1. Setup
cd Interact-UI-Agent
make setup
# Edit .env and add OPENAI_API_KEY

# 2. Start
make dev
# Wait for build to complete (~5-10 min first time)

# 3. Test in another terminal
make test

# 4. Create session
SESSION_ID=$(curl -s -X POST http://localhost:8080/sessions \
  -H "Content-Type: application/json" \
  -d '{"initial_url":"http://localhost:3000"}' | jq -r '.session_id')

echo "Session ID: $SESSION_ID"

# 5. Run agent task
curl -X POST http://localhost:8080/${SESSION_ID}/agent/execute_multi_step \
  -H "Content-Type: application/json" \
  -d '{
    "task":"Click on Products link and then About link",
    "max_steps": 5
  }' | jq '.'

# 6. Open browser and watch
# http://localhost:3000

# 7. View logs
make logs-server

# 8. Cleanup
make down
```

## 🚀 Production Testing

Test with production config:

```bash
# 1. Setup production env
cp .env.docker.example .env
nano .env
# Set:
#   USE_REDIS=true
#   REDIS_PASSWORD=strong_password
#   JWT_SECRET=$(openssl rand -hex 32)

# 2. Start with production config
make prod-up

# 3. Test
make health

# 4. Cleanup
make prod-down
```

## 📚 Next Steps

After successful testing:

1. Read [DOCKER.md](./DOCKER.md) for advanced configuration
2. Check [README.md](./README.md) for API documentation
3. Review security settings for production
4. Set up monitoring and logging
5. Configure reverse proxy for HTTPS

## 💬 Getting Help

If stuck:

1. Check logs: `make logs`
2. Review this guide's Troubleshooting section
3. See [DOCKER.md](./DOCKER.md#-troubleshooting)
4. Check GitHub issues
5. Create new issue with:
   - Output of `make ps`
   - Output of `make logs`
   - Your OS and Docker version
   - Steps to reproduce

---

Happy Testing! 🎉
