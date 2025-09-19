import { useState, useCallback, useEffect, useMemo } from "react";
import { productService } from "../services";
import { useLocalStorage, useDebounce } from "./useUtils";
import { useAppStore } from "../store";
import type { Product, SearchFilters } from "../types";

interface SearchResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SearchHistory {
  id: string;
  query: string;
  filters: SearchFilters;
  timestamp: Date;
  resultCount: number;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  createdAt: Date;
}

interface UseSearchReturn {
  // Search state
  query: string;
  filters: SearchFilters;
  results: SearchResult | null;
  isLoading: boolean;
  error: string | null;

  // Search actions
  setQuery: (query: string) => void;
  setFilters: (filters: SearchFilters) => void;
  executeSearch: (query?: string, filters?: SearchFilters) => Promise<void>;
  clearSearch: () => void;

  // Pagination
  page: number;
  setPage: (page: number) => void;

  // Search history
  searchHistory: SearchHistory[];
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
  searchFromHistory: (historyItem: SearchHistory) => void;

  // Saved searches
  savedSearches: SavedSearch[];
  saveCurrentSearch: (name: string) => void;
  deleteSavedSearch: (id: string) => void;
  loadSavedSearch: (savedSearch: SavedSearch) => void;

  // Suggestions
  suggestions: string[];
  getSuggestions: (input: string) => Promise<string[]>;

  // Categories for filters
  categories: string[];
  loadCategories: () => Promise<void>;

  // Advanced features
  hasActiveFilters: boolean;
  resetFilters: () => void;
  exportResults: () => void;
}

const MAX_HISTORY_ITEMS = 20;
const MAX_SUGGESTIONS = 10;

export function useSearch(): UseSearchReturn {
  const { showToast } = useAppStore();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Local storage for history and saved searches
  const [searchHistory, setSearchHistory] = useLocalStorage<SearchHistory[]>(
    "search-history",
    []
  );
  const [savedSearches, setSavedSearches] = useLocalStorage<SavedSearch[]>(
    "saved-searches",
    []
  );

  // Debounced query for auto-search
  const debouncedQuery = useDebounce(query, 500);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      executeSearch(debouncedQuery, filters);
    }
  }, [debouncedQuery, filters, page]);

  const loadCategories = useCallback(async () => {
    try {
      const categoriesData = await productService.getCategories();
      setCategories(categoriesData.map((cat) => cat.name));
    } catch (err) {
      console.error("Failed to load categories:", err);
      setCategories([]);
    }
  }, []);

  const executeSearch = useCallback(
    async (searchQuery?: string, searchFilters?: SearchFilters) => {
      const finalQuery = searchQuery || query;
      const finalFilters = searchFilters || filters;

      if (!finalQuery.trim() && !Object.keys(finalFilters).length) {
        setResults(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await productService.getProducts({
          query: finalQuery,
          filters: finalFilters,
          page,
          limit: 12,
          sortBy: "createdAt",
          sortOrder: "desc",
        });

        const searchResult: SearchResult = {
          products: response.products,
          total: response.total,
          page: response.page,
          limit: response.limit,
          totalPages: response.totalPages,
        };

        setResults(searchResult);

        // Add to search history
        if (finalQuery.trim()) {
          addToHistory(finalQuery, finalFilters, response.total);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Search failed";
        setError(errorMessage);
        showToast(errorMessage, "error");
      } finally {
        setIsLoading(false);
      }
    },
    [query, filters, page, showToast]
  );

  const addToHistory = useCallback(
    (
      searchQuery: string,
      searchFilters: SearchFilters,
      resultCount: number
    ) => {
      const historyItem: SearchHistory = {
        id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        query: searchQuery,
        filters: searchFilters,
        timestamp: new Date(),
        resultCount,
      };

      setSearchHistory((prev) => {
        // Remove existing item with same query and filters
        const filtered = prev.filter(
          (item) =>
            !(
              item.query === searchQuery &&
              JSON.stringify(item.filters) === JSON.stringify(searchFilters)
            )
        );

        // Add new item at beginning, keep only MAX_HISTORY_ITEMS
        return [historyItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      });
    },
    [setSearchHistory]
  );

  const clearSearch = useCallback(() => {
    setQuery("");
    setFilters({});
    setResults(null);
    setError(null);
    setPage(1);
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, [setSearchHistory]);

  const removeFromHistory = useCallback(
    (id: string) => {
      setSearchHistory((prev) => prev.filter((item) => item.id !== id));
    },
    [setSearchHistory]
  );

  const searchFromHistory = useCallback(
    (historyItem: SearchHistory) => {
      setQuery(historyItem.query);
      setFilters(historyItem.filters);
      setPage(1);
      executeSearch(historyItem.query, historyItem.filters);
    },
    [executeSearch]
  );

  const saveCurrentSearch = useCallback(
    (name: string) => {
      if (!query.trim() && !Object.keys(filters).length) {
        showToast("Nothing to save", "warning");
        return;
      }

      const savedSearch: SavedSearch = {
        id: `saved-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        query,
        filters,
        createdAt: new Date(),
      };

      setSavedSearches((prev) => [savedSearch, ...prev]);
      showToast(`Search saved as "${name}"`, "success");
    },
    [query, filters, setSavedSearches, showToast]
  );

  const deleteSavedSearch = useCallback(
    (id: string) => {
      setSavedSearches((prev) => prev.filter((search) => search.id !== id));
      showToast("Saved search deleted", "success");
    },
    [setSavedSearches, showToast]
  );

  const loadSavedSearch = useCallback(
    (savedSearch: SavedSearch) => {
      setQuery(savedSearch.query);
      setFilters(savedSearch.filters);
      setPage(1);
      executeSearch(savedSearch.query, savedSearch.filters);
    },
    [executeSearch]
  );

  const getSuggestions = useCallback(
    async (input: string): Promise<string[]> => {
      if (input.length < 2) {
        setSuggestions([]);
        return [];
      }

      try {
        // Get suggestions from search history
        const historySuggestions = searchHistory
          .filter((item) =>
            item.query.toLowerCase().includes(input.toLowerCase())
          )
          .map((item) => item.query)
          .slice(0, 5);

        // Get suggestions from product names (simplified - in real app, you'd have a dedicated endpoint)
        const searchResponse = await productService.getProducts({
          query: input,
          limit: 5,
        });
        const productSuggestions = searchResponse.products
          .map((product) => product.name)
          .filter((name) => name.toLowerCase().includes(input.toLowerCase()))
          .slice(0, 5);

        const allSuggestions = [
          ...new Set([...historySuggestions, ...productSuggestions]),
        ].slice(0, MAX_SUGGESTIONS);

        setSuggestions(allSuggestions);
        return allSuggestions;
      } catch (err) {
        console.error("Failed to get suggestions:", err);
        setSuggestions([]);
        return [];
      }
    },
    [searchHistory]
  );

  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some((key) => {
      const value = filters[key as keyof SearchFilters];
      return value !== undefined && value !== null && value !== "";
    });
  }, [filters]);

  const resetFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const exportResults = useCallback(() => {
    if (!results || !results.products.length) {
      showToast("No results to export", "warning");
      return;
    }

    try {
      const csvContent = [
        ["Name", "Category", "Price", "Quantity", "Description"].join(","),
        ...results.products.map((product) =>
          [
            `"${product.name}"`,
            `"${product.category || ""}"`,
            product.price,
            product.quantity,
            `"${product.description || ""}"`,
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `search-results-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast("Results exported successfully", "success");
    } catch (err) {
      showToast("Failed to export results", "error");
    }
  }, [results, showToast]);

  return {
    // Search state
    query,
    filters,
    results,
    isLoading,
    error,

    // Search actions
    setQuery,
    setFilters,
    executeSearch,
    clearSearch,

    // Pagination
    page,
    setPage,

    // Search history
    searchHistory,
    clearHistory,
    removeFromHistory,
    searchFromHistory,

    // Saved searches
    savedSearches,
    saveCurrentSearch,
    deleteSavedSearch,
    loadSavedSearch,

    // Suggestions
    suggestions,
    getSuggestions,

    // Categories
    categories,
    loadCategories,

    // Advanced features
    hasActiveFilters,
    resetFilters,
    exportResults,
  };
}
