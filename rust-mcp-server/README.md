# MCP Server for UI Automation (Rust Implementation)

> **Hybrid Architecture**: Black-box execution + White-box triggers for SPA interaction

## 🎯 Overview

This is a **Rust-based MCP Server** designed to enable LLM agents to interact with Single-Page Applications (SPAs). It implements a hybrid architecture that combines:

- **Black-box Execution**: Browser automation via `playwright-rs`
- **White-box Triggers**: Client-side notifications for routing changes

## 🏗️ Architecture

### Tech Stack

- **Backend**: Rust + `axum` (web framework)
- **Browser Automation**: `chromiumoxide` (Chrome DevTools Protocol)
- **Agent Logic**: OpenAI API (GPT-4) - **Step 2 Complete** ✅
- **Frontend**: SolidJS + Solid-Router (Step 1.5)

### Key Solutions Implemented

#### ✅ Solution A: Clean Context via AXTree
- Extracts Accessibility Tree instead of raw HTML
- Provides simplified, semantic element list to LLM
- Format: `[1] Button('Login')`, `[2] Textbox('Username')`

#### ✅ Solution B: Semantic Selectors
- Uses role-based selectors: `role=button[name="Login"]`
- Resilient to UI changes (no CSS selectors)
- Playwright-native selector format

#### ✅ Solution C: Smart Feedback Loop
- Returns actionable error messages with suggestions
- Example: `"element_not_visible" → suggestion: "call scroll_down()"`
- Enables self-correction by LLM agent

## 📋 Implementation Status

### ✅ Step 1: Execution Layer (Complete)

**API Endpoints**:

```
POST   /sessions                    - Create new browser session
GET    /sessions                    - List all sessions
DELETE /sessions/:session_id        - Delete session

GET    /:session_id/get_context     - Extract UI context (AXTree)
POST   /:session_id/execute         - Execute action (click, type, scroll)
POST   /:session_id/trigger         - Handle client-side triggers
```

**Action Types**:
- `click` - Click element by semantic selector
- `type` - Type text into input
- `scroll` - Scroll page (up/down/left/right)
- `wait_for_element` - Wait for element to appear
- `navigate` - Navigate to URL

### ✅ Step 1.5: Client-side Trigger (Complete)

SolidJS app with RouterTrigger component that notifies server on route changes.

### ✅ Step 2: Agent Logic (Complete)

**Integrated LLM for autonomous decision-making:**
- OpenAI API client wrapper (`async-openai`)
- Prompt engineering with AXTree context
- Single-step autonomous task execution
- JSON-based action generation

**API Endpoint**:
```
POST /:session_id/agent/execute
Body: { "task": "Click the login button" }
```

**Flow**:
1. Extract UI context (AXTree)
2. Send context + task to LLM
3. LLM decides next action (JSON)
4. Execute action on browser
5. Return result with updated context

**Multi-user Support**: Sessions include `user_id` field for future multi-tenant scenarios.

### ⏳ Step 3: Feedback Loop (Planned)

Multi-step execution with error recovery.

### ⏳ Step 4: Session Management (Planned)

Redis-based session storage for scalability.

## 🚀 Getting Started

### Prerequisites

1. **Rust** (1.70+)
2. **Chrome/Chromium** installed (for chromiumoxide)
3. **OpenAI API Key** (for agent functionality)

### Installation

```bash
# Clone repository
cd rust-mcp-server

# Copy environment file
cp .env.example .env

# Add your OpenAI API key to .env
# OPENAI_API_KEY=sk-...

# Build project
cargo build --release

# Run server
cargo run --release
```

Server will start on `http://0.0.0.0:8080`

### Testing

```bash
# Create a session
curl -X POST http://localhost:8080/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "initial_url": "http://localhost:3000",
    "viewport_width": 1280,
    "viewport_height": 720
  }'

# Response: {"session_id": "uuid-here"}

# Get UI context
curl http://localhost:8080/<session_id>/get_context

# Execute action
curl -X POST http://localhost:8080/<session_id>/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "click",
    "role": "button",
    "name": "Login"
  }'
```

## 📖 API Documentation

### Create Session

**POST** `/sessions`

```json
{
  "initial_url": "http://localhost:3000",
  "viewport_width": 1280,
  "viewport_height": 720
}
```

**Response**:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Get Context (Solution A: AXTree)

**GET** `/:session_id/get_context`

**Response**:
```json
{
  "url": "http://localhost:3000/login",
  "title": "Login Page",
  "viewport": {
    "width": 1280,
    "height": 720,
    "scroll_x": 0,
    "scroll_y": 0
  },
  "elements": [
    {
      "id": 1,
      "display": "[1] Button('Login')",
      "selector": {
        "role": "button",
        "name": "Login"
      },
      "in_viewport": true
    },
    {
      "id": 2,
      "display": "[2] Textbox('Username')",
      "selector": {
        "role": "textbox",
        "name": "Username"
      },
      "in_viewport": true
    }
  ]
}
```

### Execute Action (Solutions B + C)

**POST** `/:session_id/execute`

**Request - Click**:
```json
{
  "tool": "click",
  "role": "button",
  "name": "Login"
}
```

**Request - Type**:
```json
{
  "tool": "type",
  "role": "textbox",
  "name": "Username",
  "text": "john@example.com"
}
```

**Request - Scroll**:
```json
{
  "tool": "scroll",
  "direction": "down",
  "amount": 300
}
```

**Success Response**:
```json
{
  "success": true
}
```

**Error Response (Smart Feedback)**:
```json
{
  "success": false,
  "error": "element_not_visible",
  "reason": "Element 'Login' (Button) was found but is below viewport.",
  "suggestion": "call scroll_down() or wait_for_element('Login')"
}
```

### Handle Trigger (Step 1.5 Integration)

**POST** `/:session_id/trigger`

```json
{
  "event": "page_changed",
  "path": "/dashboard"
}
```

**Response**:
```json
{
  "acknowledged": true,
  "context_refreshed": true,
  "context": { /* UIContext object */ }
}
```

## 🔧 Development

### Project Structure

```
rust-mcp-server/
├── src/
│   ├── api/              # Axum API layer
│   │   ├── handlers.rs   # Request handlers
│   │   ├── routes.rs     # Route definitions
│   │   └── state.rs      # App state
│   ├── browser/          # Playwright automation
│   │   ├── automation.rs # Browser control
│   │   └── context_extractor.rs  # AXTree extraction
│   ├── models/           # Data models
│   │   ├── action.rs     # Action request/response
│   │   ├── context.rs    # UI context models
│   │   └── session.rs    # Session models
│   ├── session/          # Session management
│   │   └── manager.rs    # In-memory session store
│   └── main.rs           # Entry point
├── Cargo.toml
├── .env.example
└── README.md
```

### Building

```bash
# Debug build
cargo build

# Release build (optimized)
cargo build --release

# Run with logs
RUST_LOG=debug cargo run

# Format code
cargo fmt

# Lint
cargo clippy
```

## 📝 Next Steps

1. **Step 1.5**: Create SolidJS client with trigger component
2. **Step 2**: Integrate LLM for agent decision-making
3. **Step 3**: Implement multi-step feedback loop
4. **Step 4**: Add Redis for persistent session storage

## 🤝 Contributing

This is a technical specification implementation. Key areas for improvement:

- [ ] Better error handling
- [ ] More action types (drag, hover, etc.)
- [ ] Screenshot capture
- [ ] Performance optimization
- [ ] Comprehensive tests

## 📄 License

MIT
