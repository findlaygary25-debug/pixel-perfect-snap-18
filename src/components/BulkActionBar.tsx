import { Button } from "@/components/ui/button";
import { FolderPlus, Trash2, FolderInput, X } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onAddToCollection: () => void;
  onMoveToCollection?: () => void;
  onRemove?: () => void;
  showMove?: boolean;
  showRemove?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  onAddToCollection,
  onMoveToCollection,
  onRemove,
  showMove = false,
  showRemove = false,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4 animate-in slide-in-from-bottom">
      <div className="text-sm font-medium">
        {selectedCount} video{selectedCount > 1 ? "s" : ""} selected
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onAddToCollection}
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Add to Collection
        </Button>
        
        {showMove && onMoveToCollection && (
          <Button
            variant="outline"
            size="sm"
            onClick={onMoveToCollection}
          >
            <FolderInput className="h-4 w-4 mr-2" />
            Move to Collection
          </Button>
        )}
        
        {showRemove && onRemove && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
