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
      <h1 className="text-2xl font-bold mb-2">Affiliate</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Earn up to 4 levels; Voice2Fire receives 5th tier stewardship.
      </p>
      <div className="mb-4">
        <div className="text-sm mb-2">Your link</div>
        <Input value={refLink} readOnly onFocus={(e) => e.currentTarget.select()} />
      </div>
      <div className="text-sm text-muted-foreground">Your Sponsor: {sponsor ?? "—"}</div>
    </div>
  );
}
