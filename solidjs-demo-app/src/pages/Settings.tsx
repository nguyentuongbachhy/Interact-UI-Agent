import { createSignal } from 'solid-js';
import { A } from '@solidjs/router';

export default function Settings() {
  const [username, setUsername] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [notifications, setNotifications] = createSignal(true);
  const [theme, setTheme] = createSignal('light');

  const saveSettings = () => {
    alert(`Settings saved!\nUsername: ${username()}\nEmail: ${email()}\nNotifications: ${notifications()}\nTheme: ${theme()}`);
  };

  return (
    <div class="page">
      <h1>Settings</h1>
      <A href="/" class="back-link">← Back to Home</A>

      <div class="card">
        <h2>User Profile</h2>
        <div class="form">
          <label>
            Username:
            <input
              type="text"
              value={username()}
              onInput={(e) => setUsername(e.currentTarget.value)}
              placeholder="Enter username"
              aria-label="Username"
            />
          </label>

          <label>
            Email:
            <input
              type="email"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              placeholder="Enter email"
              aria-label="Email"
            />
          </label>
        </div>
      </div>

      <div class="card">
        <h2>Preferences</h2>
        <div class="form">
          <label>
            <input
              type="checkbox"
              checked={notifications()}
              onChange={(e) => setNotifications(e.currentTarget.checked)}
              aria-label="Enable Notifications"
            />
            Enable Notifications
          </label>

          <label>
            Theme:
            <select
              value={theme()}
              onChange={(e) => setTheme(e.currentTarget.value)}
              aria-label="Theme"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </label>
        </div>
      </div>

      <div class="card">
        <button onclick={saveSettings} class="save-button">
          Save Settings
        </button>
      </div>
    </div>
  );
}
