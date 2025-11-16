import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

interface RuleConfig {
  days?: number;
  minLikes?: number;
  minViews?: number;
}

interface CreateSmartCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const RULE_TYPES = [
  {
    value: "followed_users",
    label: "Videos from Followed Users",
    description: "Automatically includes videos from users you follow",
    config: { days: 7 }
  },
  {
    value: "trending",
    label: "Trending Videos",
    description: "Popular videos with high engagement",
    config: { days: 7, minLikes: 10, minViews: 100 }
  },
  {
    value: "recent_likes",
    label: "Recently Liked",
    description: "Videos you've liked recently",
    config: { days: 30 }
  },
  {
    value: "high_engagement",
    label: "High Engagement",
    description: "Videos with lots of likes and views",
    config: { minLikes: 50, minViews: 500 }
  },
  {
    value: "recent_uploads",
    label: "Recent Uploads",
    description: "Latest video uploads across the platform",
    config: { days: 3 }
  }
];

export function CreateSmartCollectionDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateSmartCollectionDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ruleType, setRuleType] = useState<string>("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !ruleType) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const selectedRule = RULE_TYPES.find(r => r.value === ruleType);
      if (!selectedRule) throw new Error("Invalid rule type");

      // Get the current max order_index
      const { data: collections } = await supabase
        .from("collections")
        .select("order_index")
        .eq("user_id", user.id)
        .order("order_index", { ascending: false })
        .limit(1);

      const maxOrder = collections?.[0]?.order_index ?? -1;

      const { error } = await supabase
        .from("collections")
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          is_smart: true,
          rule_type: ruleType,
          rule_config: selectedRule.config,
          order_index: maxOrder + 1,
        });

      if (error) throw error;

      toast.success("Smart collection created!");
      onSuccess();
      onOpenChange(false);
      setName("");
      setDescription("");
      setRuleType("");
    } catch (error) {
      console.error("Error creating smart collection:", error);
      toast.error("Failed to create smart collection");
    } finally {
      setCreating(false);
    }
  };

  const selectedRuleType = RULE_TYPES.find(r => r.value === ruleType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Smart Collection
          </DialogTitle>
          <DialogDescription>
            Smart collections automatically update based on rules
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Collection Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Trending Feed"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="rule">Smart Rule *</Label>
            <Select value={ruleType} onValueChange={setRuleType}>
              <SelectTrigger>
                <SelectValue placeholder="Select a rule" />
              </SelectTrigger>
              <SelectContent>
                {RULE_TYPES.map((rule) => (
                  <SelectItem key={rule.value} value={rule.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{rule.label}</span>
                      <span className="text-xs text-muted-foreground">{rule.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRuleType && (
              <p className="text-xs text-muted-foreground mt-2">
                {selectedRuleType.description}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this collection"
              rows={3}
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setName("");
              setDescription("");
              setRuleType("");
            }}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating || !name.trim() || !ruleType}>
            {creating ? "Creating..." : "Create Smart Collection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
