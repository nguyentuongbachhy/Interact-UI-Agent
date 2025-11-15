import { Router, Route } from '@solidjs/router';
import { RouterTrigger } from './components/RouterTrigger';
import Home from './pages/Home';
import Products from './pages/Products';
import Settings from './pages/Settings';
import About from './pages/About';
import './App.css';

function App() {
  return (
    <Router>
      {/* Step 1.5: Router Trigger - Monitors routing and notifies MCP server */}
      <RouterTrigger />

      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/settings" component={Settings} />
      <Route path="/about" component={About} />
    </Router>
  );
}

export default App;
