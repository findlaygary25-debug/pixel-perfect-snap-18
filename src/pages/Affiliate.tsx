import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

export default function AffiliatePage() {
  const [refLink, setRefLink] = useState<string>("");
  const [sponsor, setSponsor] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      // your public referral link (you can use site domain + ?ref=uid)
      setRefLink(`${window.location.origin}/?ref=${user.id}`);

      const { data } = await supabase.from("affiliate_links").select("sponsor_id").eq("user_id", user.id).single();
      setSponsor(data?.sponsor_id ?? null);
    })();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Affiliate Program</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Earn commissions 5 levels deep on all referral sales. Unlimited direct referrals.
      </p>
      
      <div className="mb-6 p-4 border rounded-lg bg-muted/30">
        <h2 className="font-semibold mb-3">Commission Structure</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Tier 1 (Direct Referrals):</span>
            <span className="font-semibold">10%</span>
          </div>
          <div className="flex justify-between">
            <span>Tier 2:</span>
            <span className="font-semibold">7%</span>
          </div>
          <div className="flex justify-between">
            <span>Tier 3:</span>
            <span className="font-semibold">5%</span>
          </div>
          <div className="flex justify-between">
            <span>Tier 4:</span>
            <span className="font-semibold">3%</span>
          </div>
          <div className="flex justify-between">
            <span>Tier 5:</span>
            <span className="font-semibold">2%</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm mb-2">Your Referral Link</div>
        <Input value={refLink} readOnly onFocus={(e) => e.currentTarget.select()} />
      </div>
      <div className="text-sm text-muted-foreground">Your Sponsor: {sponsor ?? "—"}</div>
    </div>
  );
}
