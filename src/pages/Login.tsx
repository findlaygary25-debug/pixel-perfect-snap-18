import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { UserPlus } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferrerId(ref);
      // Get referrer's username
      supabase
        .from("profiles")
        .select("username")
        .eq("user_id", ref)
        .single()
        .then(({ data }) => {
          if (data) setReferrerName(data.username);
        });
    }
  }, [searchParams]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "✅ Logged in successfully!" });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Login error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      const signupData: any = {
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      };

      // Add referrer to metadata if present
      if (referrerId) {
        signupData.options.data = {
          referred_by: referrerId,
        };
      }

      const { error } = await supabase.auth.signUp(signupData);
      if (error) throw error;
      
      toast({ 
        title: "✅ Account created!", 
        description: referrerId 
          ? `Welcome! You were referred by ${referrerName || "a friend"}`
          : "You can now log in."
      });
    } catch (err: any) {
      toast({ title: "Signup error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center">🔥 Voice2Fire Login</h2>
        
        {referrerId && referrerName && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <UserPlus className="h-4 w-4 text-primary" />
              <Badge variant="default">Referral Sign Up</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              You're signing up through <strong>{referrerName}</strong>'s affiliate link!
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <div className="flex gap-2">
            <Button onClick={handleLogin} disabled={loading} className="flex-1">
              Login
            </Button>
            <Button onClick={handleSignup} disabled={loading} variant="outline" className="flex-1">
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
