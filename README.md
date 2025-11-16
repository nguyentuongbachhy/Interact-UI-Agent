# 🤖 MCP Server for UI Automation

Một hệ thống automation hoàn chỉnh cho phép LLM agents tương tác với Single-Page Applications (SPAs) thông qua Hybrid Architecture (Black-box execution + White-box triggers).

## 🌟 Tính năng

### ✅ Step 1: Core Infrastructure
- **Rust MCP Server** với axum framework
- **Browser Automation** với chromiumoxide (Chrome DevTools Protocol)
- **AXTree Extraction** cho UI context
- **Semantic Selectors** (role + name)
- **Smart Feedback Loop** với suggestions

### ✅ Step 1.5: Hybrid Architecture
- **SolidJS Demo App** với Solid Router
- **RouterTrigger** component tự động notify server khi page changes
- White-box triggers kết hợp black-box execution

### ✅ Step 2: Agent Logic
- **OpenAI GPT-4 Integration** cho decision making
- **Single-step Autonomous Execution**
- LLM quyết định next action dựa trên UI context
- JSON-based action generation

### ✅ Step 3: Feedback Loop
- **Multi-step Autonomous Execution** với retry mechanism
- **Conversation History** tracking
- **Smart Error Recovery** với context-aware prompts
- **Task Completion Detection** tự động
- Configurable max_steps và max_retries

### ✅ Step 4: Production Features
- **Redis Integration** cho persistent session storage
- **JWT Authentication** với middleware
- **Rate Limiting** với tower_governor
- **Multi-user Support** với session isolation
- Session expiration và cleanup tự động

## 🏗️ Kiến trúc

```
┌─────────────────────┐
│   SolidJS App       │
│   (Frontend)        │
│   - Router Trigger  │
└──────────┬──────────┘
           │ HTTP API
           │
┌──────────▼──────────┐      ┌──────────────┐
│   MCP Server        │◄─────┤   Redis      │
│   (Rust + axum)     │      │   (Sessions) │
│                     │      └──────────────┘
│  ┌───────────────┐  │
│  │ Agent Logic   │  │      ┌──────────────┐
│  │ (OpenAI GPT-4)│◄─┼──────┤  OpenAI API  │
│  └───────────────┘  │      └──────────────┘
│                     │
│  ┌───────────────┐  │
│  │ Browser       │  │
│  │ Automation    │  │
│  │ (chromiumoxide)│ │
│  └───────────────┘  │
└─────────────────────┘
```

## 🚀 Deployment

### 🐳 Docker (Recommended)

Cách nhanh nhất để chạy toàn bộ hệ thống:

```bash
# 1. Setup
git clone <repo>
cd Interact-UI-Agent
make setup

# 2. Configure .env
# Edit .env and add your OPENAI_API_KEY

# 3. Start all services
make dev

# 4. Access
# MCP Server: http://localhost:8080
# SolidJS App: http://localhost:3000
```

📖 **[Xem hướng dẫn Docker đầy đủ](./DOCKER.md)**

### 🔧 Manual Setup

#### Prerequisites
- Rust 1.75+
- Node.js 20+
- Chrome/Chromium browser
- Redis (optional, for Step 4)

#### MCP Server

```bash
cd rust-mcp-server

# Install dependencies
cargo build

# Setup environment
cp .env.example .env
# Edit .env and add OPENAI_API_KEY

# Run
cargo run --release
```

Server sẽ chạy tại: http://localhost:8080

#### SolidJS App

```bash
cd solidjs-demo-app

# Install dependencies
npm install

# Run development server
npm run dev
```

App sẽ chạy tại: http://localhost:3000

## 📚 API Documentation

### Authentication (Step 4)

```bash
# Login
POST /auth/login
Body: {"username": "john", "password": "secret"}
Response: {"token": "eyJ...", "user_id": "...", "username": "john"}

# Get current user
GET /auth/me
Headers: Authorization: Bearer <token>
```

### Session Management

```bash
# Create session
POST /sessions
Body: {"initial_url": "http://localhost:3000", "viewport_width": 1280, "viewport_height": 720}

# List sessions
GET /sessions

# Delete session
DELETE /sessions/:session_id
```

### Browser Control (Step 1)

```bash
# Get UI context (AXTree)
GET /:session_id/get_context

# Execute action
POST /:session_id/execute
Body: {"tool": "click", "role": "button", "name": "Login"}

# Handle trigger (from client)
POST /:session_id/trigger
Body: {"event": "page_changed", "path": "/products"}
```

### AI Agent (Step 2 & 3)

```bash
# Single-step execution
POST /:session_id/agent/execute
Body: {"task": "Click the login button"}

# Multi-step execution with retry
POST /:session_id/agent/execute_multi_step
Body: {
  "task": "Login with username 'john' and password '123456'",
  "max_steps": 20,
  "max_retries_per_step": 3
}
```

## 🧪 Testing

### Quick Health Check

```bash
# Using make (with Docker)
make test

# Manual
curl http://localhost:8080/health
curl http://localhost:3000/health
```

### Example Agent Task

```bash
# Create session
SESSION_ID=$(curl -s -X POST http://localhost:8080/sessions \
  -H "Content-Type: application/json" \
  -d '{"initial_url":"http://localhost:3000"}' | jq -r '.session_id')

# Execute multi-step task
curl -X POST http://localhost:8080/${SESSION_ID}/agent/execute_multi_step \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Navigate to the products page",
    "max_steps": 10
  }' | jq '.'
```

## 🛠️ Tech Stack

### Backend (MCP Server)
- **Language**: Rust 2021
- **Framework**: axum 0.7
- **Browser**: chromiumoxide 0.7 (Chrome DevTools Protocol)
- **LLM**: async-openai 0.23 (GPT-4)
- **Auth**: jsonwebtoken 9.3
- **Rate Limiting**: tower_governor 0.4
- **Session Store**: DashMap 6.0 / Redis 0.26

### Frontend (Demo App)
- **Framework**: SolidJS 1.9
- **Router**: @solidjs/router 0.15
- **Build**: Vite 7.2
- **Language**: TypeScript 5.9

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (for SolidJS static files)
- **Cache/Store**: Redis 7

## 📖 Documentation

- [Docker Deployment Guide](./DOCKER.md) - Hướng dẫn deploy với Docker
- [MCP Server README](./rust-mcp-server/README.md) - Chi tiết về Rust backend
- [SolidJS App README](./solidjs-demo-app/README.md) - Chi tiết về frontend

## 🔐 Security

### Development
- JWT secret: Mặc định (NOT SECURE)
- Redis: No password
- Rate limiting: 60 req/min

### Production
- ✅ Thay đổi JWT_SECRET (generate với `openssl rand -hex 32`)
- ✅ Bật Redis password (set REDIS_PASSWORD)
- ✅ Sử dụng HTTPS với reverse proxy
- ✅ Bật required authentication (uncomment protected_routes trong routes.rs)
- ✅ Điều chỉnh rate limiting theo nhu cầu

Xem [DOCKER.md](./DOCKER.md#-production-deployment) để biết thêm chi tiết.

## 📊 Resource Requirements

### Minimum
- **RAM**: 4GB
- **CPU**: 2 cores
- **Disk**: 2GB

### Recommended
- **RAM**: 8GB
- **CPU**: 4 cores
- **Disk**: 5GB

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- OpenAI cho GPT-4 API
- chromiumoxide team cho browser automation
- SolidJS team cho reactive framework
- Rust và axum communities

## 🆘 Support

Nếu gặp vấn đề:

1. Check [DOCKER.md Troubleshooting](./DOCKER.md#-troubleshooting)
2. Review logs: `make logs` (Docker) hoặc check console output
3. Search existing GitHub issues
4. Create new issue with detailed information

---

Made with ❤️ using Rust 🦀 and SolidJS ⚡
