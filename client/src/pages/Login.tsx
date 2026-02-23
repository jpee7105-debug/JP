import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Eye, EyeOff, ShieldAlert } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const redirect = new URLSearchParams(search).get("redirect") || "/";
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    navigate(redirect);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login.mutateAsync({ email, password });
      navigate(redirect);
    } catch (err: any) {
      setError(err.message?.includes("401") ? "Invalid email or password" : "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="border border-white/10 bg-card/40 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground mb-4 px-3 py-1 border border-white/10 bg-white/5">
              Welcome back
            </div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-wider" data-testid="text-login-title">
              LOG <span className="text-primary">IN</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-2">Access your investigations</p>
          </div>

          {error && (
            <div className="mb-6 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-mono" data-testid="text-login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-muted-foreground uppercase mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 bg-card/80 border border-white/10 rounded-none focus:outline-none focus:border-primary/50 font-mono text-sm transition-colors"
                placeholder="you@example.com"
                required
                data-testid="input-login-email"
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
                  placeholder="••••••••"
                  required
                  data-testid="input-login-password"
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

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full h-12 bg-primary hover:bg-primary/80 text-white font-mono text-sm uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              data-testid="button-login-submit"
            >
              {login.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                "LOG IN"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              No account?{" "}
              <Link href="/signup" className="text-primary hover:text-primary/80 transition-colors font-mono text-xs" data-testid="link-signup">
                CREATE ONE
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              data-testid="link-admin-login"
            >
              <ShieldAlert className="w-3 h-3" />
              ADMIN LOGIN
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
