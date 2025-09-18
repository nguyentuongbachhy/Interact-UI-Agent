import { FEATURE_FLAGS } from "./constants";

// Global singleton để handle StrictMode double mounting
class AppInitializationManager {
  private static instance: AppInitializationManager;
  private state = {
    isInitialized: false,
    isInitializing: false,
    initError: null as string | null,
  };
  private initPromise: Promise<void> | null = null;
  private subscribers = new Set<(state: typeof this.state) => void>();

  static getInstance() {
    if (!AppInitializationManager.instance) {
      AppInitializationManager.instance = new AppInitializationManager();
    }
    return AppInitializationManager.instance;
  }

  subscribe(callback: (state: typeof this.state) => void) {
    this.subscribers.add(callback);
    // Immediately call with current state
    callback(this.state);

    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach((callback) => callback(this.state));
  }

  async initialize(_checkAuthStatus: () => boolean) {
    if (this.initPromise || this.state.isInitialized) {
      return this.initPromise || Promise.resolve();
    }

    this.state = {
      ...this.state,
      isInitializing: true,
      initError: null,
    };
    this.notifySubscribers();

    this.initPromise = (async () => {
      try {
        const { initializeServices } = await import("../services");
        await initializeServices();

        if (FEATURE_FLAGS.ENABLE_MCP) {
          console.log("MCP enabled, initializing stores...");
          const { initializeStores } = await import("../store");
          await initializeStores();
        }

        this.state = {
          isInitialized: true,
          isInitializing: false,
          initError: null,
        };
        this.notifySubscribers();
      } catch (error) {
        console.error("App initialization failed:", error);

        this.state = {
          isInitialized: false,
          isInitializing: false,
          initError:
            error instanceof Error ? error.message : "Initialization failed",
        };
        this.initPromise = null;
        this.notifySubscribers();
      }
    })();

    return this.initPromise;
  }

  retry(checkAuthStatus: () => boolean) {
    this.state = {
      isInitialized: false,
      isInitializing: false,
      initError: null,
    };
    this.initPromise = null;
    this.notifySubscribers();

    return this.initialize(checkAuthStatus);
  }

  getState() {
    return this.state;
  }
}

export default AppInitializationManager;
