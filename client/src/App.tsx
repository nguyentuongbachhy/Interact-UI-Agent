import React, { Suspense, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

// Hooks
import { useAuth, useAppInitialization, useMCPListener } from "./hooks";
import { useAppStore } from "./store";
import { useMCPManager } from "./utils/mcpManager";

// Components
import { Layout } from "./components/layout";
import { AuthPage } from "./components/auth";
import { Button } from "./components/ui";

// Utils
import { ROUTES, FEATURE_FLAGS } from "./utils/constants";

// Lazy load pages for better performance
const DashboardPage = React.lazy(() =>
  import("./pages").then((m) => ({ default: m.DashboardPage }))
);
const ProductsPage = React.lazy(() =>
  import("./pages").then((m) => ({ default: m.ProductsPage }))
);
const ProductDetailPage = React.lazy(() =>
  import("./pages").then((m) => ({ default: m.ProductDetailPage }))
);
const ProductFormPage = React.lazy(() =>
  import("./pages").then((m) => ({ default: m.ProductFormPage }))
);
const SearchPage = React.lazy(() =>
  import("./pages").then((m) => ({ default: m.SearchPage }))
);
const CategoriesPage = React.lazy(() =>
  import("./pages").then((m) => ({ default: m.CategoriesPage }))
);
const AnalyticsPage = React.lazy(() =>
  import("./pages").then((m) => ({ default: m.AnalyticsPage }))
);
const SettingsPage = React.lazy(() =>
  import("./pages").then((m) => ({ default: m.SettingsPage }))
);
const ProfilePage = React.lazy(() =>
  import("./pages").then((m) => ({ default: m.ProfilePage }))
);

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              We're sorry, but something unexpected happened.
            </p>
            <Button onClick={() => window.location.reload()} variant="primary">
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Spinner Component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Auth Route Component (redirect if already authenticated)
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || ROUTES.HOME;
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

// Layout wrapper with navigation handling
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate(); // ✅ Dùng React Router navigate
  const { setCurrentPath } = useAppStore();

  // Update current path in store
  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location.pathname, setCurrentPath]);

  const handleNavigate = (path: string) => {
    navigate(path); // ✅ Dùng React Router navigate thay vì window.location.href
  };

  return (
    <Layout
      user={user ?? undefined}
      onLogout={logout}
      currentPath={location.pathname}
      onNavigate={handleNavigate}
    >
      {children}
    </Layout>
  );
};

// Toast Notification System
const ToastSystem: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
            toast.type === "error"
              ? "border-l-4 border-red-500"
              : toast.type === "success"
              ? "border-l-4 border-green-500"
              : toast.type === "warning"
              ? "border-l-4 border-yellow-500"
              : "border-l-4 border-blue-500"
          }`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {toast.type === "error" && (
                  <div className="text-red-500">❌</div>
                )}
                {toast.type === "success" && (
                  <div className="text-green-500">✅</div>
                )}
                {toast.type === "warning" && (
                  <div className="text-yellow-500">⚠️</div>
                )}
                {toast.type === "info" && (
                  <div className="text-blue-500">ℹ️</div>
                )}
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-gray-900">
                  {toast.message}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500"
                  onClick={() => removeToast(toast.id)}
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Modal System
const ModalSystem: React.FC = () => {
  const { modal, closeModal } = useAppStore();

  if (!modal.isOpen || !modal.component) {
    return null;
  }

  const ModalComponent = modal.component;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity"
          aria-hidden="true"
          onClick={closeModal}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              {modal.title && (
                <h3 className="text-lg font-medium text-gray-900">
                  {modal.title}
                </h3>
              )}
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <ModalComponent {...(modal.props || {})} />
          </div>
        </div>
      </div>
    </div>
  );
};

// MCP Status Display - for debugging
const MCPStatus: React.FC = () => {
  const mcpManager = useMCPManager();
  const { isConnected, isConnecting, error } = mcpManager;

  // Show MCP status in development
  if (import.meta.env.NODE_ENV === "development" && FEATURE_FLAGS.ENABLE_MCP) {
    return (
      <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-2 rounded text-xs">
        MCP: {isConnected ? "✅" : isConnecting ? "🔄" : "❌"}
        {error && <div className="text-red-300">Error: {error}</div>}
      </div>
    );
  }

  return null;
};

// App Initialization Component - Only handles basic app setup
const AppInitializer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isInitialized, initError, retry } = useAppInitialization();

  if (!isInitialized && !initError) {
    return <LoadingSpinner />;
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Initialization Failed
          </h1>
          <p className="text-gray-600 mb-4">{initError}</p>
          <Button onClick={retry} variant="primary">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// MCP Integration Component - handles MCP setup globally
const MCPIntegration: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Setup MCP listener globally - only one instance!
  const mcpListener = useMCPListener({
    autoConnect: isAuthenticated, // Only auto-connect when authenticated
    navigate: navigate, // Pass navigate function explicitly
    onCommandReceived: (command) => {
      console.log("[App] MCP Command received:", command.type, command);
    },
    onCommandExecuted: (command, response) => {
      console.log("[App] MCP Command executed:", command.type, response);
    },
    onError: (error, command) => {
      console.error("[App] MCP Error:", error, command);
    },
  });

  console.log("[App] MCP Integration status:", {
    isConnected: mcpListener.isConnected,
    isConnecting: mcpListener.isConnecting,
    error: mcpListener.error,
  });

  // Connect MCP when user logs in
  useEffect(() => {
    if (
      isAuthenticated &&
      !mcpListener.isConnected &&
      !mcpListener.isConnecting
    ) {
      console.log("[App] User authenticated, connecting MCP...");
      mcpListener.connect().catch((error) => {
        console.error("[App] Failed to connect MCP:", error);
      });
    } else if (!isAuthenticated && mcpListener.isConnected) {
      console.log("[App] User logged out, disconnecting MCP...");
      mcpListener.disconnect();
    }
  }, [isAuthenticated, mcpListener]);

  // Cleanup on unmount and page unload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (isAuthenticated && mcpListener.isConnected) {
        mcpListener.disconnect();
      }
    };

    // Add event listener for page unload
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Cleanup on component unmount
      if (mcpListener.isConnected) {
        mcpListener.disconnect();
      }
    };
  }, [isAuthenticated, mcpListener]);

  return null; // This component only handles MCP setup, no UI
};

// Main App Component
const App: React.FC = () => {
  const { login, register } = useAuth();

  return (
    <ErrorBoundary>
      <Router>
        <AppContent login={login} register={register} />
      </Router>
    </ErrorBoundary>
  );
};

// App Content component - inside Router context
const AppContent: React.FC<{
  login: any;
  register: any;
}> = ({ login, register }) => {
  return (
    <AppInitializer>
      <div className="App">
        {/* MCP Integration - setup once globally */}
        <MCPIntegration />

        <Routes>
          {/* Auth Route */}
          <Route
            path={ROUTES.AUTH}
            element={
              <AuthRoute>
                <AuthPage onLogin={login} onRegister={register} />
              </AuthRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      <Route path={ROUTES.HOME} element={<DashboardPage />} />
                      <Route
                        path={ROUTES.PRODUCTS}
                        element={<ProductsPage />}
                      />
                      <Route
                        path={ROUTES.PRODUCT_NEW}
                        element={<ProductFormPage />}
                      />
                      <Route
                        path="/products/:id"
                        element={<ProductDetailPage />}
                      />
                      <Route
                        path="/products/:id/edit"
                        element={<ProductFormPage />}
                      />
                      <Route path={ROUTES.SEARCH} element={<SearchPage />} />

                      {FEATURE_FLAGS.ENABLE_CATEGORIES && (
                        <Route
                          path={ROUTES.CATEGORIES}
                          element={<CategoriesPage />}
                        />
                      )}

                      {FEATURE_FLAGS.ENABLE_ANALYTICS && (
                        <Route
                          path={ROUTES.ANALYTICS}
                          element={<AnalyticsPage />}
                        />
                      )}

                      <Route
                        path={ROUTES.SETTINGS}
                        element={<SettingsPage />}
                      />
                      <Route path={ROUTES.PROFILE} element={<ProfilePage />} />

                      {/* Catch all route - redirect to home */}
                      <Route
                        path="*"
                        element={<Navigate to={ROUTES.HOME} replace />}
                      />
                    </Routes>
                  </Suspense>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>

        {/* Global Systems */}
        <ToastSystem />
        <ModalSystem />
        <MCPStatus />
      </div>
    </AppInitializer>
  );
};

export default App;
