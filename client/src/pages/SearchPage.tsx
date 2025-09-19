import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Filter, Save, History } from "lucide-react";
import { Button, Card, CardContent } from "../components/ui";
import {
  SearchForm,
  SearchResults,
  AdvancedFilters,
  SavedSearches,
  SearchHistory,
} from "../components/search";
import { useSearch, useProductCategories } from "../hooks";
import { ROUTES } from "../utils";

const SearchPage: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState<"saved" | "history">("saved");

  const {
    query,
    filters,
    results,
    isLoading,
    error,
    setQuery,
    setFilters,
    executeSearch,
    clearSearch,
    setPage,
    searchHistory,
    clearHistory,
    removeFromHistory,
    searchFromHistory,
    savedSearches,
    saveCurrentSearch,
    deleteSavedSearch,
    loadSavedSearch,
    suggestions,
    getSuggestions,
    hasActiveFilters,
    resetFilters,
    exportResults,
  } = useSearch();

  const { categories } = useProductCategories();

  useEffect(() => {
    document.title = query
      ? `Search: ${query} - Product Management`
      : "Search - Product Management";
  }, [query]);

  const handleProductSelect = (product: any) => {
    console.log("Product selected:", product);
  };

  const handleProductEdit = (product: any) => {
    console.log("Edit product:", product);
  };

  const handleProductDelete = (productId: string) => {
    console.log("Delete product:", productId);
  };

  const canSaveSearch = !!query.trim() || hasActiveFilters;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link
              to={ROUTES.HOME}
              className="hover:text-gray-700 transition-colors"
            >
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Search</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <Link to={ROUTES.HOME}>
                <Button variant="ghost" size="sm" className="flex items-center">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>

              <div>
                <div className="flex items-center space-x-3">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      Product Search
                    </h1>
                    <p className="text-gray-600">
                      Find products across your inventory
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <Button
                variant={showFilters ? "primary" : "secondary"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? "Hide" : "Show"} Filters
              </Button>

              <Button
                variant={showSidebar ? "primary" : "secondary"}
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="flex items-center lg:hidden"
              >
                <Save className="w-4 h-4 mr-2" />
                Saved & History
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          {showSidebar && (
            <div className="lg:col-span-1 space-y-6">
              {/* Tab Navigation */}
              <Card>
                <CardContent>
                  <div className="flex rounded-lg bg-gray-100 p-1">
                    <button
                      onClick={() => setActiveTab("saved")}
                      className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        activeTab === "saved"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Saved
                    </button>
                    <button
                      onClick={() => setActiveTab("history")}
                      className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        activeTab === "history"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <History className="w-4 h-4 mr-2" />
                      History
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Saved Searches */}
              {activeTab === "saved" && (
                <SavedSearches
                  savedSearches={savedSearches}
                  onSave={saveCurrentSearch}
                  onLoad={loadSavedSearch}
                  onDelete={deleteSavedSearch}
                  currentQuery={query}
                  hasActiveFilters={hasActiveFilters}
                  canSave={canSaveSearch}
                />
              )}

              {/* Search History */}
              {activeTab === "history" && (
                <SearchHistory
                  searchHistory={searchHistory}
                  onSearchFromHistory={searchFromHistory}
                  onRemoveFromHistory={removeFromHistory}
                  onClearHistory={clearHistory}
                />
              )}
            </div>
          )}

          {/* Main Content */}
          <div
            className={`${
              showSidebar ? "lg:col-span-2" : "lg:col-span-4"
            } space-y-6`}
          >
            {/* Search Form */}
            <Card>
              <CardContent>
                <SearchForm
                  query={query}
                  onQueryChange={setQuery}
                  onSearch={executeSearch}
                  onClear={clearSearch}
                  suggestions={suggestions}
                  onGetSuggestions={getSuggestions}
                  searchHistory={searchHistory}
                  onSearchFromHistory={(historyQuery) => {
                    setQuery(historyQuery);
                    executeSearch(historyQuery);
                  }}
                  savedSearches={savedSearches}
                  onLoadSavedSearch={(savedQuery) => {
                    setQuery(savedQuery);
                    executeSearch(savedQuery);
                  }}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            {/* Advanced Filters */}
            {showFilters && (
              <AdvancedFilters
                filters={filters}
                onFiltersChange={setFilters}
                onReset={resetFilters}
                categories={categories.filter(
                  (category): category is string => category !== undefined
                )}
                isExpanded={true}
                showToggle={false}
              />
            )}

            {/* Error State */}
            {error && (
              <Card>
                <CardContent className="p-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Search Error
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{error}</p>
                        </div>
                        <div className="mt-4">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => executeSearch()}
                          >
                            Try Again
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Results */}
            <SearchResults
              results={results}
              query={query}
              isLoading={isLoading}
              onProductSelect={handleProductSelect}
              onProductEdit={handleProductEdit}
              onProductDelete={handleProductDelete}
              onExport={exportResults}
              onPageChange={setPage}
              showActions={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
