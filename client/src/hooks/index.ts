export { useAuth, useAuthUser, useAuthStatus, usePermissions } from "./useAuth";

export {
  useWebSocket,
  useWebSocketStatus,
  useWebSocketHealth,
} from "./useWebSocket";

export {
  useMCPListener,
  useProductMCP,
  useUIMCP,
  useMCPDebug,
} from "./useMCPListener";

export {
  useProducts,
  useProductForm,
  useProductStats,
  useProductCategories,
  useProductSearch,
} from "./useProducts";

export { useDashboard } from "./useDashboard";

export {
  useDebounce,
  useLocalStorage,
  useSessionStorage,
  usePrevious,
  useIsMounted,
  useOnlineStatus,
  useWindowSize,
  useMediaQuery,
  useBreakpoint,
  useInterval,
  useTimeout,
  useToggle,
  useAsync,
  useClipboard,
} from "./useUtils";

export { useAppInitialization } from "./useAppInitialization";

export type { UseWebSocketOptions, UseWebSocketReturn } from "./useWebSocket";

export type {
  UseMCPListenerOptions,
  UseMCPListenerReturn,
} from "./useMCPListener";

import { useAuth } from "./useAuth";
import { useProducts, useProductSearch } from "./useProducts";
import { useMCPListener, useProductMCP } from "./useMCPListener";
import { useDebounce, useLocalStorage } from "./useUtils";
import React, { useCallback } from "react";

export function useAuthenticatedProducts() {
  const { isAuthenticated } = useAuth();
  const products = useProducts();

  return {
    ...products,
    isReady: isAuthenticated,
  };
}

export function usePersistedSearch(storageKey = "search-state") {
  const [searchState, setSearchState] = useLocalStorage(storageKey, {
    query: "",
    filters: {},
  });

  const debouncedQuery = useDebounce(searchState.query, 300);
  const { search, ...productSearch } = useProductSearch();

  const updateQuery = useCallback(
    (query: string) => {
      setSearchState((prev) => ({ ...prev, query }));
    },
    [setSearchState]
  );

  const updateFilters = useCallback(
    (filters: any) => {
      setSearchState((prev) => ({ ...prev, filters }));
    },
    [setSearchState]
  );

  React.useEffect(() => {
    if (debouncedQuery || Object.keys(searchState.filters).length > 0) {
      search(debouncedQuery, searchState.filters);
    }
  }, [debouncedQuery, searchState.filters, search]);

  return {
    ...productSearch,
    query: searchState.query,
    filters: searchState.filters,
    updateQuery,
    updateFilters,
  };
}

export function useMCPProducts() {
  const products = useProducts();
  const { addProduct, removeProduct, searchProduct } = useProductMCP();
  const { isConnected } = useMCPListener();

  return {
    ...products,
    mcpEnabled: isConnected,
    mcpAddProduct: addProduct,
    mcpRemoveProduct: removeProduct,
    mcpSearchProduct: searchProduct,
  };
}
