import { useState } from "react";
import { Clock, X, Trash2, Search, RotateCcw } from "lucide-react";
import { Button, Card, CardContent } from "../ui";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface SearchHistoryItem {
  id: string;
  query: string;
  filters: any;
  timestamp: Date;
  resultCount: number;
}

interface SearchHistoryProps {
  searchHistory: SearchHistoryItem[];
  onSearchFromHistory: (historyItem: SearchHistoryItem) => void;
  onRemoveFromHistory: (id: string) => void;
  onClearHistory: () => void;
  maxItems?: number;
}

export function SearchHistory({
  searchHistory,
  onSearchFromHistory,
  onRemoveFromHistory,
  onClearHistory,
  maxItems = 10,
}: SearchHistoryProps) {
  const [showAll, setShowAll] = useState(false);

  const displayItems = showAll
    ? searchHistory
    : searchHistory.slice(0, maxItems);

  const handleClearHistory = () => {
    if (
      window.confirm("Clear all search history? This action cannot be undone.")
    ) {
      onClearHistory();
    }
  };

  const handleRemoveItem = (id: string, query: string) => {
    if (window.confirm(`Remove "${query}" from history?`)) {
      onRemoveFromHistory(id);
    }
  };

  const getSearchPreview = (item: SearchHistoryItem) => {
    const parts = [];
    if (item.query) parts.push(`"${item.query}"`);

    const filterCount = Object.keys(item.filters || {}).length;
    if (filterCount > 0) {
      parts.push(`${filterCount} filter${filterCount > 1 ? "s" : ""}`);
    }

    return parts.join(" + ") || "All products";
  };

  if (searchHistory.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-4">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              No Search History
            </h3>
            <p className="text-sm text-gray-500">
              Your recent searches will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-green-600" />
            <h3 className="font-medium text-gray-900">Recent Searches</h3>
            <span className="text-sm text-gray-500">
              ({searchHistory.length})
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearHistory}
            className="text-red-600 hover:text-red-700 flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        </div>

        <div className="space-y-2">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => onSearchFromHistory(item)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {item.query || "All products"}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {getSearchPreview(item)}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(item.timestamp, {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </span>
                      <span className="text-xs text-blue-600">
                        {item.resultCount} result
                        {item.resultCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSearchFromHistory(item)}
                  className="h-8 w-8 p-0"
                  title="Search again"
                >
                  <Search className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveItem(item.id, item.query)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  title="Remove from history"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {searchHistory.length > maxItems && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="flex items-center"
            >
              {showAll ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>Show {searchHistory.length - maxItems} More</>
              )}
            </Button>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Click on any search to run it again, or remove individual items
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
