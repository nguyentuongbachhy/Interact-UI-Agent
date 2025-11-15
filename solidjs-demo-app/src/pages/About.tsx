import { A } from '@solidjs/router';

export default function About() {
  return (
    <div class="page">
      <h1>About MCP UI Automation</h1>
      <A href="/" class="back-link">← Back to Home</A>

      <div class="card">
        <h2>Hybrid Architecture</h2>
        <p>
          This demo showcases a <strong>Hybrid (Black-box + White-box)</strong> architecture
          for LLM agents to interact with Single-Page Applications (SPAs).
        </p>

        <h3>Black-box Execution (Backend)</h3>
        <ul>
          <li>MCP Server (Rust + Axum) controls browser via Chromiumoxide</li>
          <li>Browser automation is completely invisible to the app</li>
          <li>Uses semantic selectors (role + name) for resilience</li>
        </ul>

        <h3>White-box Trigger (Frontend)</h3>
        <ul>
          <li>SolidJS app notifies server when routes change</li>
          <li>Enables server to proactively refresh UI context (AXTree)</li>
          <li>Solves the "SPA challenge" of client-side routing</li>
        </ul>
      </div>

      <div class="card">
        <h2>Key Technologies</h2>
        <ul>
          <li><strong>Backend</strong>: Rust, Axum, Chromiumoxide</li>
          <li><strong>Frontend</strong>: SolidJS, Solid Router, TypeScript</li>
          <li><strong>Browser</strong>: Chrome DevTools Protocol (CDP)</li>
          <li><strong>Context</strong>: Accessibility Tree (AXTree)</li>
          <li><strong>Selectors</strong>: Semantic (role-based)</li>
        </ul>
      </div>

      <div class="card">
        <h2>Solutions Implemented</h2>
        <dl>
          <dt>Solution A: Clean Context</dt>
          <dd>Extract Accessibility Tree instead of raw HTML to reduce noise</dd>

          <dt>Solution B: Semantic Selectors</dt>
          <dd>Use role-based selectors (role=button[name="Login"]) resilient to UI changes</dd>

          <dt>Solution C: Smart Feedback Loop</dt>
          <dd>Return actionable error messages with suggestions for self-correction</dd>
        </dl>
      </div>
    </div>
  );
}
