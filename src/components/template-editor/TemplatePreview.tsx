import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseTemplate, type TemplateVariable } from "@/lib/templateVariables";
import { Monitor, Smartphone } from "lucide-react";

interface ContentBlock {
  id: string;
  type: string;
  content: string;
  style?: Record<string, any>;
}

interface TemplatePreviewProps {
  channel: string;
  contentBlocks: ContentBlock[];
  subject?: string;
  plainText?: string;
  previewData: Record<string, any>;
  onPreviewDataChange: (data: Record<string, any>) => void;
  variables: TemplateVariable[];
}

export function TemplatePreview({
  channel,
  contentBlocks,
  subject,
  plainText,
  previewData,
  onPreviewDataChange,
  variables,
}: TemplatePreviewProps) {
  const renderBlock = (block: ContentBlock) => {
    const content = parseTemplate(block.content, previewData);

    switch (block.type) {
      case "header":
        return (
          <h2
            key={block.id}
            style={{ fontSize: block.style?.fontSize || "24px", fontWeight: "bold", margin: "16px 0" }}
          >
            {content}
          </h2>
        );
      case "text":
        return (
          <p key={block.id} style={{ margin: "12px 0", lineHeight: "1.6" }}>
            {content}
          </p>
        );
      case "button":
        const url = parseTemplate(block.style?.url || "", previewData);
        return (
          <div key={block.id} style={{ margin: "20px 0" }}>
            <a
              href={url}
              style={{
                display: "inline-block",
                padding: "12px 24px",
                backgroundColor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                textDecoration: "none",
                borderRadius: "6px",
                fontWeight: "500",
              }}
            >
              {content}
            </a>
          </div>
        );
      case "image":
        return (
          <div key={block.id} style={{ margin: "16px 0" }}>
            <img src={content} alt="Template image" style={{ maxWidth: "100%", borderRadius: "4px" }} />
          </div>
        );
      case "divider":
        return (
          <hr
            key={block.id}
            style={{ margin: "20px 0", border: "none", borderTop: "1px solid hsl(var(--border))" }}
          />
        );
      case "spacer":
        return <div key={block.id} style={{ height: block.style?.height || "20px" }} />;
      case "alert":
        return (
          <div
            key={block.id}
            style={{
              padding: "12px 16px",
              backgroundColor: "hsl(var(--muted))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
              margin: "16px 0",
            }}
          >
            {content}
          </div>
        );
      case "code":
        return (
          <pre
            key={block.id}
            style={{
              padding: "12px",
              backgroundColor: "hsl(var(--muted))",
              borderRadius: "6px",
              overflow: "auto",
              margin: "16px 0",
            }}
          >
            <code>{content}</code>
          </pre>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Preview Data (Edit to see changes)</Label>
          <div className="grid grid-cols-2 gap-3">
            {variables.map((variable) => (
              <div key={variable.key} className="space-y-1">
                <Label htmlFor={`preview-${variable.key}`} className="text-xs">
                  {variable.key}
                </Label>
                <Input
                  id={`preview-${variable.key}`}
                  value={previewData[variable.key] || ""}
                  onChange={(e) =>
                    onPreviewDataChange({ ...previewData, [variable.key]: e.target.value })
                  }
                  placeholder={variable.default || variable.description}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <Tabs defaultValue="desktop">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="desktop">
                <Monitor className="h-4 w-4 mr-2" />
                Desktop
              </TabsTrigger>
              <TabsTrigger value="mobile">
                <Smartphone className="h-4 w-4 mr-2" />
                Mobile
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="desktop" className="border rounded-lg p-6 bg-background">
            {channel === "email" && subject && (
              <div className="mb-4 pb-4 border-b">
                <div className="text-sm text-muted-foreground mb-1">Subject:</div>
                <div className="font-semibold">{parseTemplate(subject, previewData)}</div>
              </div>
            )}

            {channel === "sms" ? (
              <div className="max-w-sm mx-auto">
                <div className="bg-primary text-primary-foreground rounded-2xl p-4 inline-block max-w-full break-words">
                  {parseTemplate(plainText || "", previewData)}
                </div>
              </div>
            ) : (
              <div className="prose max-w-none">
                {contentBlocks.map((block) => renderBlock(block))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mobile" className="border rounded-lg p-4 bg-background max-w-sm mx-auto">
            {channel === "email" && subject && (
              <div className="mb-4 pb-4 border-b">
                <div className="text-xs text-muted-foreground mb-1">Subject:</div>
                <div className="font-semibold text-sm">{parseTemplate(subject, previewData)}</div>
              </div>
            )}

            {channel === "sms" ? (
              <div className="bg-primary text-primary-foreground rounded-2xl p-3 inline-block max-w-full break-words text-sm">
                {parseTemplate(plainText || "", previewData)}
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                {contentBlocks.map((block) => renderBlock(block))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
