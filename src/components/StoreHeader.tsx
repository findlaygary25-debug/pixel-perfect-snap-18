import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Store as StoreIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type StoreHeaderProps = {
  store: {
    id: string;
    user_id: string;
    name: string;
    logo_url: string | null;
    description: string | null;
    is_active: boolean;
    website_url?: string;
  };
};

export function StoreHeader({ store }: StoreHeaderProps) {
  const [profile, setProfile] = useState<{
    username: string;
    avatar_url: string | null;
  } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("user_id", store.user_id)
        .single();

      if (data) setProfile(data);
    };

    fetchProfile();
  }, [store.user_id]);

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
      {store.logo_url ? (
        <img 
          src={store.logo_url} 
          alt={store.name}
          className="h-16 w-16 rounded-lg object-cover"
        />
      ) : (
        <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
          <StoreIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{store.name}</h1>
          <Badge variant={store.is_active ? "default" : "secondary"}>
            {store.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        
        {store.description && (
          <p className="text-sm text-muted-foreground mt-1">{store.description}</p>
        )}

        <div className="flex items-center gap-4 mt-2">
          {profile && (
            <Link 
              to={`/profile/${profile.username}`}
              className="flex items-center gap-2 hover:opacity-80"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">@{profile.username}</span>
            </Link>
          )}

          {store.website_url && (
            <a 
              href={store.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
