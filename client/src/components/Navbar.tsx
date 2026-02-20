import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Search, Home, Compass, User, Menu, X, Network } from "lucide-react";

const navLinks = [
  { href: "/", label: "HOME", icon: Home },
  { href: "/discover", label: "DISCOVER", icon: Compass },
  { href: "/connections", label: "CONNECTIONS", icon: Network },
  { href: "/search", label: "SEARCH", icon: Search },
  { href: "/profile", label: "PROFILE", icon: User },
];

export default function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50" data-testid="navbar">
      <div className="container mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" data-testid="link-logo">
          <span className="font-display font-bold text-lg tracking-wider uppercase">RABBIT<span className="text-primary"> HOLE</span></span>
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
        </div>
      )}
    </nav>
  );
}
