import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'moderator' | 'user' | null;

export function useUserRole() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      // Check if user is admin
      const { data: isAdminData, error: adminError } = await supabase.rpc('is_admin', {
        _user_id: user.id
      });

      if (adminError) {
        console.error("Error checking admin status:", adminError);
      } else if (isAdminData === true) {
        setUserRole('admin');
        setLoading(false);
        return;
      }

      // Check if user is moderator
      const { data: isModeratorData, error: moderatorError } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'moderator'
      });

      if (moderatorError) {
        console.error("Error checking moderator status:", moderatorError);
      } else if (isModeratorData === true) {
        setUserRole('moderator');
        setLoading(false);
        return;
      }

      // Default to regular user
      setUserRole('user');
    } catch (error) {
      console.error("Error in role check:", error);
      setUserRole('user');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = userRole === 'admin';
  const isModerator = userRole === 'moderator';
  const isAdminOrModerator = userRole === 'admin' || userRole === 'moderator';

  return { 
    userRole, 
    loading, 
    isAdmin, 
    isModerator, 
    isAdminOrModerator,
    refetch: checkUserRole 
  };
}
