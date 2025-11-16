# SolidJS Demo App - MCP UI Automation

> **Step 1.5**: Client-side trigger implementation for the Hybrid Architecture

## 🎯 Overview

This SolidJS application demonstrates the **White-box Trigger** component of the Hybrid Architecture for UI automation. It works with the Rust MCP Server to enable LLM agents to interact with Single-Page Applications.

## ✨ Key Features

### **Step 1.5: Router Trigger**
- **Component**: `src/components/RouterTrigger.tsx`
- **Purpose**: Monitors client-side routing using `useLocation()`
- **Action**: Sends trigger event to MCP server when path changes

### **Demo Pages**
1. **Home** (`/`) - Introduction and navigation
2. **Products** (`/products`) - Product list with add/remove  
3. **Settings** (`/settings`) - Form inputs and checkboxes
4. **About** (`/about`) - Architecture documentation

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Copy environment file  
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`
