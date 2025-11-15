import { A } from '@solidjs/router';

export default function Home() {
  return (
    <div class="page">
      <h1>Home Page</h1>
      <p>Welcome to the MCP UI Automation Demo!</p>

      <div class="card">
        <p>This app demonstrates the Hybrid Architecture:</p>
        <ul>
          <li><strong>Black-box Execution</strong>: MCP Server controls the browser via Chromiumoxide</li>
          <li><strong>White-box Trigger</strong>: This app notifies the server when routes change</li>
        </ul>
      </div>

      <nav class="navigation">
        <h3>Navigate to:</h3>
        <A href="/products" class="nav-link">Products Page</A>
        <A href="/settings" class="nav-link">Settings Page</A>
        <A href="/about" class="nav-link">About Page</A>
      </nav>

      <div class="card">
        <button onclick={() => alert('Button clicked!')}>
          Click Me!
        </button>
        <p>This button can be clicked by the MCP agent using semantic selectors.</p>
      </div>
    </div>
  );
}
