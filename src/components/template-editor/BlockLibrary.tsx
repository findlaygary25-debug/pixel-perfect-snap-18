import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading, Type, Image, MousePointer, Minus, Space, AlertCircle, Code } from "lucide-react";

interface ContentBlock {
  id: string;
  type: string;
  content: string;
  style?: Record<string, any>;
}

interface BlockLibraryProps {
  onAddBlock: (block: ContentBlock) => void;
}

export function BlockLibrary({ onAddBlock }: BlockLibraryProps) {
  const blockTypes = [
    { type: "header", icon: Heading, label: "Header", defaultContent: "New Header" },
    { type: "text", icon: Type, label: "Text", defaultContent: "Enter your text here..." },
    { type: "button", icon: MousePointer, label: "Button", defaultContent: "Click Here", defaultStyle: { url: "" } },
    { type: "image", icon: Image, label: "Image", defaultContent: "https://example.com/image.png" },
    { type: "divider", icon: Minus, label: "Divider", defaultContent: "" },
    { type: "spacer", icon: Space, label: "Spacer", defaultContent: "", defaultStyle: { height: "20px" } },
    { type: "alert", icon: AlertCircle, label: "Alert Box", defaultContent: "Important information" },
    { type: "code", icon: Code, label: "Code Block", defaultContent: "// Code here" },
  ];

  const handleAddBlock = (blockType: any) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}-${Math.random()}`,
      type: blockType.type,
      content: blockType.defaultContent,
      style: blockType.defaultStyle || {},
    };
    onAddBlock(newBlock);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Block Library</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {blockTypes.map((blockType) => {
          const Icon = blockType.icon;
          return (
            <Button
              key={blockType.type}
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleAddBlock(blockType)}
            >
              <Icon className="h-4 w-4 mr-2" />
              {blockType.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
