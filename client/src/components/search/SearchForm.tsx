import { useState, useRef, useEffect } from "react";
import { Search, X, Clock, Bookmark } from "lucide-react";
import { Button, Input } from "../ui";
import { useDebounce } from "../../hooks";

interface SearchFormProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  onClear: () => void;
  suggestions: string[];
  onGetSuggestions: (input: string) => Promise<string[]>;
  searchHistory: Array<{ id: string; query: string; timestamp: Date }>;
  onSearchFromHistory: (query: string) => void;
  savedSearches: Array<{ id: string; name: string; query: string }>;
  onLoadSavedSearch: (query: string) => void;
  isLoading?: boolean;
}

export function SearchForm({
  query,
  onQueryChange,
  onSearch,
  onClear,
  suggestions,
  onGetSuggestions,
  searchHistory,
  onSearchFromHistory,
  savedSearches,
  onLoadSavedSearch,
  isLoading = false,
}: SearchFormProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      onGetSuggestions(debouncedQuery);
    }
  }, [debouncedQuery, onGetSuggestions]);

  const allSuggestions = [
    ...suggestions.map((s) => ({ type: "suggestion" as const, text: s })),
    ...searchHistory
      .slice(0, 3)
      .map((h) => ({ type: "history" as const, text: h.query })),
    ...savedSearches
      .slice(0, 2)
      .map((s) => ({ type: "saved" as const, text: s.query, name: s.name })),
  ]
    .filter(
      (item) =>
        item.text.toLowerCase().includes(query.toLowerCase()) &&
        item.text !== query
    )
    .slice(0, 8);

  const handleInputChange = (value: string) => {
    onQueryChange(value);
    setShowSuggestions(value.length > 0);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || allSuggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0) {
          selectSuggestion(allSuggestions[focusedIndex]);
        } else {
          handleSearch();
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const selectSuggestion = (item: (typeof allSuggestions)[0]) => {
    onQueryChange(item.text);
    setShowSuggestions(false);
    setFocusedIndex(-1);

    if (item.type === "history") {
      onSearchFromHistory(item.text);
    } else if (item.type === "saved") {
      onLoadSavedSearch(item.text);
    } else {
      onSearch(item.text);
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    onClear();
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "history":
        return <Clock className="w-4 h-4 text-gray-400" />;
      case "saved":
        return <Bookmark className="w-4 h-4 text-blue-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(query.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Search products, categories, descriptions..."
          className="pl-12 pr-20 h-8 text-lg"
          disabled={isLoading}
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {showSuggestions && allSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {allSuggestions.map((item, index) => (
            <button
              key={`${item.type}-${item.text}`}
              onClick={() => selectSuggestion(item)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0 ${
                index === focusedIndex ? "bg-blue-50" : ""
              }`}
            >
              {getSuggestionIcon(item.type)}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {item.text}
                </div>
                {item.type === "saved" && "name" in item && (
                  <div className="text-xs text-blue-600 truncate">
                    Saved: {item.name}
                  </div>
                )}
                {item.type === "history" && (
                  <div className="text-xs text-gray-500">Recent search</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
