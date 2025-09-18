import { useState, useEffect, useCallback } from "react";
import { productService } from "../services";
import type { Product } from "../types";

interface UseDashboardReturn {
  recentProducts: Product[];
  isLoading: boolean;
  error: string | null;
  fetchRecentProducts: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await productService.getProducts({
        limit: 6,
        sortBy: "updatedAt",
        sortOrder: "desc",
      });

      console.log(
        "[useDashboard] Received recent products:",
        response.products
      );
      setRecentProducts(response.products || []);
    } catch (err) {
      console.error("[useDashboard] Error fetching recent products:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch recent products"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Auto-fetch recent products when hook is first used
    fetchRecentProducts();
  }, [fetchRecentProducts]);

  return {
    recentProducts,
    isLoading,
    error,
    fetchRecentProducts,
  };
}
