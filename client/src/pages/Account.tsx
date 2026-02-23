import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, Crown, Calendar, Mail, Shield, ArrowUpRight, RotateCcw, HelpCircle, Settings, Loader2, CheckCircle2 } from "lucide-react";
import { useOnboardingContext } from "@/App";

const planBadge: Record<string, { color: string; bg: string; border: string; label: string }> = {
  Free: { color: "text-muted-foreground", bg: "bg-white/5", border: "border-white/10", label: "FREE TIER" },
  Pro: { color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", label: "PRO ACCESS" },
};

const statusLabels: Record<string, string> = {
  none: "No subscription",
  active: "Active",
  past_due: "Past due",
  canceled: "Canceled",
  trialing: "Trial",
};

export default function Account() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const { restartTour } = useOnboardingContext();

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/sync-subscription");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/portal");
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true" && user) {
      syncMutation.mutate();
      window.history.replaceState({}, "", "/account");
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="font-mono text-sm text-muted-foreground animate-pulse">LOADING PROFILE...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    navigate("/login");
    return null;
  }

  const badge = planBadge[user.plan] || planBadge.Free;
  const isPro = user.plan === "Pro" && user.subscriptionStatus === "active";
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate("/");
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] container mx-auto px-6 py-12 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wider" data-testid="text-account-title">
          MY <span className="text-primary">PROFILE</span>
        </h1>
      </div>

      {syncMutation.isSuccess && (syncMutation.data as any)?.plan === "Pro" && (
        <div className="border border-green-500/20 bg-green-500/[0.03] p-4 mb-6 flex items-center gap-3" data-testid="upgrade-success">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-sm font-mono text-green-400">Welcome to Pro. Full access is now unlocked.</p>
        </div>
      )}

      <div className="border border-white/10 bg-card/40 p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 border border-white/10 bg-white/5 flex items-center justify-center">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold" data-testid="text-account-name">
                {user.name || "Anonymous User"}
              </h2>
              <p className="text-sm text-muted-foreground font-mono flex items-center gap-1" data-testid="text-account-email">
                <Mail className="w-3 h-3" /> {user.email}
              </p>
            </div>
          </div>
          <span className={`font-mono text-xs font-bold px-3 py-1.5 ${badge.bg} ${badge.color} border ${badge.border}`} data-testid="text-account-plan">
            {badge.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
          <div className="p-4 border border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-1">
              <Crown className="w-3 h-3" /> PLAN
            </div>
            <p className="font-mono text-sm" data-testid="text-plan-value">{user.plan}</p>
          </div>
          <div className="p-4 border border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-1">
              <Shield className="w-3 h-3" /> STATUS
            </div>
            <p className="font-mono text-sm" data-testid="text-status-value">{statusLabels[user.subscriptionStatus] || user.subscriptionStatus}</p>
          </div>
          <div className="p-4 border border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-1">
              <Calendar className="w-3 h-3" /> JOINED
            </div>
            <p className="font-mono text-sm" data-testid="text-joined-value">{memberSince}</p>
          </div>
          <div className="p-4 border border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-1">
              <Calendar className="w-3 h-3" /> LAST LOGIN
            </div>
            <p className="font-mono text-sm" data-testid="text-lastlogin-value">
              {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "First session"}
            </p>
          </div>
        </div>
      </div>

      {isPro ? (
        <div className="border border-primary/20 bg-primary/[0.03] p-8 mb-6">
          <div className="flex items-start gap-4">
            <Crown className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-display text-lg font-bold mb-2">PRO ACTIVE</h3>
              <p className="text-muted-foreground text-sm mb-4">
                You have full access to all depth content, investigations, and research materials.
              </p>
              <button
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
                className="inline-flex items-center gap-2 px-6 py-3 border border-primary/20 text-primary font-mono text-sm uppercase tracking-wider hover:bg-primary/10 transition-colors"
                data-testid="button-manage-subscription"
              >
                {portalMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> LOADING...</>
                ) : (
                  <><Settings className="w-4 h-4" /> MANAGE SUBSCRIPTION</>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-primary/20 bg-primary/[0.03] p-8 mb-6">
          <div className="flex items-start gap-4">
            <Crown className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-display text-lg font-bold mb-2">UPGRADE TO PRO</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Get unlimited access to all depth content, full investigations, and priority research materials.
              </p>
              <ul className="space-y-2 text-sm mb-6">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Full access to all depth nodes
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Unlimited investigation reading
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Priority access to new content
                </li>
              </ul>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 text-white font-mono text-sm uppercase tracking-wider transition-colors"
                data-testid="button-upgrade"
              >
                UPGRADE NOW <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="border border-white/10 bg-card/40 p-8 mb-6">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-4 text-muted-foreground">Help & Onboarding</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={restartTour}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/10 text-sm font-mono uppercase text-muted-foreground hover:text-white hover:border-white/20 transition-colors"
            data-testid="button-restart-tour"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart Tour
          </button>
          <Link
            href="/guide"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/10 text-sm font-mono uppercase text-muted-foreground hover:text-white hover:border-white/20 transition-colors"
            data-testid="link-guide"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            View Guide
          </Link>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleLogout}
          disabled={logout.isPending}
          className="px-6 py-3 border border-white/10 text-muted-foreground hover:text-white hover:border-white/20 font-mono text-sm uppercase tracking-wider transition-colors"
          data-testid="button-logout"
        >
          {logout.isPending ? "LOGGING OUT..." : "LOG OUT"}
        </button>
      </div>
    </div>
  );
}
