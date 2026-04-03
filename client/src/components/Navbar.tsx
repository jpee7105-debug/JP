import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Search, Home, Compass, Menu, X, Network, LogIn, UserPlus, User, LogOut, Radio, BookOpen, HelpCircle, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/connections", label: "Connections", icon: Network },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/timeline", label: "Timeline", icon: Clock },
  { href: "/search", label: "Search", icon: Search },
];

export default function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout.mutateAsync();
  };

  return (
    <nav className="border-b border-white/5 bg-background/90 backdrop-blur-md sticky top-0 z-50" data-testid="navbar">
      <div className="container mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" data-testid="link-logo">
          <span className="font-display font-bold text-base tracking-wider uppercase">RABBIT<span className="text-primary"> HOLE</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase rounded-lg transition-all ${isActive ? "text-foreground bg-white/8" : "text-muted-foreground/70 hover:text-foreground hover:bg-white/5"}`}
                data-testid={`nav-${label.toLowerCase()}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}

          <Link
            href="/guide"
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-all ${location === "/guide" ? "text-foreground bg-white/8" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
            data-testid="nav-guide"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </Link>

          <div className="w-px h-4 bg-white/10 mx-2" />

          {isAuthenticated ? (
            <>
              <Link
                href="/account"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase rounded-lg transition-all ${location === "/account" ? "text-foreground bg-white/8" : "text-muted-foreground/70 hover:text-foreground hover:bg-white/5"}`}
                data-testid="nav-account"
              >
                <User className="w-3.5 h-3.5" />
                {user?.name || "Account"}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase text-muted-foreground/70 hover:text-foreground rounded-lg transition-all"
                data-testid="nav-logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase rounded-lg transition-all ${location === "/login" ? "text-foreground bg-white/8" : "text-muted-foreground/70 hover:text-foreground hover:bg-white/5"}`}
                data-testid="nav-login"
              >
                <LogIn className="w-3.5 h-3.5" />
                Login
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase bg-primary text-white rounded-lg hover:bg-primary/85 transition-colors"
                data-testid="nav-signup"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-1.5 rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-white/6 transition-all"
          data-testid="button-mobile-menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-background/98 backdrop-blur-md">
          <div className="py-2">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = href === "/" ? location === "/" : location.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-6 py-3.5 text-sm font-mono uppercase transition-colors ${isActive ? "text-foreground bg-white/5" : "text-muted-foreground/70 hover:text-foreground"}`}
                  data-testid={`nav-mobile-${label.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}

            <Link
              href="/guide"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-6 py-3.5 text-sm font-mono uppercase transition-colors ${location === "/guide" ? "text-foreground bg-white/5" : "text-muted-foreground/70 hover:text-foreground"}`}
              data-testid="nav-mobile-guide"
            >
              <HelpCircle className="w-4 h-4" />
              Guide
            </Link>

            <div className="h-px bg-white/5 mx-6 my-2" />

            {isAuthenticated ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-6 py-3.5 text-sm font-mono uppercase text-muted-foreground/70 hover:text-foreground transition-colors"
                  data-testid="nav-mobile-account"
                >
                  <User className="w-4 h-4" />
                  Account
                </Link>
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="flex items-center gap-3 px-6 py-3.5 text-sm font-mono uppercase text-muted-foreground/70 hover:text-foreground transition-colors w-full text-left"
                  data-testid="nav-mobile-logout"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-6 py-3.5 text-sm font-mono uppercase text-muted-foreground/70 hover:text-foreground transition-colors"
                  data-testid="nav-mobile-login"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-6 py-3.5 text-sm font-mono uppercase text-primary hover:text-primary/80 transition-colors"
                  data-testid="nav-mobile-signup"
                >
                  <UserPlus className="w-4 h-4" />
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
