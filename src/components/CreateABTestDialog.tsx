import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CreateABTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTestCreated: () => void;
}

interface Variant {
  name: string;
  title: string;
  body: string;
  ctaText: string;
  ctaLink: string;
  allocation: number;
}

export function CreateABTestDialog({ open, onOpenChange, onTestCreated }: CreateABTestDialogProps) {
  const [loading, setLoading] = useState(false);
  const [testName, setTestName] = useState("");
  const [description, setDescription] = useState("");
  const [notificationType, setNotificationType] = useState("flash_sale");
  const [variants, setVariants] = useState<Variant[]>([
    { name: "A", title: "", body: "", ctaText: "", ctaLink: "", allocation: 50 },
    { name: "B", title: "", body: "", ctaText: "", ctaLink: "", allocation: 50 },
  ]);

  const addVariant = () => {
    const nextLetter = String.fromCharCode(65 + variants.length);
    const equalAllocation = Math.floor(100 / (variants.length + 1));
    
    setVariants([
      ...variants.map(v => ({ ...v, allocation: equalAllocation })),
      { name: nextLetter, title: "", body: "", ctaText: "", ctaLink: "", allocation: equalAllocation }
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 2) {
      toast.error("You must have at least 2 variants");
      return;
    }
    
    const newVariants = variants.filter((_, i) => i !== index);
    const equalAllocation = Math.floor(100 / newVariants.length);
    setVariants(newVariants.map(v => ({ ...v, allocation: equalAllocation })));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleSubmit = async () => {
    if (!testName || !description) {
      toast.error("Please fill in test name and description");
      return;
    }

    const hasEmptyVariants = variants.some(v => !v.title || !v.body);
    if (hasEmptyVariants) {
      toast.error("Please fill in all variant details");
      return;
    }

    const totalAllocation = variants.reduce((sum, v) => sum + v.allocation, 0);
    if (totalAllocation !== 100) {
      toast.error("Traffic allocation must total 100%");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create test
      const { data: test, error: testError } = await supabase
        .from('notification_ab_tests')
        .insert({
          name: testName,
          description,
          notification_type: notificationType,
          status: 'draft',
          created_by: user.id,
        })
        .select()
        .single();

      if (testError) throw testError;

      // Create variants
      const variantInserts = variants.map(v => ({
        test_id: test.id,
        variant_name: v.name,
        message_title: v.title,
        message_body: v.body,
        cta_text: v.ctaText,
        cta_link: v.ctaLink,
        traffic_allocation: v.allocation,
      }));

      const { error: variantsError } = await supabase
        .from('notification_test_variants')
        .insert(variantInserts);

      if (variantsError) throw variantsError;

      toast.success("A/B test created successfully");
      onTestCreated();
      onOpenChange(false);
      
      // Reset form
      setTestName("");
      setDescription("");
      setVariants([
        { name: "A", title: "", body: "", ctaText: "", ctaLink: "", allocation: 50 },
        { name: "B", title: "", body: "", ctaText: "", ctaLink: "", allocation: 50 },
      ]);
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error('Failed to create A/B test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create A/B Test</DialogTitle>
          <DialogDescription>
            Create a new A/B test for notification messages
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Test Name</Label>
            <Input
              id="name"
              placeholder="e.g., Flash Sale CTA Test"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what you're testing..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Notification Type</Label>
            <Select value={notificationType} onValueChange={setNotificationType}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flash_sale">Flash Sale</SelectItem>
                <SelectItem value="challenge">Challenge</SelectItem>
                <SelectItem value="follow">Follow</SelectItem>
                <SelectItem value="comment">Comment</SelectItem>
                <SelectItem value="share">Share</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Variants</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariant}
                disabled={variants.length >= 5}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Variant
              </Button>
            </div>

            {variants.map((variant, index) => (
              <Card key={index}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Variant {variant.name}</h4>
                    {variants.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariant(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Message Title</Label>
                      <Input
                        placeholder="Notification title"
                        value={variant.title}
                        onChange={(e) => updateVariant(index, 'title', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Message Body</Label>
                      <Textarea
                        placeholder="Notification message"
                        value={variant.body}
                        onChange={(e) => updateVariant(index, 'body', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>CTA Text (Optional)</Label>
                        <Input
                          placeholder="e.g., Shop Now"
                          value={variant.ctaText}
                          onChange={(e) => updateVariant(index, 'ctaText', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>CTA Link (Optional)</Label>
                        <Input
                          placeholder="e.g., /rewards-store"
                          value={variant.ctaLink}
                          onChange={(e) => updateVariant(index, 'ctaLink', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Traffic Allocation (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={variant.allocation}
                        onChange={(e) => updateVariant(index, 'allocation', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="text-sm text-muted-foreground">
              Total allocation: {variants.reduce((sum, v) => sum + v.allocation, 0)}%
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating..." : "Create Test"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
