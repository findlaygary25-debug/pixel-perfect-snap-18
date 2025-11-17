import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type TemplateVariable } from "@/lib/templateVariables";

interface ContentBlock {
  id: string;
  type: string;
  content: string;
  style?: Record<string, any>;
}

interface DragDropCanvasProps {
  blocks: ContentBlock[];
  onBlocksChange: (blocks: ContentBlock[]) => void;
  variables: TemplateVariable[];
}

function SortableBlock({ block, onUpdate, onDelete, variables }: {
  block: ContentBlock;
  onUpdate: (block: ContentBlock) => void;
  onDelete: () => void;
  variables: TemplateVariable[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const insertVariable = (variableKey: string) => {
    onUpdate({ ...block, content: `${block.content}{{${variableKey}}}` });
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg p-4 bg-card space-y-3">
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 font-medium capitalize">{block.type}</div>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {block.type === "header" && (
        <div className="space-y-2">
          <Input
            value={block.content}
            onChange={(e) => onUpdate({ ...block, content: e.target.value })}
            placeholder="Enter header text..."
          />
          <Select
            value={block.style?.fontSize || "24px"}
            onValueChange={(value) => onUpdate({ ...block, style: { ...block.style, fontSize: value } })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="32px">Large (H1)</SelectItem>
              <SelectItem value="28px">Medium (H2)</SelectItem>
              <SelectItem value="24px">Small (H3)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {block.type === "text" && (
        <Textarea
          value={block.content}
          onChange={(e) => onUpdate({ ...block, content: e.target.value })}
          placeholder="Enter text content..."
          rows={3}
        />
      )}

      {block.type === "button" && (
        <div className="space-y-2">
          <Input
            value={block.content}
            onChange={(e) => onUpdate({ ...block, content: e.target.value })}
            placeholder="Button text"
          />
          <Input
            value={block.style?.url || ""}
            onChange={(e) => onUpdate({ ...block, style: { ...block.style, url: e.target.value } })}
            placeholder="Button URL (e.g., {{action_url}})"
          />
        </div>
      )}

      {block.type === "image" && (
        <Input
          value={block.content}
          onChange={(e) => onUpdate({ ...block, content: e.target.value })}
          placeholder="Image URL or {{variable}}"
        />
      )}

      <div className="flex flex-wrap gap-1">
        {variables.slice(0, 5).map((variable) => (
          <Button
            key={variable.key}
            size="sm"
            variant="outline"
            onClick={() => insertVariable(variable.key)}
            className="text-xs"
          >
            {`{{${variable.key}}}`}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function DragDropCanvas({ blocks, onBlocksChange, variables }: DragDropCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      onBlocksChange(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  const handleUpdateBlock = (id: string, updatedBlock: ContentBlock) => {
    onBlocksChange(blocks.map((b) => (b.id === id ? updatedBlock : b)));
  };

  const handleDeleteBlock = (id: string) => {
    onBlocksChange(blocks.filter((b) => b.id !== id));
  };

  if (blocks.length === 0) {
    return (
      <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
        <p>Drag blocks from the library to start building your template</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {blocks.map((block) => (
            <SortableBlock
              key={block.id}
              block={block}
              onUpdate={(updated) => handleUpdateBlock(block.id, updated)}
              onDelete={() => handleDeleteBlock(block.id)}
              variables={variables}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
