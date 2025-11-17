import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";
import { Sparkles } from "lucide-react";

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

type PromotionalBannerCardProps = {
  banner: PromotionalBanner;
  getItemIcon: (iconName: string) => JSX.Element;
};

export function PromotionalBannerCard({ banner, getItemIcon }: PromotionalBannerCardProps) {
  const BannerIcon = (LucideIcons as any)[banner.icon_name] || Sparkles;
  const isFlashSale = banner.banner_type === 'flash_sale';
  
  const timeRemaining = () => {
    const now = new Date();
    const end = new Date(banner.end_date);
    const diff = end.getTime() - now.getTime();
    
    if (diff < 0) return "Expired";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  return (
    <Card className={`relative overflow-hidden border-2 hover:shadow-lg transition-all ${isFlashSale ? 'animate-pulse border-destructive shadow-xl shadow-destructive/20' : ''}`}>
      <div className={`absolute inset-0 bg-gradient-to-r ${banner.background_gradient} ${isFlashSale ? 'opacity-20' : 'opacity-10'}`} />
      <CardContent className="relative pt-6 pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className={`p-4 rounded-xl bg-gradient-to-br ${banner.background_gradient} text-white shadow-lg ${isFlashSale ? 'animate-bounce' : ''}`}>
            <BannerIcon className="h-10 w-10" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-2xl font-bold ${isFlashSale ? 'text-destructive' : ''}`}>
                {banner.title}
              </h3>
              {banner.subtitle && (
                <Badge variant={isFlashSale ? "destructive" : "secondary"} className={`text-xs ${isFlashSale ? 'animate-pulse' : ''}`}>
                  {banner.subtitle}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{banner.description}</p>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant={isFlashSale ? "destructive" : "outline"} className={`gap-1 ${isFlashSale ? 'animate-pulse' : ''}`}>
                ⏰ {timeRemaining()}
              </Badge>
              {isFlashSale && (
                <Badge variant="outline" className="gap-1 animate-pulse">
                  🔥 LIMITED TIME
                </Badge>
              )}
            </div>
          </div>

          {banner.cta_text && (
            <Button size="lg" className={`bg-gradient-to-r ${banner.background_gradient} hover:opacity-90 ${isFlashSale ? 'shadow-lg shadow-destructive/50' : ''}`}>
              {banner.cta_text}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}