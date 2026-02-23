import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Crown, Check, Loader2, ArrowRight, Shield, Layers, Network, BookOpen } from "lucide-react";

type StripePriceRow = {
  product_id: string;
  product_name: string;
  product_description: string;
  price_id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string } | null;
};

const PRO_FEATURES = [
  { icon: Layers, label: "Full access to all depth nodes" },
  { icon: Shield, label: "Complete investigation content" },
  { icon: Network, label: "Advanced graph filters" },
  { icon: BookOpen, label: "Saved views and bookmarks" },
  { icon: Crown, label: "Priority access to new content" },
];

const FREE_FEATURES = [
  "Investigation overviews",
  "First 2 depth nodes per investigation",
  "Community comments",
  "Connections graph (basic)",
  "Library access",
];

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const { data: prices = [] } = useQuery<StripePriceRow[]>({
    queryKey: ["/api/stripe/prices"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const res = await apiRequest("POST", "/api/stripe/checkout", { priceId });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const monthlyPrice = prices.find(p => p.recurring?.interval === "month");
  const yearlyPrice = prices.find(p => p.recurring?.interval === "year");
  const selectedPrice = billingInterval === "month" ? monthlyPrice : yearlyPrice;

  const isPro = user?.plan === "Pro" && user?.subscriptionStatus === "active";

  const handleUpgrade = () => {
    if (!isAuthenticated) {
      navigate("/signup");
      return;
    }
    if (!selectedPrice) return;
    setCheckoutLoading(true);
    checkoutMutation.mutate(selectedPrice.price_id);
  };

  const monthlyAmount = monthlyPrice ? monthlyPrice.unit_amount / 100 : 9;
  const yearlyAmount = yearlyPrice ? yearlyPrice.unit_amount / 100 : 79;
  const yearlySavings = Math.round(((monthlyAmount * 12 - yearlyAmount) / (monthlyAmount * 12)) * 100);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] container mx-auto px-6 py-16 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl font-bold uppercase tracking-wider mb-4" data-testid="text-pricing-title">
          GO <span className="text-primary">DEEPER</span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Unlock the full investigative experience. Every depth node, every connection, every detail.
        </p>
      </div>

      {isPro && (
        <div className="text-center mb-8 p-4 border border-primary/20 bg-primary/[0.03]">
          <p className="font-mono text-sm text-primary" data-testid="text-already-pro">
            You're already on the Pro plan. <Link href="/account" className="underline">Manage subscription</Link>
          </p>
        </div>
      )}

      <div className="flex justify-center mb-10">
        <div className="flex border border-white/10 p-1 bg-white/[0.02]">
          <button
            onClick={() => setBillingInterval("month")}
            className={`px-6 py-2 font-mono text-xs uppercase transition-colors ${billingInterval === "month" ? "bg-primary text-white" : "text-muted-foreground hover:text-white"}`}
            data-testid="button-monthly"
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval("year")}
            className={`px-6 py-2 font-mono text-xs uppercase transition-colors ${billingInterval === "year" ? "bg-primary text-white" : "text-muted-foreground hover:text-white"}`}
            data-testid="button-yearly"
          >
            Yearly <span className="text-[10px] ml-1 opacity-70">SAVE {yearlySavings}%</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-white/10 bg-card/40 p-8">
          <div className="mb-6">
            <h2 className="font-display text-xl font-bold uppercase tracking-wider mb-1">Free</h2>
            <p className="text-muted-foreground text-sm">Explore the surface</p>
          </div>
          <div className="mb-6">
            <span className="font-display text-4xl font-bold">$0</span>
            <span className="text-muted-foreground text-sm ml-1">/forever</span>
          </div>
          <ul className="space-y-3 mb-8">
            {FREE_FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-white/30 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {!isAuthenticated && (
            <Link
              href="/signup"
              className="block w-full text-center py-3 border border-white/10 font-mono text-sm uppercase text-muted-foreground hover:text-white hover:border-white/20 transition-colors"
              data-testid="button-free-signup"
            >
              GET STARTED
            </Link>
          )}
        </div>

        <div className="border-2 border-primary/30 bg-primary/[0.02] p-8 relative">
          <div className="absolute -top-3 left-8">
            <span className="bg-primary text-white px-3 py-1 font-mono text-[10px] uppercase tracking-wider">
              FULL ACCESS
            </span>
          </div>
          <div className="mb-6">
            <h2 className="font-display text-xl font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" /> Pro
            </h2>
            <p className="text-muted-foreground text-sm">Go down the rabbit hole</p>
          </div>
          <div className="mb-6">
            <span className="font-display text-4xl font-bold">
              ${billingInterval === "month" ? monthlyAmount : yearlyAmount}
            </span>
            <span className="text-muted-foreground text-sm ml-1">/{billingInterval === "month" ? "month" : "year"}</span>
            {billingInterval === "year" && (
              <span className="block text-xs text-primary/60 font-mono mt-1">
                ${(yearlyAmount / 12).toFixed(2)}/month billed annually
              </span>
            )}
          </div>
          <ul className="space-y-3 mb-8">
            {PRO_FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <f.icon className="w-4 h-4 text-primary flex-shrink-0" />
                {f.label}
              </li>
            ))}
          </ul>
          {isPro ? (
            <Link
              href="/account"
              className="block w-full text-center py-3 border border-primary/20 bg-primary/10 font-mono text-sm uppercase text-primary transition-colors"
              data-testid="button-manage-sub"
            >
              MANAGE SUBSCRIPTION
            </Link>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={checkoutLoading || checkoutMutation.isPending}
              className="w-full py-3 bg-primary hover:bg-primary/80 text-white font-mono text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              data-testid="button-upgrade-pro"
            >
              {checkoutLoading || checkoutMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> PROCESSING...</>
              ) : (
                <>{isAuthenticated ? "UPGRADE TO PRO" : "SIGN UP FOR PRO"} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="text-center mt-8 text-xs font-mono text-muted-foreground/50">
        Cancel anytime. Secure payment via Stripe.
      </div>
    </div>
  );
}
