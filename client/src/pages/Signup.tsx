import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function Signup() {
  const [, navigate] = useLocation();
  const { signup, isAuthenticated } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await signup.mutateAsync({ email, password, name: name || undefined });
      navigate("/");
    } catch (err: any) {
      setError(err.message?.includes("409") ? "An account with this email already exists" : "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="border border-white/10 bg-card/40 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground mb-4 px-3 py-1 border border-white/10 bg-white/5">
              Create your account
            </div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-wider" data-testid="text-signup-title">
              SIGN <span className="text-primary">UP</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-2">Join the investigation network</p>
          </div>

          {error && (
            <div className="mb-6 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-mono" data-testid="text-signup-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-muted-foreground uppercase mb-2">Name (optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 px-4 bg-card/80 border border-white/10 rounded-none focus:outline-none focus:border-primary/50 font-mono text-sm transition-colors"
                placeholder="Your name"
                data-testid="input-signup-name"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground uppercase mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 bg-card/80 border border-white/10 rounded-none focus:outline-none focus:border-primary/50 font-mono text-sm transition-colors"
                placeholder="you@example.com"
                required
                data-testid="input-signup-email"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground uppercase mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-4 pr-12 bg-card/80 border border-white/10 rounded-none focus:outline-none focus:border-primary/50 font-mono text-sm transition-colors"
                  placeholder="Min 6 characters"
                  required
                  data-testid="input-signup-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground uppercase mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-12 px-4 bg-card/80 border border-white/10 rounded-none focus:outline-none focus:border-primary/50 font-mono text-sm transition-colors"
                placeholder="Re-enter password"
                required
                data-testid="input-signup-confirm"
              />
            </div>

            <button
              type="submit"
              disabled={signup.isPending}
              className="w-full h-12 bg-primary hover:bg-primary/80 text-white font-mono text-sm uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              data-testid="button-signup-submit"
            >
              {signup.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  CREATING PROFILE...
                </>
              ) : (
                "SIGN UP"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:text-primary/80 transition-colors font-mono text-xs" data-testid="link-login">
                LOG IN
              </Link>
            </p>
          </div>

          <div className="mt-6 p-3 border border-white/5 bg-white/[0.02]">
            <p className="text-xs font-mono text-muted-foreground text-center">
              FREE TIER: Preview first 2 depth nodes per investigation
            </p>
            <p className="text-xs font-mono text-primary/60 text-center mt-1">
              PRO: Full access to all investigations + depth content
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
