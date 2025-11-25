import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: isAdminData, error: adminError } = await supabaseClient.rpc('is_admin', {
      _user_id: user.id
    });

    if (adminError || !isAdminData) {
      throw new Error("Unauthorized - Admin access required");
    }

    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword) {
      throw new Error("Missing userId or newPassword");
    }

    // Use admin client to update user password
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Password reset successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
