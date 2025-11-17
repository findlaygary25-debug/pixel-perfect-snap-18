import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminBootstrap() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleClaimAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setError("Please enter a bootstrap token");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("You must be logged in to claim admin access");
        setLoading(false);
        return;
      }

      // Call the claim_admin_bootstrap function
      const { data, error: rpcError } = await supabase.rpc('claim_admin_bootstrap', {
        p_token: token.trim()
      });

      if (rpcError) {
        throw rpcError;
      }

      // Type assertion for the JSONB response
      const result = data as { success: boolean; message?: string; error?: string };

      if (result?.success) {
        setSuccess(true);
        toast.success("Admin access granted!", {
          description: "You now have administrator privileges."
        });
        
        // Redirect to admin panel after 2 seconds
        setTimeout(() => {
          navigate("/admin/roles");
        }, 2000);
      } else {
        setError(result?.error || "Failed to claim admin access");
      }
    } catch (err: any) {
      console.error("Error claiming admin:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Admin Bootstrap</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your one-time bootstrap token to claim admin access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                Admin access granted! Redirecting to admin panel...
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleClaimAdmin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Bootstrap Token</Label>
                <Input
                  id="token"
                  type="text"
                  placeholder="Enter your bootstrap token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={loading}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  This token can only be used once and expires after 7 days
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !token.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Claiming Admin Access...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Claim Admin Access
                  </>
                )}
              </Button>

              <div className="pt-4 border-t border-border/50">
                <p className="text-xs text-center text-muted-foreground">
                  Don't have a token? Contact your system administrator or check your deployment logs.
                </p>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
