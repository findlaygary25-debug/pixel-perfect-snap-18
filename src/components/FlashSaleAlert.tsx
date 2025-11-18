import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function FlashSaleAlert() {
  const [flashSale, setFlashSale] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkFlashSale = async () => {
      const { data, error } = await supabase
        .from('promotional_banners')
        .select('*')
        .eq('banner_type', 'flash_sale')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .lte('start_date', new Date().toISOString())
        .order('display_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setFlashSale(data);
      }
    };

    checkFlashSale();
    
    // Check every minute for new flash sales
    const interval = setInterval(checkFlashSale, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!flashSale || isDismissed) return null;

  const timeRemaining = () => {
    const now = new Date();
    const end = new Date(flashSale.end_date);
    const diff = end.getTime() - now.getTime();
    
    if (diff < 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const remaining = timeRemaining();
  if (!remaining) return null;

  return (
    <Alert className="fixed top-4 right-4 z-50 w-auto max-w-md border-destructive bg-destructive/10 shadow-xl shadow-destructive/20 animate-in slide-in-from-top">
      <Zap className="h-5 w-5 text-destructive animate-pulse" />
      <AlertTitle className="text-destructive font-bold flex items-center justify-between">
        ⚡ FLASH SALE ACTIVE!
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 hover:bg-destructive/20"
          onClick={() => setIsDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p className="font-semibold">{flashSale.subtitle} - Ends in {remaining}</p>
        <Button 
          size="sm" 
          className="w-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 hover:opacity-90"
          onClick={() => navigate('/rewards-store')}
        >
          Shop Now
        </Button>
      </AlertDescription>
    </Alert>
  );
}
