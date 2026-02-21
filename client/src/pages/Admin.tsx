import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Plus, Trash2, Edit3, Save, X, Lock, LogOut, Shield, GripVertical, Image, Link2, History, Download, Upload, AlertTriangle, CheckCircle2, Clock, Settings, Users, Eye, EyeOff, RotateCcw, UserCheck, UserX, FileText, Headphones, DollarSign, Pin, ArrowUp, ArrowDown, Search, LayoutDashboard, Maximize2, Minimize2, PanelRightClose, PanelRightOpen, BookOpen, ArrowLeft, ChevronRight, Calendar } from "lucide-react";
import type { RabbitHole, DepthNode, Claim, Source, Category, Media, AuditLog, Employee, Podcast, PodcastEpisode, RabbitHolePodcastEpisode, SponsoredPodcastSlot } from "@shared/schema";

type AdminEmployee = Omit<Employee, "passwordHash">;

function adminFetch(url: string, opts?: RequestInit) {
  return fetch(url, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...opts?.headers,
    },
  });
}

function adminQueryFetch(url: string) {
  const sep = url.includes("?") ? "&" : "?";
  return fetch(`${url}${sep}admin=true`, { credentials: "include" }).then(r => {
    if (!r.ok) throw new Error("Unauthorized");
    return r.json();
  });
}

type Tab = "dashboard" | "holes" | "podcasts" | "tools" | "history" | "employees";

function ValidationPanel() {
  const [selectedHoleId, setSelectedHoleId] = useState<number | null>(null);

  const { data: holes = [] } = useQuery<RabbitHole[]>({
    queryKey: ["/api/holes?admin=true"],
    queryFn: () => adminQueryFetch("/api/holes"),
  });

  const selectedSlug = holes.find(h => h.id === selectedHoleId)?.slug;
  const selectedHole = holes.find(h => h.id === selectedHoleId);

  const { data: nodes = [] } = useQuery<DepthNode[]>({
    queryKey: [`/api/holes/${selectedSlug}/depth-nodes`],
    enabled: !!selectedSlug,
  });

  const { data: claims = [] } = useQuery<Claim[]>({
    queryKey: [`/api/holes/${selectedSlug}/claims`],
    enabled: !!selectedSlug,
  });

  const { data: sources = [] } = useQuery<Source[]>({
    queryKey: [`/api/holes/${selectedSlug}/sources`],
    enabled: !!selectedSlug,
  });

  const hasTitle = !!selectedHole?.title?.trim();
  const hasSummary = !!selectedHole?.summary?.trim();
  const hasNodes = nodes.length > 0;
  const hasClaims = claims.length > 0;
  const hasSources = sources.length > 0;
  const allPassed = hasTitle && hasSummary && hasNodes && hasClaims && hasSources;

  const completion = selectedHole?.completion ?? 0;

  const totalWords = nodes.reduce((acc, n) => acc + (n.content?.split(/\s+/).length || 0), 0);
  const readTimeMinutes = Math.max(1, Math.ceil(totalWords / 200));

  const checks = [
    { label: "HAS TITLE", passed: hasTitle },
    { label: "HAS SUMMARY", passed: hasSummary },
    { label: "HAS DEPTH NODES", passed: hasNodes },
    { label: "HAS CLAIMS", passed: hasClaims },
    { label: "HAS SOURCES", passed: hasSources },
  ];

  return (
    <div data-testid="admin-validation-panel" className="h-full overflow-y-auto p-4 space-y-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-primary" />
        <h2 className="font-mono text-xs uppercase tracking-wider">VALIDATION</h2>
      </div>
      <div>
        <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">SELECT HOLE</label>
        <select
          value={selectedHoleId || ""}
          onChange={e => setSelectedHoleId(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full border border-white/10 p-2 text-xs font-mono focus:outline-none focus:border-primary/50 bg-[fffff0]"
          data-testid="select-validation-hole"
        >
          <option value="">Select Rabbit Hole...</option>
          {holes.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
        </select>
      </div>
      {selectedHoleId && (
        <>
          <div>
            <h3 className="font-mono text-[10px] text-muted-foreground uppercase mb-2">PUBLISH READINESS</h3>
            <div className="space-y-1.5">
              {checks.map(c => (
                <div key={c.label} className="flex items-center gap-2">
                  {c.passed ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-500" />}
                  <span className={`font-mono text-[10px] ${c.passed ? "text-muted-foreground" : "text-red-400"}`}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-mono text-[10px] text-muted-foreground uppercase mb-2">DEPTH METER</h3>
            <div className="w-full h-2 bg-white/5 border border-white/10">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground mt-1 block">{completion}% COMPLETE</span>
          </div>

          <div>
            <h3 className="font-mono text-[10px] text-muted-foreground uppercase mb-1">ESTIMATED READ TIME</h3>
            <div className="flex items-center gap-2">
              <BookOpen className="w-3 h-3 text-primary" />
              <span className="font-mono text-sm">{readTimeMinutes} MIN</span>
              <span className="font-mono text-[10px] text-muted-foreground">({totalWords} words)</span>
            </div>
          </div>

          <div className={`p-3 border ${allPassed ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
            <div className="flex items-center gap-2">
              {allPassed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
              <span className={`font-mono text-xs font-bold ${allPassed ? "text-green-500" : "text-red-500"}`}>
                {allPassed ? "READY TO PUBLISH" : "NOT READY"}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const NAV_SECTIONS: { group: string; items: { id: Tab; label: string; icon: typeof Shield }[] }[] = [
  {
    group: "EDITORIAL",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "holes", label: "Investigations", icon: Search },
    ],
  },
  {
    group: "CONTENT",
    items: [
      { id: "podcasts", label: "Podcasts", icon: Headphones },
    ],
  },
  {
    group: "SYSTEM",
    items: [
      { id: "history", label: "History", icon: History },
      { id: "tools", label: "Tools", icon: Settings },
      { id: "employees", label: "Employees", icon: Users },
    ],
  },
];

export default function Admin() {
  const [employee, setEmployee] = useState<AdminEmployee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [focusMode, setFocusMode] = useState(false);
  const [showValidation, setShowValidation] = useState(true);
  const [editingHoleId, setEditingHoleId] = useState<number | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setEmployee(data); })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setFocusMode(prev => !prev);
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement) && !(e.target instanceof HTMLSelectElement)) {
        e.preventDefault();
        const searchInput = document.querySelector('[data-testid="input-dash-search"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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

  const { data: adminHoles = [] } = useQuery<RabbitHole[]>({
    queryKey: ["/api/holes?admin=true"],
    queryFn: () => adminQueryFetch("/api/holes"),
    enabled: !!employee,
  });
  const editingHole = adminHoles.find(h => h.id === editingHoleId);
  const editingHoleSlug = editingHole?.slug;

  const { data: editingNodes = [] } = useQuery<DepthNode[]>({
    queryKey: [`/api/holes/${editingHoleSlug}/depth-nodes`],
    enabled: !!editingHoleSlug && !!employee,
  });

  const [createNodeError, setCreateNodeError] = useState<string | null>(null);
  const createNodeMutation = useMutation({
    mutationFn: async (data: any) => {
      setCreateNodeError(null);
      const res = await adminFetch("/api/admin/depth-nodes", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to create node" }));
        throw new Error(err.message || "Failed to create node");
      }
      return res.json();
    },
    onSuccess: async (newNode: any) => {
      await queryClient.refetchQueries({ queryKey: [`/api/holes/${editingHoleSlug}/depth-nodes`] });
      if (newNode?.id) setEditingNodeId(newNode.id);
    },
    onError: (err: Error) => {
      setCreateNodeError(err.message || "Failed to create node");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full bg-white/5 border border-white/10 p-3 text-sm font-mono mb-3 focus:outline-none focus:border-primary/50"
            data-testid="input-admin-email"
          />
          <div className="relative mb-3">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="Password"
              className="w-full bg-white/5 border border-white/10 p-3 pr-10 text-sm font-mono focus:outline-none focus:border-primary/50"
              data-testid="input-admin-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {loginError && <p className="text-xs text-red-500 font-mono mb-3" data-testid="text-admin-login-error">{loginError}</p>}
          <button onClick={handleLogin} className="w-full bg-primary/10 border border-primary/30 text-primary font-mono text-xs uppercase py-2.5 hover:bg-primary/20 transition-colors" data-testid="button-admin-login">
            AUTHENTICATE
          </button>
        </div>
      </div>
    );
  }

  const role = employee.role as "Admin" | "Editor" | "Moderator";
  const canEditContent = role === "Admin" || role === "Editor";
  const isAdmin = role === "Admin";

  const tabs: { id: Tab; label: string; visible: boolean }[] = [
    { id: "dashboard", label: "Dashboard", visible: canEditContent },
    { id: "holes", label: "Investigations", visible: canEditContent },
    { id: "podcasts", label: "Podcasts", visible: canEditContent },
    { id: "history", label: "History", visible: canEditContent },
    { id: "tools", label: "Tools", visible: isAdmin },
    { id: "employees", label: "Employees", visible: isAdmin },
  ];

  const visibleTabs = tabs.filter(t => t.visible);

  if (!visibleTabs.find(t => t.id === activeTab)) {
    if (visibleTabs.length > 0 && activeTab !== visibleTabs[0].id) {
      setActiveTab(visibleTabs[0].id);
    }
  }

  return (
    <div className="min-h-screen flex" data-testid="page-admin">
      <aside
        data-testid="admin-sidebar"
        className={`w-56 bg-[#0a0a0a] border-r border-white/5 flex flex-col fixed top-0 left-0 h-screen z-30 transition-transform duration-300 ${focusMode ? "-translate-x-full" : "translate-x-0"}`}
      >
        <div className="p-4 flex items-center gap-3 border-b border-white/5">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="font-display text-xl font-bold uppercase tracking-wider">Admin CMS</h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {editingHoleId ? (
            <div>
              <button
                onClick={() => { setEditingHoleId(null); setEditingNodeId(null); }}
                className="flex items-center gap-2 px-4 py-3 text-muted-foreground hover:text-white font-mono text-xs border-b border-white/5 w-full"
                data-testid="button-back-to-cms"
              >
                <ArrowLeft className="w-4 h-4" /> BACK TO CMS
              </button>
              <div className="px-4 py-3 border-b border-white/5">
                <p className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-1">INVESTIGATION</p>
                <p className="font-mono text-xs text-white truncate">{editingHole?.title}</p>
              </div>
              <div className="px-4 py-2">
                <span className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-widest">NODES</span>
              </div>
              {editingNodes.sort((a, b) => a.position - b.position).map(node => (
                <button
                  key={node.id}
                  onClick={() => setEditingNodeId(node.id)}
                  className={`w-full text-left px-4 py-3 font-mono text-xs border-l-2 transition-colors ${editingNodeId === node.id ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-white"}`}
                  data-testid={`node-sidebar-item-${node.id}`}
                >
                  <span className="text-primary/60 mr-2">#{node.position}</span>
                  {node.title}
                </button>
              ))}
              <button
                onClick={() => { if (!createNodeMutation.isPending) createNodeMutation.mutate({ holeId: editingHoleId, title: "New Node", summary: "", content: "", position: editingNodes.length + 1, status: "unlocked", branchLinks: [], timeline: [] }); }}
                disabled={createNodeMutation.isPending}
                className="w-full flex items-center gap-2 px-4 py-3 font-mono text-xs text-primary/60 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-add-node-sidebar"
              >
                {createNodeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} ADD NODE
              </button>
              {createNodeError && <p className="px-4 py-1 font-mono text-[10px] text-red-500">{createNodeError}</p>}
            </div>
          ) : (
            NAV_SECTIONS.map(section => {
              const sectionItems = section.items.filter(item => visibleTabs.some(t => t.id === item.id));
              if (sectionItems.length === 0) return null;
              return (
                <div key={section.group} className="mb-2">
                  <div className="px-4 py-2">
                    <span className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-widest">{section.group}</span>
                  </div>
                  {sectionItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 font-mono text-xs uppercase transition-colors border-l-2 ${isActive ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-white"}`}
                        data-testid={`admin-tab-${item.id}`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </nav>

        <div className="border-t border-white/5 p-4 space-y-3">
          <div className="text-xs font-mono text-muted-foreground">
            {employee.name} <span className="text-primary/60">({role})</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-muted-foreground hover:text-white font-mono text-xs transition-colors w-full" data-testid="button-admin-logout">
            <LogOut className="w-4 h-4" /> LOGOUT
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${focusMode ? "ml-0" : "ml-56"}`}>
        <div className="border-b border-white/5 bg-background/50 backdrop-blur-sm p-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFocusMode(!focusMode)}
              className="flex items-center gap-2 text-muted-foreground hover:text-white font-mono text-xs transition-colors px-2 py-1.5 border border-white/10 hover:border-white/20"
              data-testid="button-toggle-focus"
            >
              {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              {focusMode ? "EXIT FOCUS" : "FOCUS MODE"}
            </button>
          </div>
          <button
            onClick={() => setShowValidation(!showValidation)}
            className="flex items-center gap-2 text-muted-foreground hover:text-white font-mono text-xs transition-colors px-2 py-1.5 border border-white/10 hover:border-white/20"
            data-testid="button-toggle-validation"
          >
            {showValidation ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            VALIDATION
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div data-testid="admin-main-content" className="flex-1 overflow-y-auto mil-grid">
            <div className="container mx-auto px-8 py-6">
              {editingHoleId ? (
                editingNodeId && editingHoleSlug ? (
                  <NodeEditor nodeId={editingNodeId} holeId={editingHoleId} holeSlug={editingHoleSlug} />
                ) : (
                  <InvestigationOverview holeId={editingHoleId} holes={adminHoles} nodes={editingNodes} onSelectNode={setEditingNodeId} onAddNode={() => { if (!createNodeMutation.isPending) createNodeMutation.mutate({ holeId: editingHoleId, title: "New Node", summary: "", content: "", position: editingNodes.length + 1, status: "unlocked", branchLinks: [], timeline: [] }); }} isAddingNode={createNodeMutation.isPending} />
                )
              ) : (
                <>
                  {activeTab === "dashboard" && <EditorialDashboard role={role} />}
                  {activeTab === "holes" && <HolesManager role={role} onEditInvestigation={(id) => { setEditingHoleId(id); setEditingNodeId(null); }} />}
                  {activeTab === "podcasts" && <PodcastsManager role={role} />}
                  {activeTab === "history" && <HistoryPanel />}
                  {activeTab === "tools" && <ToolsPanel />}
                  {activeTab === "employees" && <EmployeesManager />}
                </>
              )}
            </div>
          </div>

          {showValidation && !focusMode && (
            <div className="w-72 border-l border-white/5 bg-[#0a0a0a] flex-shrink-0 overflow-hidden">
              {editingNodeId && editingHoleSlug ? (
                <NodeValidationPanel nodeId={editingNodeId} holeId={editingHoleId!} holeSlug={editingHoleSlug} />
              ) : (
                <ValidationPanel />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">{children} {required && <span className="text-primary">*</span>}</label>;
}

function FormInput({ label, required, ...props }: { label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <div><FieldLabel required={required}>{label}</FieldLabel><input {...props} className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50" /></div>;
}

function FormSelect({ label, required, children, ...props }: { label: string; required?: boolean; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <div><FieldLabel required={required}>{label}</FieldLabel><select {...props} className="w-full border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50">{children}</select></div>;
}

function FormTextarea({ label, required, ...props }: { label: string; required?: boolean } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <div><FieldLabel required={required}>{label}</FieldLabel><textarea {...props} className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50 resize-none" /></div>;
}

function LabelsEditor({ value, onChange }: { value: string[]; onChange: (labels: string[]) => void }) {
  const options = ["Verified", "Disputed", "Speculative", "Archived"];
  return (
    <div>
      <FieldLabel>Labels</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const active = value.includes(opt);
          return (
            <button key={opt} type="button" onClick={() => onChange(active ? value.filter(l => l !== opt) : [...value, opt])}
              className={`px-3 py-1.5 text-xs font-mono border transition-colors ${active ? "border-primary text-primary bg-primary/10" : "border-white/10 text-muted-foreground hover:text-white hover:border-white/20"}`}
              data-testid={`label-toggle-${opt.toLowerCase()}`}
            >{opt.toUpperCase()}</button>
          );
        })}
      </div>
    </div>
  );
}

function ConnectionsSelector({ value, onChange, holes, currentSlug }: { value: string[]; onChange: (slugs: string[]) => void; holes: RabbitHole[]; currentSlug?: string }) {
  const available = holes.filter(h => h.slug !== currentSlug);
  return (
    <div>
      <FieldLabel>Connected Rabbit Holes</FieldLabel>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {available.map(h => {
          const active = value.includes(h.slug);
          return (
            <label key={h.slug} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={active} onChange={() => onChange(active ? value.filter(s => s !== h.slug) : [...value, h.slug])} className="accent-primary" />
              <span className={`text-sm font-mono ${active ? "text-primary" : "text-muted-foreground group-hover:text-white"}`}>{h.title}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ValidationErrors({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return <div className="bg-red-500/10 border border-red-500/20 p-3 mb-4">{errors.map((e, i) => <p key={i} className="text-xs font-mono text-red-500">{e}</p>)}</div>;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Draft: "text-gray-400 bg-gray-500/10 border-gray-500/20",
    Review: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    Published: "text-green-500 bg-green-500/10 border-green-500/20",
  };
  return <span className={`font-mono text-[10px] px-1.5 py-0.5 border ${colors[status] || "text-muted-foreground bg-white/5 border-white/10"}`}>{status.toUpperCase()}</span>;
}

function HolesManager({ role, onEditInvestigation }: { role: string; onEditInvestigation: (holeId: number) => void }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [showCreate, setShowCreate] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showHistoryId, setShowHistoryId] = useState<number | null>(null);

  const { data: holes = [], isLoading } = useQuery<RabbitHole[]>({
    queryKey: ["/api/holes?admin=true"],
    queryFn: () => adminQueryFetch("/api/holes"),
  });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const filteredHoles = holes.filter(h => statusFilter === "all" || h.status === statusFilter);

  const validateHole = (data: any): string[] => {
    const errs: string[] = [];
    if (!data.title?.trim()) errs.push("Title is required");
    if (!data.slug?.trim()) errs.push("Slug is required");
    if (!data.summary?.trim()) errs.push("Summary is required");
    if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) errs.push("Slug must be lowercase letters, numbers, and hyphens only");
    return errs;
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/holes", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Failed"); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/holes?admin=true"] }); setShowCreate(false); setFormData({}); setErrors([]); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await adminFetch(`/api/admin/holes/${id}`, { method: "PUT", body: JSON.stringify(data) });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message || "Failed");
      }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/holes?admin=true"] }); setEditingId(null); setErrors([]); },
    onError: (err: Error) => { setErrors([err.message]); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/holes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/holes?admin=true"] }),
  });

  const handleCreate = () => {
    const errs = validateHole(formData);
    if (errs.length) { setErrors(errs); return; }
    createMutation.mutate(formData);
  };

  const handleUpdate = (id: number) => {
    const errs = validateHole(formData);
    if (errs.length) { setErrors(errs); return; }
    updateMutation.mutate({ id, data: formData });
  };

  const newHoleDefaults = { title: "", slug: "", summary: "", status: "Draft", completion: 0, isSpecialist: false, connections: 0, sourceCount: 0, categorySlug: "", labels: [], connectedSlugs: [], timeline: [] };

  if (isLoading) return <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h2 className="font-mono text-sm text-muted-foreground">{filteredHoles.length} RABBIT HOLES</h2>
          <div className="flex gap-1">
            {["all", "Draft", "Review", "Published"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2 py-1 font-mono text-[10px] border transition-colors ${statusFilter === s ? "border-primary text-primary bg-primary/10" : "border-white/10 text-muted-foreground hover:text-white"}`}
                data-testid={`filter-status-${s.toLowerCase()}`}
              >{s.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <button onClick={() => { setShowCreate(true); setFormData(newHoleDefaults); setErrors([]); }}
          className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors" data-testid="button-create-hole">
          <Plus className="w-4 h-4" /> NEW HOLE
        </button>
      </div>

      {showCreate && (
        <div className="border border-primary/20 bg-primary/[0.02] p-6 mb-6" data-testid="form-create-hole">
          <h3 className="font-mono text-xs text-primary uppercase mb-4">CREATE NEW RABBIT HOLE</h3>
          <ValidationErrors errors={errors} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormInput label="Title" required placeholder="Investigation title" value={formData.title || ""} onChange={e => setFormData({ ...formData, title: (e.target as HTMLInputElement).value })} data-testid="input-hole-title" />
            <FormInput label="Slug" required placeholder="url-friendly-slug" value={formData.slug || ""} onChange={e => setFormData({ ...formData, slug: (e.target as HTMLInputElement).value })} data-testid="input-hole-slug" />
            <FormSelect label="Status" required value={formData.status || "Draft"} onChange={e => setFormData({ ...formData, status: (e.target as HTMLSelectElement).value })}>
              <option value="Draft">Draft</option><option value="Review">Review</option><option value="Published">Published</option>
            </FormSelect>
            <FormSelect label="Category" value={formData.categorySlug || ""} onChange={e => setFormData({ ...formData, categorySlug: (e.target as HTMLSelectElement).value })}>
              <option value="">No Category</option>
              {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </FormSelect>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm font-mono text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={formData.isSpecialist || false} onChange={e => setFormData({ ...formData, isSpecialist: (e.target as HTMLInputElement).checked })} className="accent-primary" /> Specialist Intel
              </label>
              <FormInput label="Completion %" type="number" min={0} max={100} value={formData.completion || 0} onChange={e => setFormData({ ...formData, completion: parseInt((e.target as HTMLInputElement).value) || 0 })} />
            </div>
          </div>
          <div className="mb-4">
            <FormTextarea label="Summary" required placeholder="Brief description" value={formData.summary || ""} onChange={e => setFormData({ ...formData, summary: (e.target as HTMLTextAreaElement).value })} rows={3} data-testid="input-hole-summary" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <LabelsEditor value={formData.labels || []} onChange={labels => setFormData({ ...formData, labels })} />
            <ConnectionsSelector value={formData.connectedSlugs || []} onChange={connectedSlugs => setFormData({ ...formData, connectedSlugs })} holes={holes} currentSlug={formData.slug} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={createMutation.isPending} className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors flex items-center gap-2 disabled:opacity-50" data-testid="button-save-hole">
              {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} SAVE
            </button>
            <button onClick={() => { setShowCreate(false); setErrors([]); }} className="bg-white/5 border border-white/10 text-muted-foreground px-4 py-2 font-mono text-xs hover:text-white transition-colors flex items-center gap-2"><X className="w-3 h-3" /> CANCEL</button>
          </div>
        </div>
      )}

      {showHistoryId && <HoleHistory holeId={showHistoryId} onClose={() => setShowHistoryId(null)} />}

      <div className="space-y-2">
        {filteredHoles.map(hole => (
          <div key={hole.id} className="border border-white/10 p-4 hover:border-white/20 transition-colors" data-testid={`admin-hole-${hole.id}`}>
            {editingId === hole.id ? (
              <div>
                <ValidationErrors errors={errors} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <FormInput label="Title" required value={formData.title || ""} onChange={e => setFormData({ ...formData, title: (e.target as HTMLInputElement).value })} />
                  <FormSelect label="Status" value={formData.status || "Draft"} onChange={e => setFormData({ ...formData, status: (e.target as HTMLSelectElement).value })}>
                    <option value="Draft">Draft</option><option value="Review">Review</option><option value="Published">Published</option>
                  </FormSelect>
                  <FormSelect label="Category" value={formData.categorySlug || ""} onChange={e => setFormData({ ...formData, categorySlug: (e.target as HTMLSelectElement).value })}>
                    <option value="">No Category</option>{categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </FormSelect>
                  <FormInput label="Completion %" type="number" min={0} max={100} value={formData.completion || 0} onChange={e => setFormData({ ...formData, completion: parseInt((e.target as HTMLInputElement).value) || 0 })} />
                </div>
                <div className="mb-3"><FormTextarea label="Summary" required value={formData.summary || ""} onChange={e => setFormData({ ...formData, summary: (e.target as HTMLTextAreaElement).value })} rows={2} /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <LabelsEditor value={formData.labels || []} onChange={labels => setFormData({ ...formData, labels })} />
                  <ConnectionsSelector value={formData.connectedSlugs || []} onChange={connectedSlugs => setFormData({ ...formData, connectedSlugs })} holes={holes} currentSlug={hole.slug} />
                </div>
                <label className="flex items-center gap-2 text-sm font-mono text-muted-foreground cursor-pointer mb-3">
                  <input type="checkbox" checked={formData.isSpecialist || false} onChange={e => setFormData({ ...formData, isSpecialist: (e.target as HTMLInputElement).checked })} className="accent-primary" /> Specialist
                </label>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(hole.id)} disabled={updateMutation.isPending} className="text-primary font-mono text-xs flex items-center gap-1"><Save className="w-3 h-3" /> SAVE</button>
                  <button onClick={() => { setEditingId(null); setErrors([]); }} className="text-muted-foreground font-mono text-xs flex items-center gap-1"><X className="w-3 h-3" /> CANCEL</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs text-primary">#{hole.id}</span>
                    <h3 className="font-display font-bold truncate">{hole.title}</h3>
                    <StatusBadge status={hole.status} />
                    {hole.isSpecialist && <span className="font-mono text-[10px] px-1.5 py-0.5 text-red-500 bg-red-500/10 border border-red-500/20">SPECIALIST</span>}
                    {(hole.labels as string[])?.map(l => <span key={l} className="font-mono text-[10px] px-1.5 py-0.5 text-muted-foreground bg-white/5">{l}</span>)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{hole.summary}</p>
                  {(hole.connectedSlugs as string[])?.length > 0 && (
                    <div className="flex items-center gap-1 mt-1"><Link2 className="w-3 h-3 text-muted-foreground/50" /><span className="text-[10px] text-muted-foreground/50 font-mono">{(hole.connectedSlugs as string[]).join(", ")}</span></div>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <button onClick={() => onEditInvestigation(hole.id)} className="px-3 py-1.5 text-[10px] font-mono uppercase border border-primary/30 text-primary hover:bg-primary/10 transition-colors" data-testid={`button-edit-investigation-${hole.id}`}>EDIT NODES</button>
                  <button onClick={() => setShowHistoryId(hole.id)} className="text-muted-foreground hover:text-white p-1 transition-colors" title="View History"><History className="w-4 h-4" /></button>
                  <button onClick={() => { setEditingId(hole.id); setFormData({ title: hole.title, slug: hole.slug, summary: hole.summary, status: hole.status, categorySlug: hole.categorySlug, completion: hole.completion, isSpecialist: hole.isSpecialist, labels: hole.labels || [], connectedSlugs: hole.connectedSlugs || [] }); setErrors([]); }} className="text-muted-foreground hover:text-white p-1 transition-colors" data-testid={`button-edit-hole-${hole.id}`}><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm("Delete this rabbit hole and all its data?")) deleteMutation.mutate(hole.id); }} className="text-muted-foreground hover:text-red-500 p-1 transition-colors" data-testid={`button-delete-hole-${hole.id}`}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HoleHistory({ holeId, onClose }: { holeId: number; onClose: () => void }) {
  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: [`/api/admin/audit-logs?holeId=${holeId}`],
    queryFn: () => adminFetch(`/api/admin/audit-logs?holeId=${holeId}`).then(r => r.json()),
  });

  return (
    <div className="border border-white/10 bg-white/[0.02] p-4 mb-4" data-testid="panel-hole-history">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-xs text-primary uppercase flex items-center gap-2"><History className="w-4 h-4" /> Change History (Hole #{holeId})</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="w-4 h-4" /></button>
      </div>
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : logs.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">No history found.</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {logs.map(log => (
            <div key={log.id} className="flex items-start gap-3 text-xs border-b border-white/5 pb-2">
              <Clock className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-mono ${log.action === "create" ? "text-green-500" : log.action === "delete" ? "text-red-500" : "text-yellow-500"}`}>{log.action.toUpperCase()}</span>
                  <span className="font-mono text-muted-foreground">{log.entityType}</span>
                  <span className="font-mono text-muted-foreground/50">by {log.editorName}</span>
                </div>
                <p className="font-mono text-[10px] text-muted-foreground/50">{new Date(log.createdAt).toLocaleString()}</p>
                {log.changes && Object.keys(log.changes as any).length > 0 && (
                  <pre className="font-mono text-[10px] text-muted-foreground/40 mt-1 truncate">{JSON.stringify(log.changes).slice(0, 120)}</pre>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NodesManager() {
  const [selectedHole, setSelectedHole] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const { data: holes = [] } = useQuery<RabbitHole[]>({
    queryKey: ["/api/holes?admin=true"],
    queryFn: () => adminQueryFetch("/api/holes"),
  });
  const selectedSlug = holes.find(h => h.id === selectedHole)?.slug;
  const { data: nodes = [], isLoading } = useQuery<DepthNode[]>({
    queryKey: [`/api/holes/${selectedSlug}/depth-nodes`],
    enabled: !!selectedSlug,
  });

  const validateNode = (data: any): string[] => {
    const errs: string[] = [];
    if (!data.title?.trim()) errs.push("Title is required");
    if (!data.content?.trim()) errs.push("Content is required");
    return errs;
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const res = await adminFetch("/api/admin/depth-nodes", { method: "POST", body: JSON.stringify(data) }); if (!res.ok) throw new Error("Failed"); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/depth-nodes`] }); setShowCreate(false); setFormData({}); setErrors([]); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => { const res = await adminFetch(`/api/admin/depth-nodes/${id}`, { method: "PUT", body: JSON.stringify(data) }); if (!res.ok) throw new Error("Failed"); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/depth-nodes`] }); setEditingId(null); setErrors([]); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { const res = await adminFetch(`/api/admin/depth-nodes/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed"); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/depth-nodes`] }),
  });

  const handleCreate = () => { const errs = validateNode(formData); if (errs.length) { setErrors(errs); return; } createMutation.mutate(formData); };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <FormSelect label="Select Rabbit Hole" value={selectedHole || ""} onChange={e => setSelectedHole(parseInt((e.target as HTMLSelectElement).value) || null)} data-testid="select-hole-nodes">
          <option value="">Select Rabbit Hole</option>
          {holes.map(h => <option key={h.id} value={h.id}>{h.title} [{h.status}]</option>)}
        </FormSelect>
        {selectedHole && (
          <button onClick={() => { setShowCreate(true); setFormData({ holeId: selectedHole, title: "", summary: "", content: "", position: nodes.length + 1, status: "unlocked", mediaUrl: "", branchLinks: [] }); setErrors([]); }} className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors self-end" data-testid="button-create-node">
            <Plus className="w-4 h-4" /> NEW NODE
          </button>
        )}
      </div>

      {showCreate && (
        <div className="border border-primary/20 bg-primary/[0.02] p-6 mb-6">
          <h3 className="font-mono text-xs text-primary uppercase mb-4">CREATE DEPTH NODE</h3>
          <ValidationErrors errors={errors} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <FormInput label="Title" required value={formData.title || ""} onChange={e => setFormData({ ...formData, title: (e.target as HTMLInputElement).value })} />
            <FormInput label="Position" type="number" value={formData.position || 1} onChange={e => setFormData({ ...formData, position: parseInt((e.target as HTMLInputElement).value) || 1 })} />
            <FormSelect label="Status" value={formData.status || "unlocked"} onChange={e => setFormData({ ...formData, status: (e.target as HTMLSelectElement).value })}><option value="unlocked">Unlocked</option><option value="locked">Locked</option></FormSelect>
          </div>
          <div className="mb-4"><FormInput label="Summary" value={formData.summary || ""} onChange={e => setFormData({ ...formData, summary: (e.target as HTMLInputElement).value })} /></div>
          <div className="mb-4"><FormTextarea label="Content" required value={formData.content || ""} onChange={e => setFormData({ ...formData, content: (e.target as HTMLTextAreaElement).value })} rows={6} /></div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={createMutation.isPending} className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 flex items-center gap-2 disabled:opacity-50"><Save className="w-3 h-3" /> SAVE</button>
            <button onClick={() => { setShowCreate(false); setErrors([]); }} className="bg-white/5 border border-white/10 text-muted-foreground px-4 py-2 font-mono text-xs hover:text-white flex items-center gap-2"><X className="w-3 h-3" /> CANCEL</button>
          </div>
        </div>
      )}

      {!selectedHole ? <p className="font-mono text-sm text-muted-foreground text-center py-12">SELECT A RABBIT HOLE TO MANAGE ITS DEPTH NODES</p> : isLoading ? <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div> : (
        <div className="space-y-2">
          {nodes.map(node => (
            <div key={node.id} className="border border-white/10 p-4 hover:border-white/20 transition-colors" data-testid={`admin-node-${node.id}`}>
              {editingId === node.id ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <FormInput label="Title" required value={formData.title || ""} onChange={e => setFormData({ ...formData, title: (e.target as HTMLInputElement).value })} />
                    <FormInput label="Position" type="number" value={formData.position || 1} onChange={e => setFormData({ ...formData, position: parseInt((e.target as HTMLInputElement).value) || 1 })} />
                    <FormSelect label="Status" value={formData.status || "unlocked"} onChange={e => setFormData({ ...formData, status: (e.target as HTMLSelectElement).value })}><option value="unlocked">Unlocked</option><option value="locked">Locked</option></FormSelect>
                  </div>
                  <div className="mb-3"><FormTextarea label="Content" required value={formData.content || ""} onChange={e => setFormData({ ...formData, content: (e.target as HTMLTextAreaElement).value })} rows={4} /></div>
                  <div className="flex gap-2">
                    <button onClick={() => updateMutation.mutate({ id: node.id, data: formData })} className="text-primary font-mono text-xs flex items-center gap-1"><Save className="w-3 h-3" /> SAVE</button>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground font-mono text-xs flex items-center gap-1"><X className="w-3 h-3" /> CANCEL</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <GripVertical className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
                    <span className="font-mono text-xs text-primary flex-shrink-0">#{node.position}</span>
                    <h3 className="font-display font-bold truncate">{node.title}</h3>
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 flex-shrink-0 ${node.status === "unlocked" ? "text-green-500 bg-green-500/10" : "text-yellow-500 bg-yellow-500/10"}`}>{node.status}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={() => { setEditingId(node.id); setFormData({ title: node.title, content: node.content, summary: node.summary, position: node.position, status: node.status, mediaUrl: node.mediaUrl }); }} className="text-muted-foreground hover:text-white p-1"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm("Delete this node?")) deleteMutation.mutate(node.id); }} className="text-muted-foreground hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClaimsManager() {
  const [selectedHole, setSelectedHole] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const { data: holes = [] } = useQuery<RabbitHole[]>({ queryKey: ["/api/holes?admin=true"], queryFn: () => adminQueryFetch("/api/holes") });
  const selectedSlug = holes.find(h => h.id === selectedHole)?.slug;
  const { data: claimsList = [], isLoading } = useQuery<Claim[]>({ queryKey: [`/api/holes/${selectedSlug}/claims`], enabled: !!selectedSlug });
  const { data: sourcesList = [] } = useQuery<Source[]>({ queryKey: [`/api/holes/${selectedSlug}/sources`], enabled: !!selectedSlug });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const res = await adminFetch("/api/admin/claims", { method: "POST", body: JSON.stringify(data) }); if (!res.ok) throw new Error("Failed"); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/claims`] }); setShowCreate(false); setFormData({}); },
  });
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => { const res = await adminFetch(`/api/admin/claims/${id}`, { method: "PUT", body: JSON.stringify(data) }); if (!res.ok) throw new Error("Failed"); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/claims`] }); setEditingId(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { const res = await adminFetch(`/api/admin/claims/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed"); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/claims`] }),
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <FormSelect label="Select Rabbit Hole" value={selectedHole || ""} onChange={e => setSelectedHole(parseInt((e.target as HTMLSelectElement).value) || null)}>
          <option value="">Select Rabbit Hole</option>
          {holes.map(h => <option key={h.id} value={h.id}>{h.title} [{h.status}]</option>)}
        </FormSelect>
        {selectedHole && (
          <button onClick={() => { setShowCreate(true); setFormData({ holeId: selectedHole, statement: "", stance: "Verified", confidence: 50, evidence: [], counterpoints: [] }); }} className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 self-end">
            <Plus className="w-4 h-4" /> NEW CLAIM
          </button>
        )}
      </div>

      {showCreate && (
        <div className="border border-primary/20 bg-primary/[0.02] p-6 mb-6">
          <h3 className="font-mono text-xs text-primary uppercase mb-4">CREATE CLAIM</h3>
          <div className="mb-4"><FormTextarea label="Statement" required value={formData.statement || ""} onChange={e => setFormData({ ...formData, statement: (e.target as HTMLTextAreaElement).value })} rows={2} /></div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <FormSelect label="Stance" value={formData.stance || "Verified"} onChange={e => setFormData({ ...formData, stance: (e.target as HTMLSelectElement).value })}><option value="Verified">Verified</option><option value="Disputed">Disputed</option><option value="Speculative">Speculative</option></FormSelect>
            <FormInput label="Confidence %" type="number" min={0} max={100} value={formData.confidence || 50} onChange={e => setFormData({ ...formData, confidence: parseInt((e.target as HTMLInputElement).value) || 0 })} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { if (!formData.statement?.trim()) { setErrors(["Statement is required"]); return; } createMutation.mutate(formData); }} disabled={createMutation.isPending} className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs flex items-center gap-2 disabled:opacity-50"><Save className="w-3 h-3" /> SAVE</button>
            <button onClick={() => setShowCreate(false)} className="bg-white/5 border border-white/10 text-muted-foreground px-4 py-2 font-mono text-xs flex items-center gap-2"><X className="w-3 h-3" /> CANCEL</button>
          </div>
        </div>
      )}

      {!selectedHole ? <p className="font-mono text-sm text-muted-foreground text-center py-12">SELECT A RABBIT HOLE TO MANAGE ITS CLAIMS</p> : isLoading ? <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div> : (
        <div className="space-y-2">
          {claimsList.map(claim => (
            <div key={claim.id} className="border border-white/10 p-4 hover:border-white/20" data-testid={`admin-claim-${claim.id}`}>
              {editingId === claim.id ? (
                <div>
                  <div className="mb-3"><FormTextarea label="Statement" value={formData.statement || ""} onChange={e => setFormData({ ...formData, statement: (e.target as HTMLTextAreaElement).value })} rows={2} /></div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <FormSelect label="Stance" value={formData.stance || "Verified"} onChange={e => setFormData({ ...formData, stance: (e.target as HTMLSelectElement).value })}><option value="Verified">Verified</option><option value="Disputed">Disputed</option><option value="Speculative">Speculative</option></FormSelect>
                    <FormInput label="Confidence %" type="number" min={0} max={100} value={formData.confidence || 50} onChange={e => setFormData({ ...formData, confidence: parseInt((e.target as HTMLInputElement).value) || 0 })} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateMutation.mutate({ id: claim.id, data: formData })} className="text-primary font-mono text-xs flex items-center gap-1"><Save className="w-3 h-3" /> SAVE</button>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground font-mono text-xs flex items-center gap-1"><X className="w-3 h-3" /> CANCEL</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold mb-1 truncate">{claim.statement}</p>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 ${claim.stance === "Verified" ? "text-green-500 bg-green-500/10" : claim.stance === "Disputed" ? "text-yellow-500 bg-yellow-500/10" : "text-orange-500 bg-orange-500/10"}`}>{claim.stance}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{claim.confidence}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={() => { setEditingId(claim.id); setFormData({ statement: claim.statement, stance: claim.stance, confidence: claim.confidence }); }} className="text-muted-foreground hover:text-white p-1"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(claim.id); }} className="text-muted-foreground hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SourcesManager() {
  const [selectedHole, setSelectedHole] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: holes = [] } = useQuery<RabbitHole[]>({ queryKey: ["/api/holes?admin=true"], queryFn: () => adminQueryFetch("/api/holes") });
  const selectedSlug = holes.find(h => h.id === selectedHole)?.slug;
  const { data: sourcesList = [], isLoading } = useQuery<Source[]>({ queryKey: [`/api/holes/${selectedSlug}/sources`], enabled: !!selectedSlug });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const res = await adminFetch("/api/admin/sources", { method: "POST", body: JSON.stringify(data) }); if (!res.ok) throw new Error("Failed"); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/sources`] }); setShowCreate(false); setFormData({}); },
  });
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => { const res = await adminFetch(`/api/admin/sources/${id}`, { method: "PUT", body: JSON.stringify(data) }); if (!res.ok) throw new Error("Failed"); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/sources`] }); setEditingId(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { const res = await adminFetch(`/api/admin/sources/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed"); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/sources`] }),
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <FormSelect label="Select Rabbit Hole" value={selectedHole || ""} onChange={e => setSelectedHole(parseInt((e.target as HTMLSelectElement).value) || null)}>
          <option value="">Select Rabbit Hole</option>
          {holes.map(h => <option key={h.id} value={h.id}>{h.title} [{h.status}]</option>)}
        </FormSelect>
        {selectedHole && (
          <button onClick={() => { setShowCreate(true); setFormData({ holeId: selectedHole, title: "", author: "", origin: "", publishedDate: "", url: "", summary: "", type: "document", stanceTag: "neutral", credibility: 50 }); }} className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 self-end">
            <Plus className="w-4 h-4" /> NEW SOURCE
          </button>
        )}
      </div>

      {showCreate && (
        <div className="border border-primary/20 bg-primary/[0.02] p-6 mb-6">
          <h3 className="font-mono text-xs text-primary uppercase mb-4">CREATE SOURCE</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormInput label="Title" required value={formData.title || ""} onChange={e => setFormData({ ...formData, title: (e.target as HTMLInputElement).value })} />
            <FormInput label="Author" value={formData.author || ""} onChange={e => setFormData({ ...formData, author: (e.target as HTMLInputElement).value })} />
            <FormSelect label="Type" value={formData.type || "document"} onChange={e => setFormData({ ...formData, type: (e.target as HTMLSelectElement).value })}><option value="document">Document</option><option value="book">Book</option><option value="article">Article</option><option value="report">Report</option><option value="testimony">Testimony</option></FormSelect>
            <FormInput label="Credibility %" type="number" min={0} max={100} value={formData.credibility || 50} onChange={e => setFormData({ ...formData, credibility: parseInt((e.target as HTMLInputElement).value) || 0 })} />
          </div>
          <div className="mb-4"><FormTextarea label="Summary" value={formData.summary || ""} onChange={e => setFormData({ ...formData, summary: (e.target as HTMLTextAreaElement).value })} rows={2} /></div>
          <div className="flex gap-2">
            <button onClick={() => { if (!formData.title?.trim()) return; createMutation.mutate(formData); }} disabled={createMutation.isPending} className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs flex items-center gap-2 disabled:opacity-50"><Save className="w-3 h-3" /> SAVE</button>
            <button onClick={() => setShowCreate(false)} className="bg-white/5 border border-white/10 text-muted-foreground px-4 py-2 font-mono text-xs flex items-center gap-2"><X className="w-3 h-3" /> CANCEL</button>
          </div>
        </div>
      )}

      {!selectedHole ? <p className="font-mono text-sm text-muted-foreground text-center py-12">SELECT A RABBIT HOLE TO MANAGE ITS SOURCES</p> : isLoading ? <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div> : (
        <div className="space-y-2">
          {sourcesList.map(source => (
            <div key={source.id} className="border border-white/10 p-4 hover:border-white/20" data-testid={`admin-source-${source.id}`}>
              {editingId === source.id ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <FormInput label="Title" value={formData.title || ""} onChange={e => setFormData({ ...formData, title: (e.target as HTMLInputElement).value })} />
                    <FormInput label="Credibility %" type="number" min={0} max={100} value={formData.credibility || 50} onChange={e => setFormData({ ...formData, credibility: parseInt((e.target as HTMLInputElement).value) || 0 })} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateMutation.mutate({ id: source.id, data: formData })} className="text-primary font-mono text-xs flex items-center gap-1"><Save className="w-3 h-3" /> SAVE</button>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground font-mono text-xs flex items-center gap-1"><X className="w-3 h-3" /> CANCEL</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 text-muted-foreground bg-white/5">{source.type}</span>
                      <h3 className="font-display font-bold truncate">{source.title}</h3>
                      <span className={`font-mono text-[10px] ${source.credibility >= 80 ? "text-green-500" : source.credibility >= 50 ? "text-yellow-500" : "text-orange-500"}`}>{source.credibility}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={() => { setEditingId(source.id); setFormData({ title: source.title, author: source.author, credibility: source.credibility, summary: source.summary }); }} className="text-muted-foreground hover:text-white p-1"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(source.id); }} className="text-muted-foreground hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MediaManager() {
  const [selectedHole, setSelectedHole] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: holes = [] } = useQuery<RabbitHole[]>({ queryKey: ["/api/holes?admin=true"], queryFn: () => adminQueryFetch("/api/holes") });
  const selectedSlug = holes.find(h => h.id === selectedHole)?.slug;
  const { data: mediaList = [], isLoading } = useQuery<Media[]>({ queryKey: [`/api/holes/${selectedSlug}/media`], enabled: !!selectedSlug });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const res = await adminFetch("/api/admin/media", { method: "POST", body: JSON.stringify(data) }); if (!res.ok) throw new Error("Failed"); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/media`] }); setShowCreate(false); setFormData({}); },
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { const res = await adminFetch(`/api/admin/media/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed"); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/media`] }),
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <FormSelect label="Select Rabbit Hole" value={selectedHole || ""} onChange={e => setSelectedHole(parseInt((e.target as HTMLSelectElement).value) || null)}>
          <option value="">Select Rabbit Hole</option>
          {holes.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
        </FormSelect>
        {selectedHole && (
          <button onClick={() => { setShowCreate(true); setFormData({ holeId: selectedHole, title: "", url: "", type: "image", caption: "" }); }} className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 self-end">
            <Plus className="w-4 h-4" /> NEW MEDIA
          </button>
        )}
      </div>

      {showCreate && (
        <div className="border border-primary/20 bg-primary/[0.02] p-6 mb-6">
          <h3 className="font-mono text-xs text-primary uppercase mb-4">ADD MEDIA</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormInput label="Title" required value={formData.title || ""} onChange={e => setFormData({ ...formData, title: (e.target as HTMLInputElement).value })} />
            <FormInput label="URL" required value={formData.url || ""} onChange={e => setFormData({ ...formData, url: (e.target as HTMLInputElement).value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { if (!formData.title?.trim() || !formData.url?.trim()) return; createMutation.mutate(formData); }} className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs flex items-center gap-2"><Save className="w-3 h-3" /> SAVE</button>
            <button onClick={() => setShowCreate(false)} className="bg-white/5 border border-white/10 text-muted-foreground px-4 py-2 font-mono text-xs flex items-center gap-2"><X className="w-3 h-3" /> CANCEL</button>
          </div>
        </div>
      )}

      {!selectedHole ? <p className="font-mono text-sm text-muted-foreground text-center py-12">SELECT A RABBIT HOLE TO MANAGE ITS MEDIA</p> : isLoading ? <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div> : mediaList.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10"><Image className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" /><p className="font-mono text-sm text-muted-foreground">NO MEDIA ATTACHED</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mediaList.map(m => (
            <div key={m.id} className="border border-white/10 p-4" data-testid={`admin-media-${m.id}`}>
              {m.type === "image" && <div className="h-32 bg-white/5 mb-3 flex items-center justify-center overflow-hidden"><img src={m.url} alt={m.title} className="max-h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} /></div>}
              <div className="flex items-center gap-2 mb-1"><span className="font-mono text-[10px] px-1.5 py-0.5 text-muted-foreground bg-white/5">{m.type}</span><h4 className="font-mono text-sm font-bold truncate">{m.title}</h4></div>
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(m.id); }} className="text-muted-foreground hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryPanel() {
  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/admin/audit-logs"],
    queryFn: () => adminFetch("/api/admin/audit-logs").then(r => r.json()),
  });

  return (
    <div>
      <h2 className="font-mono text-sm text-muted-foreground mb-6 flex items-center gap-2"><History className="w-4 h-4 text-primary" /> ALL AUDIT LOGS ({logs.length})</h2>
      {isLoading ? <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div> : logs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10"><p className="font-mono text-sm text-muted-foreground">NO AUDIT LOGS YET</p></div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="border border-white/10 p-3 flex items-start gap-3" data-testid={`audit-log-${log.id}`}>
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-mono text-xs font-bold ${log.action === "create" ? "text-green-500" : log.action === "delete" ? "text-red-500" : log.action === "import" ? "text-blue-400" : "text-yellow-500"}`}>{log.action.toUpperCase()}</span>
                  <span className="font-mono text-xs text-muted-foreground">{log.entityType}</span>
                  {log.entityId && <span className="font-mono text-[10px] text-muted-foreground/50">#{log.entityId}</span>}
                  {log.holeId && <span className="font-mono text-[10px] text-muted-foreground/50">hole#{log.holeId}</span>}
                  <span className="font-mono text-[10px] text-primary/50">by {log.editorName}</span>
                </div>
                <p className="font-mono text-[10px] text-muted-foreground/50">{new Date(log.createdAt).toLocaleString()}</p>
                {log.changes && Object.keys(log.changes as any).length > 0 && (
                  <pre className="font-mono text-[10px] text-muted-foreground/30 mt-1 truncate max-w-full">{JSON.stringify(log.changes).slice(0, 200)}</pre>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolsPanel() {
  const [importData, setImportData] = useState<string>("");
  const [importResult, setImportResult] = useState<any>(null);
  const [importError, setImportError] = useState<string>("");
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [loading, setLoading] = useState<string>("");

  const handleExport = async () => {
    setLoading("export");
    try {
      const res = await adminFetch("/api/admin/export");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rabbithole-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Export failed");
    }
    setLoading("");
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setImportData(text);
      setShowImportConfirm(true);
      setImportError("");
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const handleImportConfirm = async () => {
    setLoading("import");
    setImportError("");
    try {
      const parsed = JSON.parse(importData);
      const res = await adminFetch("/api/admin/import", { method: "POST", body: JSON.stringify(parsed) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      const result = await res.json();
      setImportResult(result);
      setShowImportConfirm(false);
      queryClient.invalidateQueries();
    } catch (err) {
      setImportError((err as Error).message);
    }
    setLoading("");
  };

  const handleValidation = async () => {
    setLoading("validate");
    try {
      const res = await adminFetch("/api/admin/validate");
      const data = await res.json();
      setValidationResult(data);
    } catch (err) {
      alert("Validation failed");
    }
    setLoading("");
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-mono text-sm text-muted-foreground mb-4 flex items-center gap-2"><Download className="w-4 h-4 text-primary" /> EXPORT / BACKUP</h2>
        <div className="border border-white/10 p-6">
          <p className="text-sm text-muted-foreground mb-4">Export all rabbit holes, depth nodes, claims, sources, media, comments, and categories as a JSON backup file.</p>
          <button onClick={handleExport} disabled={loading === "export"} className="bg-primary/10 border border-primary/30 text-primary px-6 py-2.5 font-mono text-xs hover:bg-primary/20 transition-colors flex items-center gap-2 disabled:opacity-50" data-testid="button-export">
            {loading === "export" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} EXPORT FULL BACKUP
          </button>
        </div>
      </div>

      <div>
        <h2 className="font-mono text-sm text-muted-foreground mb-4 flex items-center gap-2"><Upload className="w-4 h-4 text-primary" /> IMPORT / RESTORE</h2>
        <div className="border border-white/10 p-6">
          <p className="text-sm text-muted-foreground mb-4">Import a JSON backup file. This will replace all existing data.</p>
          <label className="bg-white/5 border border-white/10 text-muted-foreground px-6 py-2.5 font-mono text-xs hover:text-white transition-colors cursor-pointer inline-flex items-center gap-2" data-testid="button-import-select">
            <Upload className="w-4 h-4" /> SELECT JSON FILE
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>

          {showImportConfirm && (
            <div className="mt-4 border border-yellow-500/20 bg-yellow-500/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="font-mono text-xs text-yellow-500">WARNING: THIS WILL REPLACE ALL EXISTING DATA</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">File loaded ({Math.round(importData.length / 1024)}KB). Are you sure you want to proceed?</p>
              <div className="flex gap-2">
                <button onClick={handleImportConfirm} disabled={loading === "import"} className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-4 py-2 font-mono text-xs flex items-center gap-2 disabled:opacity-50" data-testid="button-import-confirm">
                  {loading === "import" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} CONFIRM IMPORT
                </button>
                <button onClick={() => { setShowImportConfirm(false); setImportData(""); }} className="bg-white/5 border border-white/10 text-muted-foreground px-4 py-2 font-mono text-xs">CANCEL</button>
              </div>
            </div>
          )}

          {importError && <div className="mt-4 bg-red-500/10 border border-red-500/20 p-3"><p className="text-xs font-mono text-red-500">{importError}</p></div>}
          {importResult && (
            <div className="mt-4 bg-green-500/10 border border-green-500/20 p-3">
              <p className="text-xs font-mono text-green-500 mb-2">Import successful!</p>
              {Object.entries(importResult.imported).map(([key, val]) => (
                <p key={key} className="text-xs font-mono text-muted-foreground">{key}: {val as number} records</p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-mono text-sm text-muted-foreground mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-primary" /> DATA INTEGRITY VALIDATION</h2>
        <div className="border border-white/10 p-6">
          <p className="text-sm text-muted-foreground mb-4">Run integrity checks: broken source references in claims, missing connections, published holes without content.</p>
          <button onClick={handleValidation} disabled={loading === "validate"} className="bg-primary/10 border border-primary/30 text-primary px-6 py-2.5 font-mono text-xs hover:bg-primary/20 transition-colors flex items-center gap-2 disabled:opacity-50" data-testid="button-validate">
            {loading === "validate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} RUN VALIDATION
          </button>

          {validationResult && (
            <div className="mt-4">
              {validationResult.issues.length === 0 ? (
                <div className="bg-green-500/10 border border-green-500/20 p-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="font-mono text-xs text-green-500">ALL CHECKS PASSED - NO ISSUES FOUND</span>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/20 p-4">
                  <p className="font-mono text-xs text-red-500 mb-3">{validationResult.issues.length} ISSUE(S) FOUND:</p>
                  <div className="space-y-2">
                    {validationResult.issues.map((issue: any, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-mono text-[10px] text-red-500/70">[{issue.type}] {issue.holeTitle}</span>
                          <p className="font-mono text-xs text-muted-foreground">{issue.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmployeesManager() {
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Editor");
  const [newPassword, setNewPassword] = useState("");
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [error, setError] = useState("");

  const { data: employees = [], isLoading } = useQuery<AdminEmployee[]>({
    queryKey: ["/api/admin/employees"],
    queryFn: () => adminFetch("/api/admin/employees").then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await adminFetch("/api/admin/employees", {
        method: "POST",
        body: JSON.stringify({ email: newEmail, name: newName, role: newRole, password: newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees"] });
      setShowCreate(false);
      setNewEmail("");
      setNewName("");
      setNewRole("Editor");
      setNewPassword("");
      setError("");
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await adminFetch(`/api/admin/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/employees"] }),
  });

  const resetMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      const res = await adminFetch(`/api/admin/employees/${id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      setResetId(null);
      setResetPassword("");
    },
    onError: (err: Error) => setError(err.message),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div data-testid="admin-employees-panel">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-lg font-bold uppercase flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> Employees
        </h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary font-mono text-xs uppercase px-4 py-2 hover:bg-primary/20 transition-colors"
          data-testid="button-create-employee"
        >
          <Plus className="w-3 h-3" /> Add Employee
        </button>
      </div>

      {error && <div className="mb-4 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-mono">{error}</div>}

      {showCreate && (
        <div className="border border-white/10 bg-white/[0.02] p-6 mb-6 space-y-4">
          <h3 className="font-mono text-xs text-primary uppercase mb-2">Create New Employee</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Email <span className="text-primary">*</span></label>
              <input value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="input-employee-email" />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Name <span className="text-primary">*</span></label>
              <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="input-employee-name" />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Role <span className="text-primary">*</span></label>
              <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="select-employee-role">
                <option value="Admin">Admin</option>
                <option value="Editor">Editor</option>
                <option value="Moderator">Moderator</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Temporary Password <span className="text-primary">*</span></label>
              <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="input-employee-password" />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !newEmail || !newName || !newPassword}
              className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary font-mono text-xs uppercase px-4 py-2 hover:bg-primary/20 transition-colors disabled:opacity-50"
              data-testid="button-save-employee"
            >
              {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Create
            </button>
            <button onClick={() => { setShowCreate(false); setError(""); }} className="text-muted-foreground font-mono text-xs uppercase px-4 py-2 hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {employees.map((emp) => (
          <div key={emp.id} className={`border border-white/10 p-4 flex items-center justify-between ${!emp.isActive ? "opacity-50" : ""}`} data-testid={`employee-row-${emp.id}`}>
            <div className="flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full ${emp.isActive ? "bg-green-500" : "bg-red-500"}`} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold">{emp.name}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-mono uppercase border ${
                    emp.role === "Admin" ? "border-primary/30 text-primary bg-primary/10" :
                    emp.role === "Editor" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
                    "border-yellow-500/30 text-yellow-400 bg-yellow-500/10"
                  }`}>{emp.role}</span>
                </div>
                <p className="font-mono text-xs text-muted-foreground mt-0.5">{emp.email}</p>
                <p className="font-mono text-[10px] text-muted-foreground/60 mt-0.5">
                  Last login: {emp.lastLoginAt ? new Date(emp.lastLoginAt).toLocaleString() : "Never"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {resetId === emp.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={resetPassword}
                    onChange={e => setResetPassword(e.target.value)}
                    placeholder="New password"
                    className="bg-white/5 border border-white/10 px-2 py-1 text-xs font-mono w-32 focus:outline-none focus:border-primary/50"
                    data-testid="input-reset-password"
                  />
                  <button
                    onClick={() => resetMutation.mutate({ id: emp.id, password: resetPassword })}
                    disabled={resetMutation.isPending || resetPassword.length < 6}
                    className="text-primary text-xs font-mono hover:text-primary/80 disabled:opacity-50"
                    data-testid="button-confirm-reset"
                  >
                    {resetMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "OK"}
                  </button>
                  <button onClick={() => { setResetId(null); setResetPassword(""); }} className="text-muted-foreground text-xs font-mono">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setResetId(emp.id)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-white font-mono text-[10px] uppercase transition-colors"
                  title="Reset password"
                  data-testid={`button-reset-pw-${emp.id}`}
                >
                  <RotateCcw className="w-3 h-3" /> Reset PW
                </button>
              )}
              <button
                onClick={() => updateMutation.mutate({ id: emp.id, data: { isActive: !emp.isActive } })}
                className={`flex items-center gap-1 font-mono text-[10px] uppercase transition-colors ${emp.isActive ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"}`}
                title={emp.isActive ? "Deactivate" : "Reactivate"}
                data-testid={`button-toggle-active-${emp.id}`}
              >
                {emp.isActive ? <><UserX className="w-3 h-3" /> Deactivate</> : <><UserCheck className="w-3 h-3" /> Activate</>}
              </button>
              <select
                value={emp.role}
                onChange={e => updateMutation.mutate({ id: emp.id, data: { role: e.target.value } })}
                className="bg-white/5 border border-white/10 px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-primary/50"
                data-testid={`select-role-${emp.id}`}
              >
                <option value="Admin">Admin</option>
                <option value="Editor">Editor</option>
                <option value="Moderator">Moderator</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditorialDashboard({ role }: { role: string }) {
  const [dashTab, setDashTab] = useState("myDrafts");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editorFilter, setEditorFilter] = useState("");
  const [checklistHoleId, setChecklistHoleId] = useState<number | null>(null);

  const { data: dashboard, isLoading } = useQuery<{
    myDrafts: RabbitHole[];
    inReview: RabbitHole[];
    needsFixes: RabbitHole[];
    published: RabbitHole[];
    recentlyEdited: RabbitHole[];
  }>({
    queryKey: ["/api/admin/dashboard"],
    queryFn: () => adminFetch("/api/admin/dashboard").then(r => r.json()),
  });

  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const { data: checklist } = useQuery<{ passed: boolean; checks: { check: string; passed: boolean; message: string }[] }>({
    queryKey: ["/api/admin/publish-checklist", checklistHoleId],
    queryFn: () => adminFetch(`/api/admin/publish-checklist/${checklistHoleId}`).then(r => r.json()),
    enabled: !!checklistHoleId,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await adminFetch(`/api/admin/holes/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/holes?admin=true"] });
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!dashboard) return null;

  const dashTabs = [
    { id: "myDrafts", label: "My Drafts", count: dashboard.myDrafts.length },
    { id: "inReview", label: "In Review", count: dashboard.inReview.length },
    { id: "needsFixes", label: "Needs Fixes", count: dashboard.needsFixes.length },
    { id: "published", label: "Published", count: dashboard.published.length },
    { id: "recentlyEdited", label: "Recently Edited", count: dashboard.recentlyEdited.length },
  ];

  const currentList = (dashboard as any)[dashTab] as RabbitHole[] || [];
  const filtered = currentList.filter(h => {
    if (searchQuery && !h.title.toLowerCase().includes(searchQuery.toLowerCase()) && !h.slug.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter && h.categorySlug !== categoryFilter) return false;
    if (editorFilter && h.lastEditedBy !== editorFilter) return false;
    return true;
  });

  const allEditors = Array.from(new Set(currentList.map(h => h.lastEditedBy).filter(Boolean)));

  return (
    <div data-testid="editorial-dashboard">
      <div className="flex items-center gap-3 mb-4">
        <LayoutDashboard className="w-5 h-5 text-primary" />
        <h2 className="font-display text-lg font-bold uppercase">Editorial Dashboard</h2>
      </div>
      <div className="flex items-center gap-2 mb-6 px-3 py-2 border border-white/10 bg-white/[0.02] text-[10px] font-mono text-muted-foreground" data-testid="visibility-note">
        <Eye className="w-3 h-3 text-primary flex-shrink-0" />
        <span>Only <span className="text-green-500 font-bold">PUBLISHED</span> content appears on the public site. Draft and Review items are visible only here in the admin panel.</span>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {dashTabs.map(t => (
          <button key={t.id} onClick={() => setDashTab(t.id)}
            className={`px-4 py-2 font-mono text-xs uppercase border transition-colors ${dashTab === t.id ? "border-primary text-primary bg-primary/10" : "border-white/10 text-muted-foreground hover:text-white"}`}
            data-testid={`dash-tab-${t.id}`}
          >
            {t.label} <span className="ml-1 opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by title or slug..."
            className="w-full bg-white/5 border border-white/10 pl-10 pr-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50"
            data-testid="input-dash-search"
          />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50"
          data-testid="select-dash-category"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        {allEditors.length > 0 && (
          <select value={editorFilter} onChange={e => setEditorFilter(e.target.value)}
            className="bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50"
            data-testid="select-dash-editor"
          >
            <option value="">All Editors</option>
            {allEditors.map(e => <option key={e} value={e!}>{e}</option>)}
          </select>
        )}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-sm font-mono text-muted-foreground py-4">No items found.</p>}
        {filtered.map(hole => (
          <div key={hole.id} className="border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between gap-4" data-testid={`dash-hole-${hole.id}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge status={hole.status} />
                <span className="font-mono text-sm font-bold truncate">{hole.title}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                <span>{hole.slug}</span>
                {hole.categorySlug && <span className="text-primary/60">{hole.categorySlug}</span>}
                {hole.lastEditedBy && <span>by {hole.lastEditedBy}</span>}
                <span>{new Date(hole.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {hole.status === "Draft" && (
                <button onClick={() => statusMutation.mutate({ id: hole.id, status: "Review" })}
                  className="px-3 py-1.5 text-[10px] font-mono uppercase border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 transition-colors"
                  data-testid={`button-to-review-${hole.id}`}
                >Submit for Review</button>
              )}
              {hole.status === "Review" && role === "Admin" && (
                <>
                  <button onClick={() => setChecklistHoleId(checklistHoleId === hole.id ? null : hole.id)}
                    className="px-3 py-1.5 text-[10px] font-mono uppercase border border-white/10 text-muted-foreground hover:text-white transition-colors"
                    data-testid={`button-checklist-${hole.id}`}
                  >Checklist</button>
                  <button onClick={() => statusMutation.mutate({ id: hole.id, status: "Published" })}
                    className="px-3 py-1.5 text-[10px] font-mono uppercase border border-green-500/30 text-green-500 hover:bg-green-500/10 transition-colors"
                    data-testid={`button-publish-${hole.id}`}
                  >Publish</button>
                </>
              )}
              {hole.status === "Review" && role !== "Admin" && (
                <span className="text-[10px] font-mono text-yellow-500/60">Awaiting Admin review</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {checklistHoleId && checklist && (
        <div className="mt-4 border border-white/10 bg-white/[0.02] p-4" data-testid="publish-checklist">
          <h3 className="font-mono text-sm font-bold mb-3 flex items-center gap-2">
            {checklist.passed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-yellow-500" />}
            Publish Checklist
          </h3>
          <div className="space-y-1">
            {checklist.checks.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-mono">
                {c.passed ? <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" /> : <X className="w-3 h-3 text-red-500 flex-shrink-0" />}
                <span className={c.passed ? "text-muted-foreground" : "text-red-400"}>{c.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {statusMutation.isError && (
        <div className="mt-3 bg-red-500/10 border border-red-500/20 p-3">
          <p className="text-xs font-mono text-red-500">{(statusMutation.error as Error).message}</p>
        </div>
      )}
    </div>
  );
}

function PodcastsManager({ role }: { role: string }) {
  const isAdmin = role === "Admin";
  const [podView, setPodView] = useState<"podcasts" | "episodes" | "links" | "sponsored">("podcasts");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [selectedPodcastId, setSelectedPodcastId] = useState<number | null>(null);
  const [selectedHoleId, setSelectedHoleId] = useState<number | null>(null);

  const { data: allPodcasts = [] } = useQuery<Podcast[]>({
    queryKey: ["/api/admin/podcasts"],
    queryFn: () => adminFetch("/api/admin/podcasts").then(r => r.json()),
  });

  const { data: allEpisodes = [] } = useQuery<PodcastEpisode[]>({
    queryKey: ["/api/admin/podcast-episodes", selectedPodcastId],
    queryFn: () => adminFetch(`/api/admin/podcast-episodes${selectedPodcastId ? `?podcastId=${selectedPodcastId}` : ""}`).then(r => r.json()),
  });

  const { data: holes = [] } = useQuery<RabbitHole[]>({
    queryKey: ["/api/holes?admin=true"],
    queryFn: () => adminQueryFetch("/api/holes"),
  });

  const { data: holeLinks = [] } = useQuery<RabbitHolePodcastEpisode[]>({
    queryKey: ["/api/admin/hole-episodes", selectedHoleId],
    queryFn: () => adminFetch(`/api/admin/hole-episodes/${selectedHoleId}`).then(r => r.json()),
    enabled: !!selectedHoleId,
  });

  const { data: sponsoredSlots = [] } = useQuery<SponsoredPodcastSlot[]>({
    queryKey: ["/api/admin/sponsored-slots", selectedHoleId],
    queryFn: () => adminFetch(`/api/admin/sponsored-slots${selectedHoleId ? `?holeId=${selectedHoleId}` : ""}`).then(r => r.json()),
    enabled: isAdmin,
  });

  const createPodcast = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/podcasts", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/podcasts"] }); setShowCreate(false); setFormData({}); },
  });

  const updatePodcast = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await adminFetch(`/api/admin/podcasts/${id}`, { method: "PUT", body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/podcasts"] }); setEditingId(null); setFormData({}); },
  });

  const deletePodcast = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/podcasts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/podcasts"] }),
  });

  const createEpisode = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/podcast-episodes", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/podcast-episodes"] }); setShowCreate(false); setFormData({}); },
  });

  const updateEpisode = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await adminFetch(`/api/admin/podcast-episodes/${id}`, { method: "PUT", body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/podcast-episodes"] }); setEditingId(null); setFormData({}); },
  });

  const deleteEpisode = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/podcast-episodes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/podcast-episodes"] }),
  });

  const createLink = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/hole-episodes", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/hole-episodes"] }),
  });

  const updateLinkMut = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await adminFetch(`/api/admin/hole-episodes/${id}`, { method: "PUT", body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/hole-episodes"] }),
  });

  const deleteLink = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/hole-episodes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/hole-episodes"] }),
  });

  const createSlot = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/sponsored-slots", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/sponsored-slots"] }),
  });

  const updateSlot = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await adminFetch(`/api/admin/sponsored-slots/${id}`, { method: "PUT", body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/sponsored-slots"] }); setEditingId(null); setFormData({}); },
  });

  const deleteSlot = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/sponsored-slots/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/sponsored-slots"] }),
  });

  const podSubTabs = [
    { id: "podcasts" as const, label: "Shows" },
    { id: "episodes" as const, label: "Episodes" },
    { id: "links" as const, label: "Attach to Holes" },
    ...(isAdmin ? [{ id: "sponsored" as const, label: "Sponsored" }] : []),
  ];

  return (
    <div data-testid="podcasts-manager">
      <div className="flex items-center gap-3 mb-6">
        <Headphones className="w-5 h-5 text-primary" />
        <h2 className="font-display text-lg font-bold uppercase">Podcasts</h2>
      </div>

      <div className="flex gap-2 mb-4">
        {podSubTabs.map(t => (
          <button key={t.id} onClick={() => { setPodView(t.id); setShowCreate(false); setEditingId(null); setFormData({}); }}
            className={`px-4 py-2 font-mono text-xs uppercase border transition-colors ${podView === t.id ? "border-primary text-primary bg-primary/10" : "border-white/10 text-muted-foreground hover:text-white"}`}
            data-testid={`pod-tab-${t.id}`}
          >{t.label}</button>
        ))}
      </div>

      {podView === "podcasts" && (
        <div>
          <button onClick={() => { setShowCreate(!showCreate); setFormData({}); }} className="flex items-center gap-2 text-primary font-mono text-xs mb-4 hover:text-primary/80" data-testid="button-create-podcast">
            <Plus className="w-4 h-4" /> ADD PODCAST SHOW
          </button>
          {showCreate && (
            <div className="border border-primary/20 bg-primary/5 p-4 mb-4 space-y-3">
              <FormInput label="Title" required value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} data-testid="input-podcast-title" />
              <FormTextarea label="Description" value={formData.description || ""} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} data-testid="input-podcast-description" />
              <FormInput label="Platform" value={formData.platform || ""} onChange={e => setFormData({ ...formData, platform: e.target.value })} placeholder="Spotify, Apple, etc." data-testid="input-podcast-platform" />
              <FormInput label="Show URL" value={formData.showUrl || ""} onChange={e => setFormData({ ...formData, showUrl: e.target.value })} data-testid="input-podcast-showurl" />
              <FormInput label="Cover Image URL" value={formData.coverImageUrl || ""} onChange={e => setFormData({ ...formData, coverImageUrl: e.target.value })} data-testid="input-podcast-cover" />
              <button onClick={() => createPodcast.mutate(formData)} disabled={!formData.title || createPodcast.isPending}
                className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs uppercase hover:bg-primary/20 disabled:opacity-50"
                data-testid="button-save-podcast"
              ><Save className="w-3 h-3" /> {createPodcast.isPending ? "Saving..." : "Save"}</button>
            </div>
          )}
          <div className="space-y-2">
            {allPodcasts.map(p => (
              <div key={p.id} className="border border-white/10 bg-white/[0.02] p-3 flex items-center justify-between" data-testid={`podcast-${p.id}`}>
                {editingId === p.id ? (
                  <div className="flex-1 space-y-2 mr-4">
                    <FormInput label="Title" value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    <FormInput label="Platform" value={formData.platform || ""} onChange={e => setFormData({ ...formData, platform: e.target.value })} />
                    <FormInput label="Show URL" value={formData.showUrl || ""} onChange={e => setFormData({ ...formData, showUrl: e.target.value })} />
                    <div className="flex gap-2">
                      <button onClick={() => updatePodcast.mutate({ id: p.id, data: formData })} className="text-primary text-xs font-mono"><Save className="w-3 h-3 inline mr-1" />Save</button>
                      <button onClick={() => { setEditingId(null); setFormData({}); }} className="text-muted-foreground text-xs font-mono"><X className="w-3 h-3 inline mr-1" />Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="font-mono text-sm font-bold">{p.title}</span>
                      {p.platform && <span className="ml-2 text-[10px] font-mono text-primary/60">{p.platform}</span>}
                      <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{p.description?.slice(0, 80)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingId(p.id); setFormData({ title: p.title, description: p.description, platform: p.platform, showUrl: p.showUrl, coverImageUrl: p.coverImageUrl }); }}
                        className="text-muted-foreground hover:text-white" data-testid={`button-edit-podcast-${p.id}`}><Edit3 className="w-4 h-4" /></button>
                      {isAdmin && <button onClick={() => { if (confirm("Delete this podcast and all its episodes?")) deletePodcast.mutate(p.id); }}
                        className="text-red-400 hover:text-red-300" data-testid={`button-delete-podcast-${p.id}`}><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {podView === "episodes" && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <select value={selectedPodcastId || ""} onChange={e => setSelectedPodcastId(e.target.value ? parseInt(e.target.value) : null)}
              className="bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50"
              data-testid="select-podcast-filter"
            >
              <option value="">All Shows</option>
              {allPodcasts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <button onClick={() => { setShowCreate(!showCreate); setFormData({}); }} className="flex items-center gap-2 text-primary font-mono text-xs hover:text-primary/80" data-testid="button-create-episode">
              <Plus className="w-4 h-4" /> ADD EPISODE
            </button>
          </div>
          {showCreate && (
            <div className="border border-primary/20 bg-primary/5 p-4 mb-4 space-y-3">
              <FormSelect label="Podcast Show" required value={formData.podcastId || ""} onChange={e => setFormData({ ...formData, podcastId: parseInt(e.target.value) })} data-testid="select-episode-podcast">
                <option value="">Select...</option>
                {allPodcasts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </FormSelect>
              <FormInput label="Title" required value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} data-testid="input-episode-title" />
              <FormTextarea label="Description" value={formData.description || ""} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="Published Date" value={formData.publishedDate || ""} onChange={e => setFormData({ ...formData, publishedDate: e.target.value })} placeholder="2026-01-15" />
                <FormInput label="Duration (seconds)" type="number" value={formData.durationSeconds || 0} onChange={e => setFormData({ ...formData, durationSeconds: parseInt(e.target.value) || 0 })} />
              </div>
              <FormInput label="Episode URL" value={formData.episodeUrl || ""} onChange={e => setFormData({ ...formData, episodeUrl: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <FormSelect label="Embed Type" value={formData.embedType || "iframe"} onChange={e => setFormData({ ...formData, embedType: e.target.value })}>
                  <option value="iframe">iFrame</option>
                  <option value="spotify">Spotify</option>
                  <option value="apple">Apple Podcasts</option>
                  <option value="youtube">YouTube</option>
                </FormSelect>
                <FormInput label="Embed URL" value={formData.embedUrl || ""} onChange={e => setFormData({ ...formData, embedUrl: e.target.value })} placeholder="Embed player URL" />
              </div>
              <button onClick={() => createEpisode.mutate(formData)} disabled={!formData.title || !formData.podcastId || createEpisode.isPending}
                className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs uppercase hover:bg-primary/20 disabled:opacity-50"
                data-testid="button-save-episode"
              ><Save className="w-3 h-3" /> {createEpisode.isPending ? "Saving..." : "Save"}</button>
            </div>
          )}
          <div className="space-y-2">
            {allEpisodes.map(ep => {
              const podTitle = allPodcasts.find(p => p.id === ep.podcastId)?.title || "";
              return (
                <div key={ep.id} className="border border-white/10 bg-white/[0.02] p-3 flex items-center justify-between" data-testid={`episode-${ep.id}`}>
                  {editingId === ep.id ? (
                    <div className="flex-1 space-y-2 mr-4">
                      <FormInput label="Title" value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                      <FormInput label="Embed URL" value={formData.embedUrl || ""} onChange={e => setFormData({ ...formData, embedUrl: e.target.value })} />
                      <FormSelect label="Status" value={formData.status || "Draft"} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                        <option value="Draft">Draft</option>
                        <option value="Review">Review</option>
                        {isAdmin && <option value="Published">Published</option>}
                      </FormSelect>
                      <div className="flex gap-2">
                        <button onClick={() => updateEpisode.mutate({ id: ep.id, data: formData })} className="text-primary text-xs font-mono"><Save className="w-3 h-3 inline mr-1" />Save</button>
                        <button onClick={() => { setEditingId(null); setFormData({}); }} className="text-muted-foreground text-xs font-mono"><X className="w-3 h-3 inline mr-1" />Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={ep.status} />
                          <span className="font-mono text-sm font-bold truncate">{ep.title}</span>
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground mt-0.5 flex gap-3">
                          <span>{podTitle}</span>
                          {ep.publishedDate && <span>{ep.publishedDate}</span>}
                          {ep.durationSeconds > 0 && <span>{Math.floor(ep.durationSeconds / 60)}m</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {ep.status === "Draft" && (
                          <button onClick={() => updateEpisode.mutate({ id: ep.id, data: { status: "Review" } })}
                            className="text-yellow-500 text-[10px] font-mono border border-yellow-500/30 px-2 py-1 hover:bg-yellow-500/10" data-testid={`button-episode-review-${ep.id}`}>→ Review</button>
                        )}
                        {ep.status === "Review" && isAdmin && (
                          <button onClick={() => updateEpisode.mutate({ id: ep.id, data: { status: "Published" } })}
                            className="text-green-500 text-[10px] font-mono border border-green-500/30 px-2 py-1 hover:bg-green-500/10" data-testid={`button-episode-publish-${ep.id}`}>Publish</button>
                        )}
                        <button onClick={() => { setEditingId(ep.id); setFormData({ title: ep.title, description: ep.description, embedUrl: ep.embedUrl, embedType: ep.embedType, episodeUrl: ep.episodeUrl, status: ep.status, publishedDate: ep.publishedDate, durationSeconds: ep.durationSeconds }); }}
                          className="text-muted-foreground hover:text-white" data-testid={`button-edit-episode-${ep.id}`}><Edit3 className="w-4 h-4" /></button>
                        {isAdmin && <button onClick={() => { if (confirm("Delete this episode?")) deleteEpisode.mutate(ep.id); }}
                          className="text-red-400 hover:text-red-300" data-testid={`button-delete-episode-${ep.id}`}><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {podView === "links" && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <select value={selectedHoleId || ""} onChange={e => setSelectedHoleId(e.target.value ? parseInt(e.target.value) : null)}
              className="bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50"
              data-testid="select-hole-for-links"
            >
              <option value="">Select Rabbit Hole...</option>
              {holes.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
            </select>
          </div>
          {selectedHoleId && (
            <>
              <div className="mb-3">
                <FieldLabel>Attach Episode</FieldLabel>
                <div className="flex gap-2">
                  <select value={formData.episodeId || ""} onChange={e => setFormData({ ...formData, episodeId: parseInt(e.target.value) })}
                    className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50"
                    data-testid="select-link-episode"
                  >
                    <option value="">Select Episode...</option>
                    {allEpisodes.filter(e => e.status === "Published").map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                  </select>
                  <button onClick={() => { if (formData.episodeId) createLink.mutate({ rabbitHoleId: selectedHoleId, episodeId: formData.episodeId, sortOrder: holeLinks.length, pinned: false }); setFormData({}); }}
                    disabled={!formData.episodeId}
                    className="px-3 py-2 bg-primary/10 border border-primary/30 text-primary font-mono text-xs hover:bg-primary/20 disabled:opacity-50"
                    data-testid="button-attach-episode"
                  ><Plus className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-2">
                {holeLinks.map(link => {
                  const ep = allEpisodes.find(e => e.id === link.episodeId);
                  return (
                    <div key={link.id} className="border border-white/10 bg-white/[0.02] p-3 flex items-center justify-between" data-testid={`link-${link.id}`}>
                      <div className="flex items-center gap-3">
                        {link.pinned && <Pin className="w-3 h-3 text-primary" />}
                        <span className="font-mono text-sm">{ep?.title || `Episode #${link.episodeId}`}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">Order: {link.sortOrder}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateLinkMut.mutate({ id: link.id, data: { pinned: !link.pinned } })}
                          className={`text-[10px] font-mono ${link.pinned ? "text-primary" : "text-muted-foreground"} hover:text-white`}
                          data-testid={`button-pin-${link.id}`}
                        ><Pin className="w-3 h-3" /></button>
                        <button onClick={() => updateLinkMut.mutate({ id: link.id, data: { sortOrder: Math.max(0, link.sortOrder - 1) } })}
                          className="text-muted-foreground hover:text-white" data-testid={`button-move-up-${link.id}`}><ArrowUp className="w-3 h-3" /></button>
                        <button onClick={() => updateLinkMut.mutate({ id: link.id, data: { sortOrder: link.sortOrder + 1 } })}
                          className="text-muted-foreground hover:text-white" data-testid={`button-move-down-${link.id}`}><ArrowDown className="w-3 h-3" /></button>
                        <button onClick={() => deleteLink.mutate(link.id)}
                          className="text-red-400 hover:text-red-300" data-testid={`button-remove-link-${link.id}`}><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  );
                })}
                {holeLinks.length === 0 && <p className="text-sm font-mono text-muted-foreground py-3">No episodes attached to this rabbit hole.</p>}
              </div>
            </>
          )}
        </div>
      )}

      {podView === "sponsored" && isAdmin && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <select value={selectedHoleId || ""} onChange={e => setSelectedHoleId(e.target.value ? parseInt(e.target.value) : null)}
              className="bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50"
              data-testid="select-hole-for-sponsored"
            >
              <option value="">Select Rabbit Hole...</option>
              {holes.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
            </select>
            <button onClick={() => { setShowCreate(!showCreate); setFormData({}); }} className="flex items-center gap-2 text-primary font-mono text-xs hover:text-primary/80" data-testid="button-create-sponsored">
              <Plus className="w-4 h-4" /> ADD SPONSORED SLOT
            </button>
          </div>
          {showCreate && selectedHoleId && (
            <div className="border border-primary/20 bg-primary/5 p-4 mb-4 space-y-3">
              <FormInput label="Sponsor Name" required value={formData.sponsorName || ""} onChange={e => setFormData({ ...formData, sponsorName: e.target.value })} data-testid="input-sponsor-name" />
              <FormInput label="Sponsor URL" value={formData.sponsorUrl || ""} onChange={e => setFormData({ ...formData, sponsorUrl: e.target.value })} />
              <FormTextarea label="Disclosure Text" required value={formData.disclosureText || ""} onChange={e => setFormData({ ...formData, disclosureText: e.target.value })} rows={2} placeholder="Required FTC disclosure text" data-testid="input-disclosure" />
              <FormSelect label="Linked Episode (optional)" value={formData.episodeId || ""} onChange={e => setFormData({ ...formData, episodeId: e.target.value ? parseInt(e.target.value) : null })}>
                <option value="">None</option>
                {allEpisodes.filter(e => e.status === "Published").map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </FormSelect>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="Start Date" value={formData.startDate || ""} onChange={e => setFormData({ ...formData, startDate: e.target.value })} placeholder="2026-01-01" />
                <FormInput label="End Date" value={formData.endDate || ""} onChange={e => setFormData({ ...formData, endDate: e.target.value })} placeholder="2026-12-31" />
              </div>
              <button onClick={() => createSlot.mutate({ ...formData, rabbitHoleId: selectedHoleId, active: true })}
                disabled={!formData.sponsorName || !formData.disclosureText || createSlot.isPending}
                className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs uppercase hover:bg-primary/20 disabled:opacity-50"
                data-testid="button-save-sponsored"
              ><Save className="w-3 h-3" /> {createSlot.isPending ? "Saving..." : "Save"}</button>
            </div>
          )}
          <div className="space-y-2">
            {sponsoredSlots.map(slot => (
              <div key={slot.id} className="border border-white/10 bg-white/[0.02] p-3 flex items-center justify-between" data-testid={`sponsored-${slot.id}`}>
                {editingId === slot.id ? (
                  <div className="flex-1 space-y-2 mr-4">
                    <FormInput label="Sponsor Name" value={formData.sponsorName || ""} onChange={e => setFormData({ ...formData, sponsorName: e.target.value })} />
                    <FormInput label="Disclosure" value={formData.disclosureText || ""} onChange={e => setFormData({ ...formData, disclosureText: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                      <FormInput label="Start" value={formData.startDate || ""} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                      <FormInput label="End" value={formData.endDate || ""} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateSlot.mutate({ id: slot.id, data: formData })} className="text-primary text-xs font-mono"><Save className="w-3 h-3 inline mr-1" />Save</button>
                      <button onClick={() => { setEditingId(null); setFormData({}); }} className="text-muted-foreground text-xs font-mono"><X className="w-3 h-3 inline mr-1" />Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3 h-3 text-yellow-500" />
                        <span className="font-mono text-sm font-bold">{slot.sponsorName}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 border ${slot.active ? "text-green-500 border-green-500/20" : "text-red-400 border-red-500/20"}`}>{slot.active ? "ACTIVE" : "INACTIVE"}</span>
                      </div>
                      <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{slot.disclosureText.slice(0, 80)}</p>
                      <div className="text-[10px] font-mono text-muted-foreground flex gap-2 mt-0.5">
                        {slot.startDate && <span>From: {slot.startDate}</span>}
                        {slot.endDate && <span>To: {slot.endDate}</span>}
                        {holes.find(h => h.id === slot.rabbitHoleId) && <span className="text-primary/60">→ {holes.find(h => h.id === slot.rabbitHoleId)?.title}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateSlot.mutate({ id: slot.id, data: { active: !slot.active } })}
                        className={`text-[10px] font-mono ${slot.active ? "text-red-400" : "text-green-400"}`}
                        data-testid={`button-toggle-slot-${slot.id}`}
                      >{slot.active ? "Deactivate" : "Activate"}</button>
                      <button onClick={() => { setEditingId(slot.id); setFormData({ sponsorName: slot.sponsorName, sponsorUrl: slot.sponsorUrl, disclosureText: slot.disclosureText, startDate: slot.startDate, endDate: slot.endDate }); }}
                        className="text-muted-foreground hover:text-white" data-testid={`button-edit-slot-${slot.id}`}><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm("Delete this sponsored slot?")) deleteSlot.mutate(slot.id); }}
                        className="text-red-400 hover:text-red-300" data-testid={`button-delete-slot-${slot.id}`}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {sponsoredSlots.length === 0 && <p className="text-sm font-mono text-muted-foreground py-3">No sponsored slots configured.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function InvestigationOverview({ holeId, holes, nodes, onSelectNode, onAddNode, isAddingNode }: { holeId: number; holes: RabbitHole[]; nodes: DepthNode[]; onSelectNode: (id: number) => void; onAddNode: () => void; isAddingNode?: boolean }) {
  const hole = holes.find(h => h.id === holeId);
  const holeSlug = hole?.slug;

  const { data: allClaims = [] } = useQuery<Claim[]>({
    queryKey: [`/api/holes/${holeSlug}/claims`],
    enabled: !!holeSlug,
  });

  const sortedNodes = [...nodes].sort((a, b) => a.position - b.position);

  return (
    <div data-testid="investigation-overview">
      <div className="flex items-center gap-3 mb-6">
        <Search className="w-5 h-5 text-primary" />
        <h2 className="font-display text-lg font-bold uppercase">{hole?.title}</h2>
        {hole && <StatusBadge status={hole.status} />}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedNodes.map(node => {
          const wordCount = node.content?.split(/\s+/).filter(Boolean).length || 0;
          const claimCount = allClaims.filter(c => c.nodeId === node.id).length;
          return (
            <button
              key={node.id}
              onClick={() => onSelectNode(node.id)}
              className="border border-white/10 p-4 hover:border-primary/30 transition-colors text-left"
              data-testid={`overview-node-${node.id}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs text-primary">#{node.position}</span>
                <h3 className="font-display font-bold truncate flex-1">{node.title}</h3>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                <span>{wordCount} words</span>
                <span>{claimCount} claims</span>
                <span className={`px-1.5 py-0.5 ${node.status === "unlocked" ? "text-green-500 bg-green-500/10" : "text-yellow-500 bg-yellow-500/10"}`}>{node.status}</span>
              </div>
            </button>
          );
        })}
      </div>
      <button
        onClick={onAddNode}
        disabled={isAddingNode}
        className="mt-6 flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="button-add-node-overview"
      >
        {isAddingNode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} ADD NODE
      </button>
    </div>
  );
}

function NodeEditor({ nodeId, holeId, holeSlug }: { nodeId: number; holeId: number; holeSlug: string }) {
  const [showAddMedia, setShowAddMedia] = useState(false);
  const [showAddClaim, setShowAddClaim] = useState(false);
  const [showAddTimeline, setShowAddTimeline] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [mediaForm, setMediaForm] = useState<any>({});
  const [claimForm, setClaimForm] = useState<any>({});
  const [timelineForm, setTimelineForm] = useState<any>({});
  const [sourceForm, setSourceForm] = useState<any>({});
  const [sourceSearch, setSourceSearch] = useState("");
  const [editingClaimId, setEditingClaimId] = useState<number | null>(null);
  const [editClaimForm, setEditClaimForm] = useState<any>({});

  const { data: allNodes = [] } = useQuery<DepthNode[]>({
    queryKey: [`/api/holes/${holeSlug}/depth-nodes`],
  });
  const node = allNodes.find(n => n.id === nodeId);

  const [nodeForm, setNodeForm] = useState<any>({});
  const [contentValue, setContentValue] = useState("");

  useEffect(() => {
    if (node) {
      setNodeForm({ title: node.title, summary: node.summary, position: node.position, status: node.status });
      setContentValue(node.content || "");
    }
  }, [node?.id]);

  const { data: allMedia = [] } = useQuery<Media[]>({
    queryKey: [`/api/holes/${holeSlug}/media`],
  });
  const nodeMedia = allMedia.filter(m => m.nodeId === nodeId);

  const { data: allClaims = [] } = useQuery<Claim[]>({
    queryKey: [`/api/holes/${holeSlug}/claims`],
  });
  const nodeClaims = allClaims.filter(c => c.nodeId === nodeId);

  const { data: allSources = [] } = useQuery<Source[]>({
    queryKey: [`/api/holes/${holeSlug}/sources`],
  });

  const filteredSources = allSources.filter(s =>
    !sourceSearch || s.title.toLowerCase().includes(sourceSearch.toLowerCase()) || s.type.toLowerCase().includes(sourceSearch.toLowerCase())
  );

  const updateNodeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch(`/api/admin/depth-nodes/${nodeId}`, { method: "PUT", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/holes/${holeSlug}/depth-nodes`] }),
  });

  const createMediaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/media", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${holeSlug}/media`] }); setShowAddMedia(false); setMediaForm({}); },
  });

  const deleteMediaMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/media/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/holes/${holeSlug}/media`] }),
  });

  const createClaimMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/claims", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${holeSlug}/claims`] }); setShowAddClaim(false); setClaimForm({}); },
  });

  const updateClaimMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await adminFetch(`/api/admin/claims/${id}`, { method: "PUT", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${holeSlug}/claims`] }); setEditingClaimId(null); },
  });

  const deleteClaimMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/claims/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/holes/${holeSlug}/claims`] }),
  });

  const createSourceMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/sources", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${holeSlug}/sources`] }); setShowAddSource(false); setSourceForm({}); },
  });

  const deleteSourceMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/sources/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/holes/${holeSlug}/sources`] }),
  });

  if (!node) return <div className="py-12 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-primary" /><p className="font-mono text-[10px] text-muted-foreground mt-2">Loading node...</p></div>;

  const wordCount = contentValue.split(/\s+/).filter(Boolean).length;
  const timeline = (node.timeline as { year: string; event: string; type: string }[]) || [];

  return (
    <div data-testid="node-editor" className="space-y-0">
      <div className="mb-8">
        <input
          value={nodeForm.title || ""}
          onChange={e => setNodeForm({ ...nodeForm, title: e.target.value })}
          className="w-full bg-transparent border-none text-2xl font-display font-bold focus:outline-none placeholder-muted-foreground/30"
          placeholder="Node title..."
          data-testid="input-node-title"
        />
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground uppercase">Position</span>
            <input type="number" value={nodeForm.position || 1} onChange={e => setNodeForm({ ...nodeForm, position: parseInt(e.target.value) || 1 })} className="w-16 bg-white/5 border border-white/10 px-2 py-1 text-xs font-mono focus:outline-none focus:border-primary/50" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground uppercase">Status</span>
            <select value={nodeForm.status || "unlocked"} onChange={e => setNodeForm({ ...nodeForm, status: e.target.value })} className="bg-white/5 border border-white/10 px-2 py-1 text-xs font-mono focus:outline-none focus:border-primary/50">
              <option value="unlocked">Unlocked</option>
              <option value="locked">Locked</option>
            </select>
          </div>
        </div>
        <textarea
          value={nodeForm.summary || ""}
          onChange={e => setNodeForm({ ...nodeForm, summary: e.target.value })}
          placeholder="Node summary..."
          rows={2}
          className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50 resize-none mt-3"
        />
        <button
          onClick={() => updateNodeMutation.mutate({ ...nodeForm })}
          disabled={updateNodeMutation.isPending}
          className="mt-2 bg-primary/10 border border-primary/30 text-primary px-4 py-1.5 font-mono text-xs hover:bg-primary/20 transition-colors flex items-center gap-2 disabled:opacity-50"
          data-testid="button-save-node-meta"
        >
          {updateNodeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} SAVE METADATA
        </button>
      </div>

      <div className="border-t border-white/5 pt-6 mt-6" data-testid="node-editor-section-narrative">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-primary" />
          <span className="font-mono text-xs text-primary uppercase">Narrative Content</span>
          <span className="font-mono text-[10px] text-muted-foreground ml-auto">{wordCount} words</span>
        </div>
        <textarea
          value={contentValue}
          onChange={e => setContentValue(e.target.value)}
          rows={16}
          className="w-full bg-white/5 border border-white/10 p-4 text-sm font-mono focus:outline-none focus:border-primary/50 resize-none leading-relaxed"
          placeholder="Write your narrative content here..."
          data-testid="textarea-node-content"
        />
        <button
          onClick={() => updateNodeMutation.mutate({ content: contentValue })}
          disabled={updateNodeMutation.isPending}
          className="mt-2 bg-primary/10 border border-primary/30 text-primary px-4 py-1.5 font-mono text-xs hover:bg-primary/20 transition-colors flex items-center gap-2 disabled:opacity-50"
          data-testid="button-save-content"
        >
          {updateNodeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} SAVE CONTENT
        </button>
      </div>

      <div className="border-t border-white/5 pt-6 mt-6" data-testid="node-editor-section-media">
        <div className="flex items-center gap-2 mb-4">
          <Image className="w-4 h-4 text-primary" />
          <span className="font-mono text-xs text-primary uppercase">Media</span>
          <span className="font-mono text-[10px] text-muted-foreground ml-auto">{nodeMedia.length} items</span>
        </div>
        {nodeMedia.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {nodeMedia.map(m => (
              <div key={m.id} className="border border-white/10 p-3" data-testid={`node-media-${m.id}`}>
                {m.type === "image" && (
                  <div className="h-24 bg-white/5 mb-2 flex items-center justify-center overflow-hidden">
                    <img src={m.url} alt={m.title} className="max-h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs font-bold truncate">{m.title}</p>
                    {m.caption && <p className="font-mono text-[10px] text-muted-foreground truncate">{m.caption}</p>}
                  </div>
                  <button onClick={() => { if (confirm("Delete?")) deleteMediaMutation.mutate(m.id); }} className="text-muted-foreground hover:text-red-500 p-1"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => { setShowAddMedia(!showAddMedia); setMediaForm({ holeId, nodeId, title: "", url: "", type: "image", caption: "" }); }} className="flex items-center gap-2 text-primary font-mono text-xs hover:text-primary/80">
          <Plus className="w-3 h-3" /> ADD MEDIA
        </button>
        {showAddMedia && (
          <div className="border border-primary/20 bg-primary/[0.02] p-4 mt-3 space-y-3">
            <FormInput label="Title" required value={mediaForm.title || ""} onChange={e => setMediaForm({ ...mediaForm, title: (e.target as HTMLInputElement).value })} />
            <FormInput label="URL" required value={mediaForm.url || ""} onChange={e => setMediaForm({ ...mediaForm, url: (e.target as HTMLInputElement).value })} />
            <div className="grid grid-cols-2 gap-3">
              <FormSelect label="Type" value={mediaForm.type || "image"} onChange={e => setMediaForm({ ...mediaForm, type: (e.target as HTMLSelectElement).value })}>
                <option value="image">Image</option><option value="video">Video</option><option value="document">Document</option>
              </FormSelect>
              <FormInput label="Caption" value={mediaForm.caption || ""} onChange={e => setMediaForm({ ...mediaForm, caption: (e.target as HTMLInputElement).value })} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { if (mediaForm.title?.trim() && mediaForm.url?.trim()) createMediaMutation.mutate(mediaForm); }} disabled={createMediaMutation.isPending} className="bg-primary/10 border border-primary/30 text-primary px-4 py-1.5 font-mono text-xs flex items-center gap-2 disabled:opacity-50"><Save className="w-3 h-3" /> SAVE</button>
              <button onClick={() => setShowAddMedia(false)} className="text-muted-foreground font-mono text-xs"><X className="w-3 h-3 inline mr-1" />CANCEL</button>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/5 pt-6 mt-6" data-testid="node-editor-section-claims">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span className="font-mono text-xs text-primary uppercase">Claims</span>
          <span className="font-mono text-[10px] text-muted-foreground ml-auto">{nodeClaims.length} claims</span>
        </div>
        {nodeClaims.length > 0 && (
          <div className="space-y-2 mb-3">
            {nodeClaims.map(claim => (
              <div key={claim.id} className="border border-white/10 p-3" data-testid={`node-claim-${claim.id}`}>
                {editingClaimId === claim.id ? (
                  <div className="space-y-3">
                    <FormTextarea label="Statement" value={editClaimForm.statement || ""} onChange={e => setEditClaimForm({ ...editClaimForm, statement: (e.target as HTMLTextAreaElement).value })} rows={2} />
                    <div className="grid grid-cols-2 gap-3">
                      <FormSelect label="Stance" value={editClaimForm.stance || "Verified"} onChange={e => setEditClaimForm({ ...editClaimForm, stance: (e.target as HTMLSelectElement).value })}>
                        <option value="Verified">Verified</option><option value="Disputed">Disputed</option><option value="Speculative">Speculative</option>
                      </FormSelect>
                      <FormInput label="Confidence %" type="number" min={0} max={100} value={editClaimForm.confidence || 50} onChange={e => setEditClaimForm({ ...editClaimForm, confidence: parseInt((e.target as HTMLInputElement).value) || 0 })} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateClaimMutation.mutate({ id: claim.id, data: editClaimForm })} className="text-primary font-mono text-xs flex items-center gap-1"><Save className="w-3 h-3" /> SAVE</button>
                      <button onClick={() => setEditingClaimId(null)} className="text-muted-foreground font-mono text-xs flex items-center gap-1"><X className="w-3 h-3" /> CANCEL</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm mb-1 truncate">{claim.statement}</p>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[10px] px-1.5 py-0.5 ${claim.stance === "Verified" ? "text-green-500 bg-green-500/10" : claim.stance === "Disputed" ? "text-yellow-500 bg-yellow-500/10" : "text-orange-500 bg-orange-500/10"}`}>{claim.stance}</span>
                        <div className="w-16 h-1.5 bg-white/5"><div className="h-full bg-primary" style={{ width: `${claim.confidence}%` }} /></div>
                        <span className="font-mono text-[10px] text-muted-foreground">{claim.confidence}%</span>
                        {(claim.evidence as any[])?.length > 0 && <span className="font-mono text-[10px] text-muted-foreground">{(claim.evidence as any[]).length} evidence</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button onClick={() => { setEditingClaimId(claim.id); setEditClaimForm({ statement: claim.statement, stance: claim.stance, confidence: claim.confidence }); }} className="text-muted-foreground hover:text-white p-1"><Edit3 className="w-3 h-3" /></button>
                      <button onClick={() => { if (confirm("Delete?")) deleteClaimMutation.mutate(claim.id); }} className="text-muted-foreground hover:text-red-500 p-1"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <button onClick={() => { setShowAddClaim(!showAddClaim); setClaimForm({ holeId, nodeId, statement: "", stance: "Verified", confidence: 50, evidence: [], counterpoints: [] }); }} className="flex items-center gap-2 text-primary font-mono text-xs hover:text-primary/80">
          <Plus className="w-3 h-3" /> ADD CLAIM
        </button>
        {showAddClaim && (
          <div className="border border-primary/20 bg-primary/[0.02] p-4 mt-3 space-y-3">
            <FormTextarea label="Statement" required value={claimForm.statement || ""} onChange={e => setClaimForm({ ...claimForm, statement: (e.target as HTMLTextAreaElement).value })} rows={2} />
            <div className="grid grid-cols-2 gap-3">
              <FormSelect label="Stance" value={claimForm.stance || "Verified"} onChange={e => setClaimForm({ ...claimForm, stance: (e.target as HTMLSelectElement).value })}>
                <option value="Verified">Verified</option><option value="Disputed">Disputed</option><option value="Speculative">Speculative</option>
              </FormSelect>
              <FormInput label="Confidence %" type="number" min={0} max={100} value={claimForm.confidence || 50} onChange={e => setClaimForm({ ...claimForm, confidence: parseInt((e.target as HTMLInputElement).value) || 0 })} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { if (claimForm.statement?.trim()) createClaimMutation.mutate(claimForm); }} disabled={createClaimMutation.isPending} className="bg-primary/10 border border-primary/30 text-primary px-4 py-1.5 font-mono text-xs flex items-center gap-2 disabled:opacity-50"><Save className="w-3 h-3" /> SAVE</button>
              <button onClick={() => setShowAddClaim(false)} className="text-muted-foreground font-mono text-xs"><X className="w-3 h-3 inline mr-1" />CANCEL</button>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/5 pt-6 mt-6" data-testid="node-editor-section-timeline">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-mono text-xs text-primary uppercase">Timeline</span>
          <span className="font-mono text-[10px] text-muted-foreground ml-auto">{timeline.length} entries</span>
        </div>
        {timeline.length > 0 && (
          <div className="space-y-2 mb-3">
            {timeline.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-3 border border-white/10 p-3">
                <span className="font-mono text-xs text-primary font-bold w-20 flex-shrink-0">{entry.year}</span>
                <p className="font-mono text-xs flex-1 truncate">{entry.event}</p>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 flex-shrink-0 ${entry.type === "verified" ? "text-green-500 bg-green-500/10" : entry.type === "disputed" ? "text-yellow-500 bg-yellow-500/10" : "text-orange-500 bg-orange-500/10"}`}>{entry.type}</span>
                <button onClick={() => {
                  const newTimeline = timeline.filter((_, i) => i !== idx);
                  updateNodeMutation.mutate({ timeline: newTimeline });
                }} className="text-muted-foreground hover:text-red-500 p-1"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => { setShowAddTimeline(!showAddTimeline); setTimelineForm({ year: "", event: "", type: "verified" }); }} className="flex items-center gap-2 text-primary font-mono text-xs hover:text-primary/80">
          <Plus className="w-3 h-3" /> ADD TIMELINE ENTRY
        </button>
        {showAddTimeline && (
          <div className="border border-primary/20 bg-primary/[0.02] p-4 mt-3 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <FormInput label="Year" required value={timelineForm.year || ""} onChange={e => setTimelineForm({ ...timelineForm, year: (e.target as HTMLInputElement).value })} placeholder="e.g. 1963" />
              <FormInput label="Event" required value={timelineForm.event || ""} onChange={e => setTimelineForm({ ...timelineForm, event: (e.target as HTMLInputElement).value })} placeholder="What happened" />
              <FormSelect label="Type" value={timelineForm.type || "verified"} onChange={e => setTimelineForm({ ...timelineForm, type: (e.target as HTMLSelectElement).value })}>
                <option value="verified">Verified</option><option value="disputed">Disputed</option><option value="speculative">Speculative</option>
              </FormSelect>
            </div>
            <div className="flex gap-2">
              <button onClick={() => {
                if (timelineForm.year?.trim() && timelineForm.event?.trim()) {
                  const newTimeline = [...timeline, { year: timelineForm.year, event: timelineForm.event, type: timelineForm.type }];
                  updateNodeMutation.mutate({ timeline: newTimeline });
                  setShowAddTimeline(false);
                  setTimelineForm({});
                }
              }} className="bg-primary/10 border border-primary/30 text-primary px-4 py-1.5 font-mono text-xs flex items-center gap-2"><Save className="w-3 h-3" /> ADD</button>
              <button onClick={() => setShowAddTimeline(false)} className="text-muted-foreground font-mono text-xs"><X className="w-3 h-3 inline mr-1" />CANCEL</button>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/5 pt-6 mt-6" data-testid="node-editor-section-sources">
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="w-4 h-4 text-primary" />
          <span className="font-mono text-xs text-primary uppercase">Sources</span>
          <span className="font-mono text-[10px] text-muted-foreground ml-auto">{allSources.length} sources</span>
        </div>
        <div className="mb-3">
          <input
            value={sourceSearch}
            onChange={e => setSourceSearch(e.target.value)}
            placeholder="Filter sources..."
            className="w-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-primary/50"
          />
        </div>
        {filteredSources.length > 0 && (
          <div className="space-y-2 mb-3">
            {filteredSources.map(source => (
              <div key={source.id} className="flex items-center justify-between border border-white/10 p-3" data-testid={`node-source-${source.id}`}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 text-muted-foreground bg-white/5 flex-shrink-0">{source.type}</span>
                  <span className="font-mono text-xs truncate">{source.title}</span>
                  <span className={`font-mono text-[10px] flex-shrink-0 ${source.credibility >= 80 ? "text-green-500" : source.credibility >= 50 ? "text-yellow-500" : "text-orange-500"}`}>{source.credibility}%</span>
                </div>
                <button onClick={() => { if (confirm("Delete source?")) deleteSourceMutation.mutate(source.id); }} className="text-muted-foreground hover:text-red-500 p-1 ml-2"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => { setShowAddSource(!showAddSource); setSourceForm({ holeId, title: "", author: "", origin: "", publishedDate: "", url: "", summary: "", type: "document", stanceTag: "neutral", credibility: 50 }); }} className="flex items-center gap-2 text-primary font-mono text-xs hover:text-primary/80">
          <Plus className="w-3 h-3" /> ADD SOURCE
        </button>
        {showAddSource && (
          <div className="border border-primary/20 bg-primary/[0.02] p-4 mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormInput label="Title" required value={sourceForm.title || ""} onChange={e => setSourceForm({ ...sourceForm, title: (e.target as HTMLInputElement).value })} />
              <FormInput label="Author" value={sourceForm.author || ""} onChange={e => setSourceForm({ ...sourceForm, author: (e.target as HTMLInputElement).value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormSelect label="Type" value={sourceForm.type || "document"} onChange={e => setSourceForm({ ...sourceForm, type: (e.target as HTMLSelectElement).value })}>
                <option value="document">Document</option><option value="book">Book</option><option value="article">Article</option><option value="report">Report</option><option value="testimony">Testimony</option>
              </FormSelect>
              <FormInput label="Credibility %" type="number" min={0} max={100} value={sourceForm.credibility || 50} onChange={e => setSourceForm({ ...sourceForm, credibility: parseInt((e.target as HTMLInputElement).value) || 0 })} />
            </div>
            <FormInput label="URL" value={sourceForm.url || ""} onChange={e => setSourceForm({ ...sourceForm, url: (e.target as HTMLInputElement).value })} />
            <FormTextarea label="Summary" value={sourceForm.summary || ""} onChange={e => setSourceForm({ ...sourceForm, summary: (e.target as HTMLTextAreaElement).value })} rows={2} />
            <div className="flex gap-2">
              <button onClick={() => { if (sourceForm.title?.trim()) createSourceMutation.mutate(sourceForm); }} disabled={createSourceMutation.isPending} className="bg-primary/10 border border-primary/30 text-primary px-4 py-1.5 font-mono text-xs flex items-center gap-2 disabled:opacity-50"><Save className="w-3 h-3" /> SAVE</button>
              <button onClick={() => setShowAddSource(false)} className="text-muted-foreground font-mono text-xs"><X className="w-3 h-3 inline mr-1" />CANCEL</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NodeValidationPanel({ nodeId, holeId, holeSlug }: { nodeId: number; holeId: number; holeSlug: string }) {
  const { data: allNodes = [] } = useQuery<DepthNode[]>({
    queryKey: [`/api/holes/${holeSlug}/depth-nodes`],
  });
  const node = allNodes.find(n => n.id === nodeId);

  const { data: allClaims = [] } = useQuery<Claim[]>({
    queryKey: [`/api/holes/${holeSlug}/claims`],
  });
  const nodeClaims = allClaims.filter(c => c.nodeId === nodeId);

  const { data: allMedia = [] } = useQuery<Media[]>({
    queryKey: [`/api/holes/${holeSlug}/media`],
  });
  const nodeMedia = allMedia.filter(m => m.nodeId === nodeId);

  const hasTitle = !!node?.title?.trim();
  const hasContent = !!node?.content?.trim();
  const hasClaims = nodeClaims.length > 0;
  const hasMedia = nodeMedia.length > 0;
  const claimsWithoutEvidence = nodeClaims.filter(c => !(c.evidence as any[])?.length).length;
  const mediaMissingCaptions = nodeMedia.filter(m => !m.caption?.trim()).length;

  const checks = [
    { label: "HAS TITLE", passed: hasTitle },
    { label: "HAS CONTENT", passed: hasContent },
    { label: "HAS CLAIMS", passed: hasClaims },
    { label: "CLAIMS WITH EVIDENCE", passed: claimsWithoutEvidence === 0 && hasClaims },
    { label: "HAS MEDIA", passed: hasMedia },
    { label: "MEDIA CAPTIONS", passed: mediaMissingCaptions === 0 && hasMedia },
  ];

  const passedCount = checks.filter(c => c.passed).length;
  const healthPercent = Math.round((passedCount / checks.length) * 100);

  const wordCount = node?.content?.split(/\s+/).filter(Boolean).length || 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div data-testid="node-validation-panel" className="h-full overflow-y-auto p-4 space-y-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-primary" />
        <h2 className="font-mono text-xs uppercase tracking-wider">NODE VALIDATION</h2>
      </div>

      <div>
        <h3 className="font-mono text-[10px] text-muted-foreground uppercase mb-2">CHECKS</h3>
        <div className="space-y-1.5">
          {checks.map(c => (
            <div key={c.label} className="flex items-center gap-2">
              {c.passed ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-500" />}
              <span className={`font-mono text-[10px] ${c.passed ? "text-muted-foreground" : "text-red-400"}`}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {claimsWithoutEvidence > 0 && (
        <div className="text-[10px] font-mono text-yellow-500">
          {claimsWithoutEvidence} claim(s) missing evidence
        </div>
      )}

      {mediaMissingCaptions > 0 && (
        <div className="text-[10px] font-mono text-yellow-500">
          {mediaMissingCaptions} media item(s) missing captions
        </div>
      )}

      <div>
        <h3 className="font-mono text-[10px] text-muted-foreground uppercase mb-1">CONTENT STATS</h3>
        <div className="flex items-center gap-2">
          <BookOpen className="w-3 h-3 text-primary" />
          <span className="font-mono text-sm">{readTime} MIN</span>
          <span className="font-mono text-[10px] text-muted-foreground">({wordCount} words)</span>
        </div>
      </div>

      <div>
        <h3 className="font-mono text-[10px] text-muted-foreground uppercase mb-2">NODE HEALTH</h3>
        <div className="w-full h-2 bg-white/5 border border-white/10">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${healthPercent}%` }} />
        </div>
        <span className="font-mono text-[10px] text-muted-foreground mt-1 block">{healthPercent}% COMPLETE</span>
      </div>

      <div className={`p-3 border ${healthPercent === 100 ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
        <div className="flex items-center gap-2">
          {healthPercent === 100 ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
          <span className={`font-mono text-xs font-bold ${healthPercent === 100 ? "text-green-500" : "text-red-500"}`}>
            {healthPercent === 100 ? "NODE COMPLETE" : "NEEDS WORK"}
          </span>
        </div>
      </div>
    </div>
  );
}
