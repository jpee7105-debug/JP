import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Search, Home, Compass, Menu, X, Network, LogIn, UserPlus, User, LogOut, Radio, BookOpen, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { href: "/", label: "HOME", icon: Home },
  { href: "/discover", label: "DISCOVER", icon: Compass },
  { href: "/live", label: "LIVE", icon: Radio },
  { href: "/connections", label: "CONNECTIONS", icon: Network },
  { href: "/library", label: "LIBRARY", icon: BookOpen },
  { href: "/search", label: "SEARCH", icon: Search },
];

export default function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout.mutateAsync();
  };

  return (
    <nav className="border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50" data-testid="navbar">
      <div className="container mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" data-testid="link-logo">
          <span className="font-display font-bold text-lg tracking-wider uppercase text-left pl-[1px] pr-[1px]">RABBIT<span className="text-primary"> HOLE</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase transition-colors ${isActive ? "text-primary bg-primary/10 border border-primary/20" : "text-muted-foreground hover:text-white border border-transparent"}`}
                data-testid={`nav-${label.toLowerCase()}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}

          <Link
            href="/guide"
            className={`flex items-center gap-2 px-2 py-1.5 text-xs transition-colors ${location === "/guide" ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
            data-testid="nav-guide"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </Link>

          <div className="w-px h-5 bg-white/10 mx-2" />

          {isAuthenticated ? (
            <>
              <Link
                href="/account"
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase transition-colors ${location === "/account" ? "text-primary bg-primary/10 border border-primary/20" : "text-muted-foreground hover:text-white border border-transparent"}`}
                data-testid="nav-account"
              >
                <User className="w-3.5 h-3.5" />
                {user?.name || "ACCOUNT"}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase text-muted-foreground hover:text-white border border-transparent transition-colors"
                data-testid="nav-logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                LOGOUT
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase transition-colors ${location === "/login" ? "text-primary bg-primary/10 border border-primary/20" : "text-muted-foreground hover:text-white border border-transparent"}`}
                data-testid="nav-login"
              >
                <LogIn className="w-3.5 h-3.5" />
                LOGIN
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                data-testid="nav-signup"
              >
                <UserPlus className="w-3.5 h-3.5" />
                SIGN UP
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-muted-foreground hover:text-white transition-colors"
          data-testid="button-mobile-menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-background/95 backdrop-blur-md">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-6 py-4 text-sm font-mono uppercase border-b border-white/5 transition-colors ${isActive ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-white"}`}
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
            className={`flex items-center gap-3 px-6 py-4 text-sm font-mono uppercase border-b border-white/5 transition-colors ${location === "/guide" ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-white"}`}
            data-testid="nav-mobile-guide"
          >
            <HelpCircle className="w-4 h-4" />
            GUIDE
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-6 py-4 text-sm font-mono uppercase border-b border-white/5 text-muted-foreground hover:text-white"
                data-testid="nav-mobile-account"
              >
                <User className="w-4 h-4" />
                ACCOUNT
              </Link>
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="flex items-center gap-3 px-6 py-4 text-sm font-mono uppercase border-b border-white/5 text-muted-foreground hover:text-white w-full text-left"
                data-testid="nav-mobile-logout"
              >
                <LogOut className="w-4 h-4" />
                LOGOUT
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-6 py-4 text-sm font-mono uppercase border-b border-white/5 text-muted-foreground hover:text-white"
                data-testid="nav-mobile-login"
              >
                <LogIn className="w-4 h-4" />
                LOGIN
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-6 py-4 text-sm font-mono uppercase border-b border-white/5 text-primary"
                data-testid="nav-mobile-signup"
              >
                <UserPlus className="w-4 h-4" />
                SIGN UP
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
