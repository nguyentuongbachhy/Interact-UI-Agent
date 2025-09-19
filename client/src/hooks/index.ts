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
  useProductDetail,
  useProductForm,
  useProductStats,
  useProductCategories,
  useProductSearch,
} from "./useProducts";

export { useNotifications } from "./useNotifications";

export { useDashboard } from "./useDashboard";

export { useToast, type UseToastReturn } from "./useToast";

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
