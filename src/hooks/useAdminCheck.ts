import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function useAdminCheck(redirectIfNotAdmin = true) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        if (redirectIfNotAdmin) {
          navigate("/login");
        }
        return;
      }

      // Call the is_admin function
      const { data, error } = await supabase.rpc('is_admin', {
        _user_id: user.id
      });

      if (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data === true);
        if (redirectIfNotAdmin && data !== true) {
          navigate("/");
        }
      }
    } catch (error) {
      console.error("Error in admin check:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  return { isAdmin, loading, refetch: checkAdminStatus };
}
