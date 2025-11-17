import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, ArrowLeft, Eye } from "lucide-react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { DragDropCanvas } from "@/components/template-editor/DragDropCanvas";
import { BlockLibrary } from "@/components/template-editor/BlockLibrary";
import { TemplatePreview } from "@/components/template-editor/TemplatePreview";
import { LanguageManager } from "@/components/template-editor/LanguageManager";
import { SYSTEM_VARIABLES, USER_VARIABLES, SALE_VARIABLES, ORDER_VARIABLES, type TemplateVariable } from "@/lib/templateVariables";

interface ContentBlock {
  id: string;
  type: string;
  content: string;
  style?: Record<string, any>;
}

interface TemplateContent {
  language_code: string;
  channel: string;
  subject?: string;
  content_blocks: ContentBlock[];
  plain_text?: string;
  preview_data: Record<string, any>;
}

export default function NotificationTemplateEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  
  const [name, setName] = useState("");
  const [category, setCategory] = useState("marketing");
  const [description, setDescription] = useState("");
  const [defaultLanguage, setDefaultLanguage] = useState("en");
  const [availableChannels, setAvailableChannels] = useState<string[]>(["email", "sms", "in_app"]);
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [selectedChannel, setSelectedChannel] = useState("email");
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [subject, setSubject] = useState("");
  const [plainText, setPlainText] = useState("");
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
      return;
    }

    if (id && id !== "new") {
      fetchTemplate();
    } else {
      // Initialize with default variables for new template
      setVariables([...USER_VARIABLES, ...SYSTEM_VARIABLES]);
      setPreviewData({
        user_name: "John Doe",
        user_email: "john@example.com",
        app_name: "Voice2Fire",
        current_date: new Date().toLocaleDateString(),
      });
    }
  }, [id, isAdmin, adminLoading, navigate]);

  const fetchTemplate = async () => {
    try {
      const { data: template, error } = await supabase
        .from("notification_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setName(template.name);
      setCategory(template.category);
      setDescription(template.description || "");
      setDefaultLanguage(template.default_language || "en");
      setAvailableChannels(template.available_channels || []);
      setVariables((template.variables as any) || []);

      // Fetch content for default language and channel
      const { data: content, error: contentError } = await supabase
        .from("notification_template_content")
        .select("*")
        .eq("template_id", id)
        .eq("language_code", template.default_language)
        .eq("channel", "email")
        .single();

      if (!contentError && content) {
        setContentBlocks((content.content_blocks as any) || []);
        setSubject(content.subject || "");
        setPreviewData((content.preview_data as any) || {});
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!name) {
      toast({
        title: "Validation Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let templateId = id;

      if (!id || id === "new") {
        // Create new template
        const { data: newTemplate, error } = await supabase
          .from("notification_templates")
          .insert({
            name,
            category,
            description,
            default_language: defaultLanguage,
            available_channels: availableChannels,
            variables: variables as any,
          })
          .select()
          .single();

        if (error) throw error;
        templateId = newTemplate.id;
      } else {
        // Update existing template
        const { error } = await supabase
          .from("notification_templates")
          .update({
            name,
            category,
            description,
            default_language: defaultLanguage,
            available_channels: availableChannels,
            variables: variables as any,
          })
          .eq("id", id);

        if (error) throw error;
      }

      // Save content
      const { error: contentError } = await supabase
        .from("notification_template_content")
        .upsert({
          template_id: templateId,
          language_code: selectedLanguage,
          channel: selectedChannel,
          subject,
          content_blocks: contentBlocks as any,
          plain_text: plainText,
          preview_data: previewData as any,
        });

      if (contentError) throw contentError;

      toast({
        title: "Success",
        description: "Template saved successfully",
      });

      if (!id || id === "new") {
        navigate(`/admin/templates/edit/${templateId}`);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addVariableCategory = (categoryName: string) => {
    let newVars: TemplateVariable[] = [];
    switch (categoryName) {
      case "sale":
        newVars = SALE_VARIABLES;
        break;
      case "order":
        newVars = ORDER_VARIABLES;
        break;
      default:
        return;
    }

    const existingKeys = new Set(variables.map(v => v.key));
    const varsToAdd = newVars.filter(v => !existingKeys.has(v.key));
    setVariables([...variables, ...varsToAdd]);
  };

  if (adminLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/templates")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{id && id !== "new" ? "Edit" : "Create"} Template</h1>
            <p className="text-muted-foreground">Design multi-channel notification templates</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? "Hide" : "Show"} Preview
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Template Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name*</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., flash_sale_alert"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="user_action">User Action</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this template is used for..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Available Variables</Label>
              <div className="flex flex-wrap gap-2">
                {variables.map((variable) => (
                  <Badge key={variable.key} variant="secondary">
                    {`{{${variable.key}}}`}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => addVariableCategory("sale")}>
                  Add Sale Variables
                </Button>
                <Button size="sm" variant="outline" onClick={() => addVariableCategory("order")}>
                  Add Order Variables
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <LanguageManager
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
          />
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Content Editor</CardTitle>
            <Tabs value={selectedChannel} onValueChange={setSelectedChannel}>
              <TabsList>
                {availableChannels.includes("email") && <TabsTrigger value="email">Email</TabsTrigger>}
                {availableChannels.includes("sms") && <TabsTrigger value="sms">SMS</TabsTrigger>}
                {availableChannels.includes("in_app") && <TabsTrigger value="in_app">In-App</TabsTrigger>}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {selectedChannel === "email" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Use {{variables}} in your subject line"
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <BlockLibrary onAddBlock={(block) => setContentBlocks([...contentBlocks, block])} />
                </div>
                <div className="col-span-3">
                  <DragDropCanvas
                    blocks={contentBlocks}
                    onBlocksChange={setContentBlocks}
                    variables={variables}
                  />
                </div>
              </div>
            </div>
          )}

          {selectedChannel === "sms" && (
            <div className="space-y-2">
              <Label htmlFor="sms-content">SMS Message (160 characters max)</Label>
              <Textarea
                id="sms-content"
                value={plainText}
                onChange={(e) => setPlainText(e.target.value)}
                placeholder="Hi {{user_name}}, {{discount_percentage}}% off ends soon! {{action_url}}"
                maxLength={160}
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                {plainText.length}/160 characters
              </p>
            </div>
          )}

          {selectedChannel === "in_app" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <BlockLibrary onAddBlock={(block) => setContentBlocks([...contentBlocks, block])} />
                </div>
                <div className="col-span-3">
                  <DragDropCanvas
                    blocks={contentBlocks}
                    onBlocksChange={setContentBlocks}
                    variables={variables}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showPreview && (
        <TemplatePreview
          channel={selectedChannel}
          contentBlocks={contentBlocks}
          subject={subject}
          plainText={plainText}
          previewData={previewData}
          onPreviewDataChange={setPreviewData}
          variables={variables}
        />
      )}
    </div>
  );
}
