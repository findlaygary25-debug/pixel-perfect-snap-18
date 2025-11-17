import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Store,
  Coins,
  Package,
  Trophy,
  Sparkles,
  Star,
  Crown,
  Zap,
  Layers,
  Infinity,
  BarChart3,
  Palette,
  Headphones,
  ShoppingBag,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import { PromotionalBannerCard } from "@/components/PromotionalBanner";
import { SaleCountdown } from "@/components/SaleCountdown";
import { TriggerFlashSale } from "@/components/TriggerFlashSale";

type RewardItem = {
  id: string;
  item_type: string;
  item_name: string;
  item_description: string;
  point_cost: number;
  icon_name: string;
  tier: string;
  is_available: boolean;
  stock_limit: number | null;
  stock_remaining: number | null;
  metadata: any;
  is_on_sale: boolean;
  sale_percentage: number;
  original_price: number | null;
  sale_start_date: string | null;
  sale_end_date: string | null;
};

type PromotionalBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  banner_type: string;
  background_gradient: string;
  icon_name: string;
  cta_text: string;
  cta_link: string | null;
  start_date: string;
  end_date: string;
};

type UserInventory = {
  id: string;
  item_type: string;
  item_id: string;
  item_name: string;
  item_data: any;
  acquired_at: string;
};

export default function RewardsStore() {
  const navigate = useNavigate();
  const [rewardItems, setRewardItems] = useState<RewardItem[]>([]);
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [inventory, setInventory] = useState<UserInventory[]>([]);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<RewardItem | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      setLoading(true);

      // Fetch promotional banners
      const { data: bannersData, error: bannersError } = await supabase
        .from('promotional_banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (bannersError) throw bannersError;

      // Fetch reward items
      const { data: itemsData, error: itemsError } = await supabase
        .from('reward_items')
        .select('*')
        .eq('is_available', true)
        .order('is_on_sale', { ascending: false })
        .order('point_cost', { ascending: true });

      if (itemsError) throw itemsError;

      // Fetch user inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (inventoryError) throw inventoryError;

      // Fetch points balance
      const { data: statsData, error: statsError } = await supabase
        .from('user_achievement_stats')
        .select('points_balance')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (statsError) throw statsError;

      setBanners(bannersData || []);
      setRewardItems(itemsData || []);
      setInventory(inventoryData || []);
      setPointsBalance(statsData?.points_balance || 0);
    } catch (error) {
      console.error("Error fetching store data:", error);
      toast.error("Failed to load rewards store");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedItem) return;

    try {
      setPurchasing(true);

      const { data, error } = await supabase.rpc('purchase_reward_item', {
        reward_item_id_param: selectedItem.id,
        points_to_spend: selectedItem.point_cost
      });

      if (error) throw error;

      const result = data as any;

      if (result.success) {
        toast.success(`🎉 Purchased ${result.item_name}!`, {
          description: `Spent ${result.points_spent} points. Remaining: ${result.remaining_balance} points`
        });
        setPurchaseDialogOpen(false);
        setSelectedItem(null);
        await fetchStoreData();
      } else {
        toast.error(result.error || 'Purchase failed');
      }
    } catch (error) {
      console.error("Error purchasing item:", error);
      toast.error("Failed to complete purchase");
    } finally {
      setPurchasing(false);
    }
  };

  const openPurchaseDialog = (item: RewardItem) => {
    setSelectedItem(item);
    setPurchaseDialogOpen(true);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400';
      case 'silver': return 'bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400';
      case 'gold': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400';
      case 'platinum': return 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getItemIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon className="h-12 w-12" /> : <Package className="h-12 w-12" />;
  };

  const isOwned = (itemId: string, itemType: string) => {
    return inventory.some(inv => inv.item_id === itemId && inv.item_type === itemType);
  };

  const canAfford = (cost: number) => {
    return pointsBalance >= cost;
  };

  const groupItemsByType = (items: RewardItem[]) => {
    return {
      on_sale: items.filter(item => item.is_on_sale && item.sale_end_date && new Date(item.sale_end_date) > new Date()),
      profile_slot: items.filter(item => item.item_type === 'profile_slot'),
      badge: items.filter(item => item.item_type === 'badge'),
      premium_feature: items.filter(item => item.item_type === 'premium_feature')
    };
  };

  const groupedItems = groupItemsByType(rewardItems);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Store className="h-8 w-8 text-primary" />
              Rewards Store
            </h1>
            <p className="text-muted-foreground mt-1">
              Redeem your points for exclusive rewards
            </p>
          </div>
        </div>
        <TriggerFlashSale />
      </div>

      {/* Points Balance */}
      <Card className="border-primary bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Coins className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Points Balance</p>
                <p className="text-3xl font-bold">{pointsBalance.toLocaleString()}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/challenge-history')}>
              <Trophy className="h-4 w-4 mr-2" />
              Earn More Points
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Promotional Banners */}
      {banners.length > 0 && (
        <div className="space-y-3">
          {banners.map((banner) => (
            <PromotionalBannerCard
              key={banner.id}
              banner={banner}
              getItemIcon={getItemIcon}
            />
          ))}
        </div>
      )}

      {/* My Inventory */}
      {inventory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              My Inventory
            </CardTitle>
            <CardDescription>Items you've purchased</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {inventory.map((item) => (
                <Card key={item.id} className="border-primary/20">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {getItemIcon(item.item_data.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{item.item_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.acquired_at).toLocaleDateString()}
                        </p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Store Items */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="on_sale" className="relative">
            On Sale
            {groupedItems.on_sale.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {groupedItems.on_sale.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="profile_slot">Slots</TabsTrigger>
          <TabsTrigger value="badge">Badges</TabsTrigger>
          <TabsTrigger value="premium_feature">Premium</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {groupedItems.on_sale.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-red-500" />
                Flash Sale Items
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedItems.on_sale.map((item) => (
                  <RewardItemCard
                    key={item.id}
                    item={item}
                    owned={isOwned(item.id, item.item_type)}
                    canAfford={canAfford(item.point_cost)}
                    onPurchase={() => openPurchaseDialog(item)}
                    getTierColor={getTierColor}
                    getItemIcon={getItemIcon}
                  />
                ))}
              </div>
              <Separator className="my-6" />
            </div>
          )}

          {Object.entries(groupedItems).map(([type, items]) => (
            items.length > 0 && type !== 'on_sale' && (
              <div key={type} className="space-y-3">
                <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
                  {type === 'profile_slot' && <Layers className="h-5 w-5" />}
                  {type === 'badge' && <Trophy className="h-5 w-5" />}
                  {type === 'premium_feature' && <Star className="h-5 w-5" />}
                  {type.replace('_', ' ')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <RewardItemCard
                      key={item.id}
                      item={item}
                      owned={isOwned(item.id, item.item_type)}
                      canAfford={canAfford(item.point_cost)}
                      onPurchase={() => openPurchaseDialog(item)}
                      getTierColor={getTierColor}
                      getItemIcon={getItemIcon}
                    />
                  ))}
                </div>
                <Separator className="my-6" />
              </div>
            )
          ))}
        </TabsContent>

        <TabsContent value="on_sale" className="mt-6">
          {groupedItems.on_sale.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedItems.on_sale.map((item) => (
                <RewardItemCard
                  key={item.id}
                  item={item}
                  owned={isOwned(item.id, item.item_type)}
                  canAfford={canAfford(item.point_cost)}
                  onPurchase={() => openPurchaseDialog(item)}
                  getTierColor={getTierColor}
                  getItemIcon={getItemIcon}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Active Sales</h3>
              <p className="text-muted-foreground">
                Check back later for amazing deals!
              </p>
            </div>
          )}
        </TabsContent>

        {(['profile_slot', 'badge', 'premium_feature'] as const).map((type) => (
          <TabsContent key={type} value={type} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedItems[type].map((item) => (
                <RewardItemCard
                  key={item.id}
                  item={item}
                  owned={isOwned(item.id, item.item_type)}
                  canAfford={canAfford(item.point_cost)}
                  onPurchase={() => openPurchaseDialog(item)}
                  getTierColor={getTierColor}
                  getItemIcon={getItemIcon}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              Are you sure you want to purchase this item?
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-lg bg-primary/10 text-primary">
                  {getItemIcon(selectedItem.icon_name)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedItem.item_name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedItem.item_description}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge className={getTierColor(selectedItem.tier)}>
                      {selectedItem.tier}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Coins className="h-3 w-3" />
                      {selectedItem.point_cost} points
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Balance:</span>
                  <span className="font-medium">{pointsBalance} points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="font-medium text-red-500">-{selectedItem.point_cost} points</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Remaining Balance:</span>
                  <span>{pointsBalance - selectedItem.point_cost} points</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPurchaseDialogOpen(false)}
              disabled={purchasing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={purchasing || !selectedItem || !canAfford(selectedItem.point_cost)}
            >
              {purchasing ? "Processing..." : "Confirm Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Reward Item Card Component
function RewardItemCard({
  item,
  owned,
  canAfford,
  onPurchase,
  getTierColor,
  getItemIcon
}: {
  item: RewardItem;
  owned: boolean;
  canAfford: boolean;
  onPurchase: () => void;
  getTierColor: (tier: string) => string;
  getItemIcon: (iconName: string) => JSX.Element;
}) {
  const isOnSale = item.is_on_sale && item.sale_end_date && new Date(item.sale_end_date) > new Date();
  
  return (
    <Card className={`relative ${owned ? "border-primary bg-primary/5" : ""} ${isOnSale ? "border-red-500 shadow-lg shadow-red-500/20" : ""}`}>
      {isOnSale && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="destructive" className="gap-1 font-bold">
            {item.sale_percentage}% OFF
          </Badge>
        </div>
      )}
      
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-lg ${isOnSale ? 'bg-red-100 text-red-600 dark:bg-red-950/30' : 'bg-muted text-foreground'}`}>
            {getItemIcon(item.icon_name)}
          </div>
          <Badge className={getTierColor(item.tier)}>
            {item.tier}
          </Badge>
        </div>

        <div>
          <h3 className="font-semibold text-lg">{item.item_name}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {item.item_description}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {isOnSale && item.original_price && (
              <Badge variant="outline" className="gap-1 line-through text-muted-foreground">
                <Coins className="h-3 w-3" />
                {item.original_price}
              </Badge>
            )}
            <Badge variant={isOnSale ? "destructive" : "secondary"} className="gap-1">
              <Coins className="h-3 w-3" />
              {item.point_cost}
            </Badge>
            {isOnSale && item.sale_end_date && (
              <SaleCountdown endDate={item.sale_end_date} />
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            {owned ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Owned
              </Badge>
            ) : (
              <Button
                size="sm"
                onClick={onPurchase}
                disabled={!canAfford}
                variant={isOnSale ? "destructive" : "default"}
              >
                {canAfford ? "Purchase" : "Insufficient Points"}
              </Button>
            )}
          </div>
        </div>

        {item.stock_limit && item.stock_remaining !== null && (
          <div className="text-xs text-muted-foreground">
            {item.stock_remaining} left in stock
          </div>
        )}
      </CardContent>
    </Card>
  );
}