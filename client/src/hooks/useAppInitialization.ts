import { useState, useCallback, useEffect } from "react";
import { useAuth } from "./useAuth";
import AppInitializationManager from "../utils/appInitialization";

export function useAppInitialization() {
  const manager = AppInitializationManager.getInstance();
  const [state, setState] = useState(manager.getState());
  const { checkAuthStatus } = useAuth();

  // Subscribe to manager state changes
  useEffect(() => {
    const unsubscribe = manager.subscribe(setState);
    return unsubscribe;
  }, [manager]);

  // Auto-start initialization
  useEffect(() => {
    const currentState = manager.getState();
    if (
      !currentState.isInitialized &&
      !currentState.isInitializing &&
      !currentState.initError
    ) {
      manager.initialize(checkAuthStatus).catch(console.error);
    }
  }, [manager, checkAuthStatus]);

  const retry = useCallback(() => {
    return manager.retry(checkAuthStatus);
  }, [manager, checkAuthStatus]);

  return {
    isInitialized: state.isInitialized,
    initError: state.initError,
    retry,
  };
}
