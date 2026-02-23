import { useState, useEffect, createContext, useContext, useRef } from "react";
import { useLocation } from "wouter";
import {
  Loader2,
  Shield,
  LogOut,
  Eye,
  EyeOff,
  Plus,
  Menu,
  X,
  Rabbit,
  LayoutDashboard,
  Search,
  Users,
  Link2,
  Radio,
  Headphones,
  History,
  AlertTriangle,
  ChevronRight,
  Users2,
} from "lucide-react";

type AdminEmployee = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

type AdminContextType = {
  employee: AdminEmployee | null;
  role: string;
  isAdmin: boolean;
  canEdit: boolean;
  navigate: (href: string) => void;
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
};

export const AdminContext = createContext<AdminContextType>({
  employee: null,
  role: "",
  isAdmin: false,
  canEdit: false,
  navigate: () => {},
  isDirty: false,
  setDirty: () => {},
});

export function useAdminContext() {
  return useContext(AdminContext);
}

type NavItem = {
  id: string;
  label: string;
  icon: typeof Shield;
  path: string;
  tab?: string;
  adminOnly?: boolean;
};

const NAV_SECTIONS: { group: string; items: NavItem[] }[] = [
  {
    group: "EDITORIAL",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
      { id: "investigations", label: "Investigations", icon: Search, path: "/admin", tab: "holes" },
    ],
  },
  {
    group: "INTELLIGENCE",
    items: [
      { id: "people", label: "People", icon: Users2, path: "/admin/people" },
      { id: "relationships", label: "Relationships", icon: Link2, path: "/admin", tab: "relationships" },
    ],
  },
  {
    group: "CONTENT",
    items: [
      { id: "streams", label: "Streams", icon: Radio, path: "/admin/live" },
      { id: "podcasts", label: "Podcasts", icon: Headphones, path: "/admin", tab: "podcasts" },
    ],
  },
  {
    group: "SYSTEM",
    items: [
      { id: "history", label: "History", icon: History, path: "/admin", tab: "history" },
      { id: "validation", label: "Validation", icon: AlertTriangle, path: "/admin", tab: "tools" },
      { id: "employees", label: "Employees", icon: Users, path: "/admin", tab: "employees", adminOnly: true },
    ],
  },
];

function isItemActive(item: NavItem, location: string): boolean {
  const [pathname, search] = location.split("?");
  const params = new URLSearchParams(search || "");
  const currentTab = params.get("tab");

  if (item.path === "/admin/people" && pathname === "/admin/people") return true;
  if (item.path === "/admin/live" && pathname === "/admin/live") return true;

  if (item.path === "/admin" && pathname === "/admin") {
    if (item.tab) return currentTab === item.tab;
    return !currentTab;
  }

  return false;
}

function getNavHref(item: NavItem): string {
  if (item.tab) return `${item.path}?tab=${item.tab}`;
  return item.path;
}

function getBreadcrumbs(location: string): { label: string; href: string }[] {
  const [pathname, search] = location.split("?");
  const params = new URLSearchParams(search || "");
  const currentTab = params.get("tab");

  const crumbs: { label: string; href: string }[] = [
    { label: "Dashboard", href: "/admin" },
  ];

  if (pathname === "/admin/people") {
    crumbs.push({ label: "People", href: "/admin/people" });
  } else if (pathname === "/admin/live") {
    crumbs.push({ label: "Streams", href: "/admin/live" });
  } else if (pathname === "/admin" && currentTab) {
    const tabLabels: Record<string, string> = {
      holes: "Investigations",
      relationships: "Relationships",
      podcasts: "Podcasts",
      history: "History",
      tools: "Validation",
      employees: "Employees",
    };
    const label = tabLabels[currentTab] || currentTab;
    crumbs.push({ label, href: `/admin?tab=${currentTab}` });
  }

  return crumbs;
}

type SearchResult = { holes: { id: number; slug: string; title: string; status: string }[]; people: { id: number; handle: string; fullName: string; status: string }[] };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<AdminEmployee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createDropdown, setCreateDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [searchStr, setSearchStr] = useState(window.location.search);
  const [isDirty, setDirty] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const createRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [location, setLocation] = useLocation();

  useEffect(() => {
    const onPop = () => setSearchStr(window.location.search);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setEmployee(data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleSearchInput = (val: string) => {
    setGlobalSearch(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!val.trim()) { setSearchResults(null); setSearchOpen(false); return; }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val.trim())}`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setSearchOpen(true);
        }
      } catch {}
    }, 300);
  };

  const handleLogin = async () => {
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setEmployee(data);
      } else {
        const err = await res.json();
        setLoginError(err.message || "Invalid credentials");
      }
    } catch {
      setLoginError("Connection error");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setEmployee(null);
    setEmail("");
    setPassword("");
  };

  const doNavigate = (href: string) => {
    if (href.includes("?")) {
      window.history.pushState(null, "", href);
      setSearchStr(new URL(href, window.location.origin).search);
    } else {
      setLocation(href);
      setSearchStr("");
    }
    setDirty(false);
  };

  const navigate = (href: string) => {
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Leave without saving?")) {
        doNavigate(href);
      }
    } else {
      doNavigate(href);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="admin-layout-loading">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="page-admin-login">
        <div className="w-full max-w-sm border border-white/10 bg-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="font-display text-xl font-bold uppercase">Admin Access</h1>
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full bg-white/5 border border-white/10 p-3 text-sm font-mono mb-3 focus:outline-none focus:border-primary/50"
            data-testid="input-admin-email"
          />
          <div className="relative mb-3">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Password"
              className="w-full bg-white/5 border border-white/10 p-3 pr-10 text-sm font-mono focus:outline-none focus:border-primary/50"
              data-testid="input-admin-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              data-testid="button-toggle-password"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {loginError && (
            <p className="text-xs text-red-500 font-mono mb-3" data-testid="text-admin-login-error">
              {loginError}
            </p>
          )}
          <button
            onClick={handleLogin}
            className="w-full bg-primary/10 border border-primary/30 text-primary font-mono text-xs uppercase py-2.5 hover:bg-primary/20 transition-colors"
            data-testid="button-admin-login"
          >
            AUTHENTICATE
          </button>
        </div>
      </div>
    );
  }

  const role = employee.role || "";
  const isAdmin = role === "Admin";
  const canEdit = role === "Admin" || role === "Editor";

  const contextValue: AdminContextType = { employee, role, isAdmin, canEdit, navigate, isDirty, setDirty };

  const fullLocation = location + (searchStr || "");
  const breadcrumbs = getBreadcrumbs(fullLocation);

  const sidebarContent = (
    <nav className="flex-1 overflow-y-auto py-2" data-testid="admin-sidebar-nav">
      {NAV_SECTIONS.map((section) => {
        const sectionItems = section.items.filter(
          (item) => !item.adminOnly || isAdmin
        );
        if (sectionItems.length === 0) return null;
        return (
          <div key={section.group} className="mb-2">
            <div className="px-4 py-2">
              <span className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-widest">
                {section.group}
              </span>
            </div>
            {sectionItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item, fullLocation);
              const href = getNavHref(item);
              return (
                <a
                  key={item.id}
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(href);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 font-mono text-xs uppercase transition-colors border-l-2 ${
                    active
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-white"
                  }`}
                  data-testid={`admin-nav-${item.id}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </a>
              );
            })}
          </div>
        );
      })}
    </nav>
  );

  return (
    <AdminContext.Provider value={contextValue}>
      <div className="min-h-screen flex flex-col bg-background" data-testid="admin-layout">
        <header className="h-12 bg-[#111418] border-b border-white/5 sticky top-0 z-40 flex items-center justify-between px-4" data-testid="admin-topnav">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-muted-foreground hover:text-white mr-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              data-testid="button-mobile-sidebar"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <a
              href="/admin"
              onClick={(e) => {
                e.preventDefault();
                navigate("/admin");
              }}
              className="flex items-center gap-2 cursor-pointer"
              data-testid="admin-logo"
            >
              <Rabbit className="w-5 h-5 text-primary" />
              <span className="font-display font-bold text-sm tracking-wider uppercase">
                RABBIT<span className="text-primary"> HOLE</span>
              </span>
            </a>
            <span className="text-[10px] font-mono uppercase text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5" data-testid="admin-badge">
              ADMIN
            </span>

            <div className="hidden md:block w-px h-5 bg-white/10 mx-1" />
            <a
              href="/admin"
              onClick={(e) => { e.preventDefault(); navigate("/admin"); }}
              className="hidden md:flex items-center gap-1.5 text-muted-foreground hover:text-white font-mono text-xs px-2 py-1.5 transition-colors"
              data-testid="button-dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </a>
          </div>

          <div ref={searchRef} className="relative hidden md:block flex-1 max-w-xs mx-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => { if (searchResults) setSearchOpen(true); }}
                placeholder="Search people, investigations..."
                className="w-full h-8 pl-8 pr-3 bg-white/5 border border-white/10 text-xs font-mono focus:outline-none focus:border-primary/40 transition-colors"
                data-testid="input-admin-search"
              />
            </div>
            {searchOpen && searchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#111418] border border-white/10 z-50 max-h-80 overflow-y-auto" data-testid="dropdown-search-results">
                {searchResults.holes.length === 0 && searchResults.people.length === 0 && (
                  <div className="px-3 py-4 text-center font-mono text-xs text-muted-foreground">No results found</div>
                )}
                {searchResults.holes.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 font-mono text-[10px] text-muted-foreground/50 uppercase tracking-widest border-b border-white/5">Investigations</div>
                    {searchResults.holes.slice(0, 5).map((h) => (
                      <a
                        key={`hole-${h.id}`}
                        href={`/admin?tab=holes`}
                        onClick={(e) => { e.preventDefault(); navigate("/admin?tab=holes"); setSearchOpen(false); setGlobalSearch(""); }}
                        className="flex items-center justify-between px-3 py-2 text-xs font-mono hover:bg-white/5 transition-colors cursor-pointer"
                        data-testid={`search-result-hole-${h.id}`}
                      >
                        <span className="truncate text-white/80">{h.title}</span>
                        <span className="text-[10px] text-muted-foreground ml-2 shrink-0">{h.status}</span>
                      </a>
                    ))}
                  </div>
                )}
                {searchResults.people.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 font-mono text-[10px] text-muted-foreground/50 uppercase tracking-widest border-b border-white/5">People</div>
                    {searchResults.people.slice(0, 5).map((p) => (
                      <a
                        key={`person-${p.id}`}
                        href="/admin/people"
                        onClick={(e) => { e.preventDefault(); navigate("/admin/people"); setSearchOpen(false); setGlobalSearch(""); }}
                        className="flex items-center justify-between px-3 py-2 text-xs font-mono hover:bg-white/5 transition-colors cursor-pointer"
                        data-testid={`search-result-person-${p.id}`}
                      >
                        <span className="truncate text-white/80">{p.fullName}</span>
                        <span className="text-[10px] text-muted-foreground ml-2 shrink-0">@{p.handle}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div ref={createRef} className="relative">
              <button
                onClick={() => setCreateDropdown(!createDropdown)}
                className="flex items-center gap-1 text-muted-foreground hover:text-white font-mono text-xs px-2 py-1.5 border border-white/10 hover:border-white/20 transition-colors"
                data-testid="button-quick-create"
              >
                <Plus className="w-4 h-4" />
              </button>
              {createDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#111418] border border-white/10 z-50" data-testid="dropdown-quick-create">
                  <a
                    href="/admin/people"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/admin/people");
                      setCreateDropdown(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 font-mono text-xs text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                    data-testid="quick-create-person"
                  >
                    <Plus className="w-3 h-3" /> Person
                  </a>
                  <a
                    href="/admin"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/admin");
                      setCreateDropdown(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 font-mono text-xs text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                    data-testid="quick-create-investigation"
                  >
                    <Plus className="w-3 h-3" /> Investigation
                  </a>
                </div>
              )}
            </div>

            <div ref={userRef} className="relative">
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center gap-2 text-muted-foreground hover:text-white font-mono text-xs px-2 py-1.5 border border-white/10 hover:border-white/20 transition-colors"
                data-testid="button-user-dropdown"
              >
                {employee.name}
                <span className="text-[10px] text-primary bg-primary/10 px-1 py-0.5">{role}</span>
              </button>
              {userDropdown && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-[#111418] border border-white/10 z-50" data-testid="dropdown-user">
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="font-mono text-xs text-white">{employee.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{employee.email}</p>
                    <p className="font-mono text-[10px] text-primary mt-1">{role}</p>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setUserDropdown(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 font-mono text-xs text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                    data-testid="button-user-logout"
                  >
                    <LogOut className="w-3 h-3" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside
            className="hidden lg:flex w-56 bg-[#111418] border-r border-white/5 flex-col fixed left-0 top-12 bottom-0 z-30"
            data-testid="admin-sidebar"
          >
            {sidebarContent}
            <div className="border-t border-white/5 p-4 space-y-3">
              <div className="text-xs font-mono text-muted-foreground">
                {employee.name}{" "}
                <span className="text-primary/60">({role})</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-muted-foreground hover:text-white font-mono text-xs transition-colors w-full"
                data-testid="button-sidebar-logout"
              >
                <LogOut className="w-4 h-4" /> LOGOUT
              </button>
            </div>
          </aside>

          {mobileOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                onClick={() => setMobileOpen(false)}
                data-testid="mobile-sidebar-backdrop"
              />
              <aside
                className="fixed left-0 top-12 bottom-0 w-56 bg-[#111418] border-r border-white/5 flex flex-col z-50 lg:hidden"
                data-testid="admin-sidebar-mobile"
              >
                {sidebarContent}
                <div className="border-t border-white/5 p-4 space-y-3">
                  <div className="text-xs font-mono text-muted-foreground">
                    {employee.name}{" "}
                    <span className="text-primary/60">({role})</span>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-2 text-muted-foreground hover:text-white font-mono text-xs transition-colors w-full"
                    data-testid="button-mobile-logout"
                  >
                    <LogOut className="w-4 h-4" /> LOGOUT
                  </button>
                </div>
              </aside>
            </>
          )}

          <div className="flex-1 flex flex-col lg:ml-56 min-h-0">
            <div className="px-8 py-2 border-b border-white/5 flex items-center gap-1" data-testid="admin-breadcrumbs">
              {breadcrumbs.map((crumb, i) => {
                const isLast = i === breadcrumbs.length - 1;
                return (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/50" />}
                    {isLast ? (
                      <span className="font-mono text-xs uppercase text-white" data-testid={`breadcrumb-${crumb.label.toLowerCase()}`}>
                        {crumb.label}
                      </span>
                    ) : (
                      <a
                        href={crumb.href}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(crumb.href);
                        }}
                        className="font-mono text-xs uppercase text-muted-foreground hover:text-white transition-colors cursor-pointer"
                        data-testid={`breadcrumb-${crumb.label.toLowerCase()}`}
                      >
                        {crumb.label}
                      </a>
                    )}
                  </span>
                );
              })}
            </div>

            <main className="flex-1 overflow-y-auto" data-testid="admin-main-content">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
