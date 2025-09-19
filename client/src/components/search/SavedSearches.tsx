import { useState } from "react";
import { Bookmark, Plus, Trash2, Search, Edit2, X } from "lucide-react";
import { Button, Input, Card, CardContent } from "../ui";
import { formatDate } from "../../utils";

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: any;
  createdAt: Date;
}

interface SavedSearchesProps {
  savedSearches: SavedSearch[];
  onSave: (name: string) => void;
  onLoad: (savedSearch: SavedSearch) => void;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, name: string) => void;
  currentQuery: string;
  hasActiveFilters: boolean;
  canSave: boolean;
}

export function SavedSearches({
  savedSearches,
  onSave,
  onLoad,
  onDelete,
  onUpdate,
  currentQuery,
  canSave,
}: SavedSearchesProps) {
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleSave = () => {
    if (saveName.trim()) {
      onSave(saveName.trim());
      setSaveName("");
      setShowSaveForm(false);
    }
  };

  const handleUpdate = (id: string) => {
    if (editName.trim() && onUpdate) {
      onUpdate(id, editName.trim());
      setEditingId(null);
      setEditName("");
    }
  };

  const startEdit = (search: SavedSearch) => {
    setEditingId(search.id);
    setEditName(search.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete saved search "${name}"?`)) {
      onDelete(id);
    }
  };

  const getSearchPreview = (search: SavedSearch) => {
    const parts = [];
    if (search.query) parts.push(`"${search.query}"`);

    const filterCount = Object.keys(search.filters || {}).length;
    if (filterCount > 0) {
      parts.push(`${filterCount} filter${filterCount > 1 ? "s" : ""}`);
    }

    return parts.join(" + ") || "All products";
  };

  if (savedSearches.length === 0 && !canSave) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-4">
            <Bookmark className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              No Saved Searches
            </h3>
            <p className="text-sm text-gray-500">
              Save your frequently used searches for quick access
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
            <Bookmark className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">Saved Searches</h3>
            <span className="text-sm text-gray-500">
              ({savedSearches.length})
            </span>
          </div>

          {canSave && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSaveForm(true)}
              className="flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Save Current
            </Button>
          )}
        </div>

        {showSaveForm && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Enter search name..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") setShowSaveForm(false);
                }}
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!saveName.trim()}
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSaveForm(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-blue-700">
              Saving:{" "}
              {getSearchPreview({
                query: currentQuery,
                filters: {},
              } as SavedSearch)}
            </div>
          </div>
        )}

        {savedSearches.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">No saved searches yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => onLoad(search)}
                >
                  {editingId === search.id ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 h-8"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdate(search.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleUpdate(search.id)}>
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEdit}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="font-medium text-gray-900 truncate">
                        {search.name}
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {getSearchPreview(search)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(search.createdAt, "short")}
                      </div>
                    </>
                  )}
                </div>

                {editingId !== search.id && (
                  <div className="flex items-center space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLoad(search)}
                      className="h-8 w-8 p-0"
                      title="Load search"
                    >
                      <Search className="w-4 h-4" />
                    </Button>

                    {onUpdate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(search)}
                        className="h-8 w-8 p-0"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(search.id, search.name)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {savedSearches.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Click on a saved search to load it, or use the action buttons
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
