import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Plus, Trash2, Edit3, Save, X, Lock, LogOut, Shield, GripVertical, Image, Link2 } from "lucide-react";
import type { RabbitHole, DepthNode, Claim, Source, Category, Media } from "@shared/schema";

function adminFetch(url: string, opts?: RequestInit) {
  const token = localStorage.getItem("rh-admin-token");
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...opts?.headers },
  });
}

type Tab = "holes" | "nodes" | "claims" | "sources" | "media";

export default function Admin() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("holes");

  useEffect(() => {
    const token = localStorage.getItem("rh-admin-token");
    if (token) setIsAuthed(true);
  }, []);

  const handleLogin = async () => {
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const { token } = await res.json();
      localStorage.setItem("rh-admin-token", token);
      setIsAuthed(true);
    } else {
      setLoginError("Invalid password");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("rh-admin-token");
    setIsAuthed(false);
    setPassword("");
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="page-admin-login">
        <div className="w-full max-w-sm border border-white/10 bg-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-5 h-5 text-primary" />
            <h1 className="font-display text-xl font-bold uppercase">Admin Access</h1>
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="Enter admin password"
            className="w-full bg-white/5 border border-white/10 p-3 text-sm font-mono mb-3 focus:outline-none focus:border-primary/50"
            data-testid="input-admin-password"
          />
          {loginError && <p className="text-xs text-red-500 font-mono mb-3">{loginError}</p>}
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

  const tabs: { id: Tab; label: string }[] = [
    { id: "holes", label: "Rabbit Holes" },
    { id: "nodes", label: "Depth Nodes" },
    { id: "claims", label: "Claims" },
    { id: "sources", label: "Sources" },
    { id: "media", label: "Media" },
  ];

  return (
    <div className="min-h-screen" data-testid="page-admin">
      <div className="border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="font-display text-xl font-bold uppercase tracking-wider">Admin CMS</h1>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-muted-foreground hover:text-white font-mono text-xs transition-colors" data-testid="button-logout">
          <LogOut className="w-4 h-4" /> LOGOUT
        </button>
      </div>

      <div className="flex border-b border-white/5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-mono text-xs uppercase transition-colors border-b-2 ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-white"}`}
            data-testid={`admin-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="container mx-auto px-6 py-8">
        {activeTab === "holes" && <HolesManager />}
        {activeTab === "nodes" && <NodesManager />}
        {activeTab === "claims" && <ClaimsManager />}
        {activeTab === "sources" && <SourcesManager />}
        {activeTab === "media" && <MediaManager />}
      </div>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">
      {children} {required && <span className="text-primary">*</span>}
    </label>
  );
}

function FormInput({ label, required, ...props }: { label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input {...props} className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50" />
    </div>
  );
}

function FormSelect({ label, required, children, ...props }: { label: string; required?: boolean; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <select {...props} className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50">
        {children}
      </select>
    </div>
  );
}

function FormTextarea({ label, required, ...props }: { label: string; required?: boolean } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <textarea {...props} className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50 resize-none" />
    </div>
  );
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
            <button
              key={opt}
              type="button"
              onClick={() => onChange(active ? value.filter(l => l !== opt) : [...value, opt])}
              className={`px-3 py-1.5 text-xs font-mono border transition-colors ${active ? "border-primary text-primary bg-primary/10" : "border-white/10 text-muted-foreground hover:text-white hover:border-white/20"}`}
              data-testid={`label-toggle-${opt.toLowerCase()}`}
            >
              {opt.toUpperCase()}
            </button>
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
      <div className="space-y-2">
        {available.map(h => {
          const active = value.includes(h.slug);
          return (
            <label key={h.slug} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={active}
                onChange={() => onChange(active ? value.filter(s => s !== h.slug) : [...value, h.slug])}
                className="accent-primary"
              />
              <span className={`text-sm font-mono ${active ? "text-primary" : "text-muted-foreground group-hover:text-white"}`}>
                {h.title}
              </span>
              <span className="text-[10px] text-muted-foreground/50 font-mono">/{h.slug}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ValidationErrors({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <div className="bg-red-500/10 border border-red-500/20 p-3 mb-4">
      {errors.map((e, i) => <p key={i} className="text-xs font-mono text-red-500">{e}</p>)}
    </div>
  );
}

function HolesManager() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [showCreate, setShowCreate] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const { data: holes = [], isLoading } = useQuery<RabbitHole[]>({ queryKey: ["/api/holes"] });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/holes"] }); setShowCreate(false); setFormData({}); setErrors([]); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await adminFetch(`/api/admin/holes/${id}`, { method: "PUT", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/holes"] }); setEditingId(null); setErrors([]); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/holes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/holes"] }),
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

  const newHoleDefaults = { title: "", slug: "", summary: "", status: "Active", completion: 0, isSpecialist: false, connections: 0, sourceCount: 0, categorySlug: "", labels: [], connectedSlugs: [], timeline: [] };

  if (isLoading) return <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-sm text-muted-foreground">{holes.length} RABBIT HOLES</h2>
        <button onClick={() => { setShowCreate(true); setFormData(newHoleDefaults); setErrors([]); }} className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors" data-testid="button-create-hole">
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
            <FormSelect label="Status" required value={formData.status || "Active"} onChange={e => setFormData({ ...formData, status: (e.target as HTMLSelectElement).value })}>
              <option value="Active">Active</option>
              <option value="Verified">Verified</option>
              <option value="Unsolved">Unsolved</option>
              <option value="Specialist">Specialist</option>
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
            <FormTextarea label="Summary" required placeholder="Brief description of this investigation" value={formData.summary || ""} onChange={e => setFormData({ ...formData, summary: (e.target as HTMLTextAreaElement).value })} rows={3} data-testid="input-hole-summary" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <LabelsEditor value={formData.labels || []} onChange={labels => setFormData({ ...formData, labels })} />
            <ConnectionsSelector value={formData.connectedSlugs || []} onChange={connectedSlugs => setFormData({ ...formData, connectedSlugs })} holes={holes} currentSlug={formData.slug} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={createMutation.isPending} className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors flex items-center gap-2 disabled:opacity-50" data-testid="button-save-hole">
              {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} SAVE
            </button>
            <button onClick={() => { setShowCreate(false); setErrors([]); }} className="bg-white/5 border border-white/10 text-muted-foreground px-4 py-2 font-mono text-xs hover:text-white transition-colors flex items-center gap-2">
              <X className="w-3 h-3" /> CANCEL
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {holes.map(hole => (
          <div key={hole.id} className="border border-white/10 p-4 hover:border-white/20 transition-colors" data-testid={`admin-hole-${hole.id}`}>
            {editingId === hole.id ? (
              <div>
                <ValidationErrors errors={errors} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <FormInput label="Title" required value={formData.title || ""} onChange={e => setFormData({ ...formData, title: (e.target as HTMLInputElement).value })} />
                  <FormSelect label="Status" value={formData.status || "Active"} onChange={e => setFormData({ ...formData, status: (e.target as HTMLSelectElement).value })}>
                    <option value="Active">Active</option><option value="Verified">Verified</option><option value="Unsolved">Unsolved</option><option value="Specialist">Specialist</option>
                  </FormSelect>
                  <FormSelect label="Category" value={formData.categorySlug || ""} onChange={e => setFormData({ ...formData, categorySlug: (e.target as HTMLSelectElement).value })}>
                    <option value="">No Category</option>
                    {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </FormSelect>
                  <FormInput label="Completion %" type="number" min={0} max={100} value={formData.completion || 0} onChange={e => setFormData({ ...formData, completion: parseInt((e.target as HTMLInputElement).value) || 0 })} />
                </div>
                <div className="mb-3">
                  <FormTextarea label="Summary" required value={formData.summary || ""} onChange={e => setFormData({ ...formData, summary: (e.target as HTMLTextAreaElement).value })} rows={2} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <LabelsEditor value={formData.labels || []} onChange={labels => setFormData({ ...formData, labels })} />
                  <ConnectionsSelector value={formData.connectedSlugs || []} onChange={connectedSlugs => setFormData({ ...formData, connectedSlugs })} holes={holes} currentSlug={hole.slug} />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm font-mono text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={formData.isSpecialist || false} onChange={e => setFormData({ ...formData, isSpecialist: (e.target as HTMLInputElement).checked })} className="accent-primary" /> Specialist
                  </label>
                </div>
                <div className="flex gap-2 mt-3">
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
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 ${hole.status === "Verified" ? "text-green-500 bg-green-500/10" : hole.status === "Specialist" ? "text-red-500 bg-red-500/10" : "text-yellow-500 bg-yellow-500/10"}`}>{hole.status}</span>
                    {(hole.labels as string[])?.map(l => (
                      <span key={l} className="font-mono text-[10px] px-1.5 py-0.5 text-muted-foreground bg-white/5">{l}</span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{hole.summary}</p>
                  {(hole.connectedSlugs as string[])?.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Link2 className="w-3 h-3 text-muted-foreground/50" />
                      <span className="text-[10px] text-muted-foreground/50 font-mono">{(hole.connectedSlugs as string[]).join(", ")}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => { setEditingId(hole.id); setFormData({ title: hole.title, slug: hole.slug, summary: hole.summary, status: hole.status, categorySlug: hole.categorySlug, completion: hole.completion, isSpecialist: hole.isSpecialist, labels: hole.labels || [], connectedSlugs: hole.connectedSlugs || [] }); setErrors([]); }} className="text-muted-foreground hover:text-white p-1 transition-colors" data-testid={`button-edit-hole-${hole.id}`}>
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => { if (confirm("Delete this rabbit hole and all its data?")) deleteMutation.mutate(hole.id); }} className="text-muted-foreground hover:text-red-500 p-1 transition-colors" data-testid={`button-delete-hole-${hole.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function NodesManager() {
  const [selectedHole, setSelectedHole] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const { data: holes = [] } = useQuery<RabbitHole[]>({ queryKey: ["/api/holes"] });
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
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/depth-nodes", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/depth-nodes`] }); setShowCreate(false); setFormData({}); setErrors([]); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await adminFetch(`/api/admin/depth-nodes/${id}`, { method: "PUT", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/depth-nodes`] }); setEditingId(null); setErrors([]); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/depth-nodes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/depth-nodes`] }),
  });

  const handleCreate = () => {
    const errs = validateNode(formData);
    if (errs.length) { setErrors(errs); return; }
    createMutation.mutate(formData);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <FormSelect label="Select Rabbit Hole" value={selectedHole || ""} onChange={e => setSelectedHole(parseInt((e.target as HTMLSelectElement).value) || null)} data-testid="select-hole-nodes">
          <option value="">Select Rabbit Hole</option>
          {holes.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
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
            <FormInput label="Title" required placeholder="Node title" value={formData.title || ""} onChange={e => setFormData({ ...formData, title: (e.target as HTMLInputElement).value })} />
            <FormInput label="Position" type="number" value={formData.position || 1} onChange={e => setFormData({ ...formData, position: parseInt((e.target as HTMLInputElement).value) || 1 })} />
            <FormSelect label="Status" value={formData.status || "unlocked"} onChange={e => setFormData({ ...formData, status: (e.target as HTMLSelectElement).value })}>
              <option value="unlocked">Unlocked</option>
              <option value="locked">Locked</option>
            </FormSelect>
          </div>
          <div className="mb-4">
            <FormInput label="Summary" placeholder="Brief summary" value={formData.summary || ""} onChange={e => setFormData({ ...formData, summary: (e.target as HTMLInputElement).value })} />
          </div>
          <div className="mb-4">
            <FormTextarea label="Content" required placeholder="Full node content (separate paragraphs with blank lines)" value={formData.content || ""} onChange={e => setFormData({ ...formData, content: (e.target as HTMLTextAreaElement).value })} rows={6} />
          </div>
          <div className="mb-4">
            <FormInput label="Media URL (optional)" placeholder="https://..." value={formData.mediaUrl || ""} onChange={e => setFormData({ ...formData, mediaUrl: (e.target as HTMLInputElement).value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={createMutation.isPending} className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors flex items-center gap-2 disabled:opacity-50">
              {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} SAVE
            </button>
            <button onClick={() => { setShowCreate(false); setErrors([]); }} className="bg-white/5 border border-white/10 text-muted-foreground px-4 py-2 font-mono text-xs hover:text-white transition-colors flex items-center gap-2">
              <X className="w-3 h-3" /> CANCEL
            </button>
          </div>
        </div>
      )}

      {!selectedHole ? (
        <p className="font-mono text-sm text-muted-foreground text-center py-12">SELECT A RABBIT HOLE TO MANAGE ITS DEPTH NODES</p>
      ) : isLoading ? (
        <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {nodes.map(node => (
            <div key={node.id} className="border border-white/10 p-4 hover:border-white/20 transition-colors" data-testid={`admin-node-${node.id}`}>
              {editingId === node.id ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <FormInput label="Title" required value={formData.title || ""} onChange={e => setFormData({ ...formData, title: (e.target as HTMLInputElement).value })} />
                    <FormInput label="Position" type="number" value={formData.position || 1} onChange={e => setFormData({ ...formData, position: parseInt((e.target as HTMLInputElement).value) || 1 })} />
                    <FormSelect label="Status" value={formData.status || "unlocked"} onChange={e => setFormData({ ...formData, status: (e.target as HTMLSelectElement).value })}>
                      <option value="unlocked">Unlocked</option><option value="locked">Locked</option>
                    </FormSelect>
                  </div>
                  <div className="mb-3"><FormInput label="Summary" value={formData.summary || ""} onChange={e => setFormData({ ...formData, summary: (e.target as HTMLInputElement).value })} /></div>
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
                    <button onClick={() => { setEditingId(node.id); setFormData({ title: node.title, content: node.content, summary: node.summary, position: node.position, status: node.status, mediaUrl: node.mediaUrl }); }} className="text-muted-foreground hover:text-white p-1 transition-colors"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm("Delete this node?")) deleteMutation.mutate(node.id); }} className="text-muted-foreground hover:text-red-500 p-1 transition-colors"><Trash2 className="w-4 h-4" /></button>
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

  const { data: holes = [] } = useQuery<RabbitHole[]>({ queryKey: ["/api/holes"] });
  const selectedSlug = holes.find(h => h.id === selectedHole)?.slug;
  const { data: claimsList = [], isLoading } = useQuery<Claim[]>({
    queryKey: [`/api/holes/${selectedSlug}/claims`],
    enabled: !!selectedSlug,
  });
  const { data: sourcesList = [] } = useQuery<Source[]>({
    queryKey: [`/api/holes/${selectedSlug}/sources`],
    enabled: !!selectedSlug,
  });

  const validateClaim = (data: any): string[] => {
    const errs: string[] = [];
    if (!data.statement?.trim()) errs.push("Statement is required");
    return errs;
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/claims", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/claims`] }); setShowCreate(false); setFormData({}); setErrors([]); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await adminFetch(`/api/admin/claims/${id}`, { method: "PUT", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/claims`] }); setEditingId(null); setErrors([]); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/claims/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/claims`] }),
  });

  const handleCreate = () => {
    const errs = validateClaim(formData);
    if (errs.length) { setErrors(errs); return; }
    createMutation.mutate(formData);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <FormSelect label="Select Rabbit Hole" value={selectedHole || ""} onChange={e => setSelectedHole(parseInt((e.target as HTMLSelectElement).value) || null)} data-testid="select-hole-claims">
          <option value="">Select Rabbit Hole</option>
          {holes.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
        </FormSelect>
        {selectedHole && (
          <button onClick={() => { setShowCreate(true); setFormData({ holeId: selectedHole, statement: "", stance: "Verified", confidence: 50, evidence: [], counterpoints: [] }); setErrors([]); }} className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors self-end" data-testid="button-create-claim">
            <Plus className="w-4 h-4" /> NEW CLAIM
          </button>
        )}
      </div>

      {showCreate && (
        <div className="border border-primary/20 bg-primary/[0.02] p-6 mb-6">
          <h3 className="font-mono text-xs text-primary uppercase mb-4">CREATE CLAIM</h3>
          <ValidationErrors errors={errors} />
          <div className="mb-4">
            <FormTextarea label="Statement" required placeholder="The claim statement" value={formData.statement || ""} onChange={e => setFormData({ ...formData, statement: (e.target as HTMLTextAreaElement).value })} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <FormSelect label="Stance" value={formData.stance || "Verified"} onChange={e => setFormData({ ...formData, stance: (e.target as HTMLSelectElement).value })}>
              <option value="Verified">Verified</option>
              <option value="Disputed">Disputed</option>
              <option value="Speculative">Speculative</option>
            </FormSelect>
            <FormInput label="Confidence %" type="number" min={0} max={100} value={formData.confidence || 50} onChange={e => setFormData({ ...formData, confidence: parseInt((e.target as HTMLInputElement).value) || 0 })} />
          </div>
          {sourcesList.length > 0 && (
            <div className="mb-4">
              <FieldLabel>Evidence Sources</FieldLabel>
              <EvidenceEditor value={formData.evidence || []} onChange={evidence => setFormData({ ...formData, evidence })} sources={sourcesList} />
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={createMutation.isPending} className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors flex items-center gap-2 disabled:opacity-50">
              {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} SAVE
            </button>
            <button onClick={() => { setShowCreate(false); setErrors([]); }} className="bg-white/5 border border-white/10 text-muted-foreground px-4 py-2 font-mono text-xs hover:text-white transition-colors flex items-center gap-2">
              <X className="w-3 h-3" /> CANCEL
            </button>
          </div>
        </div>
      )}

      {!selectedHole ? (
        <p className="font-mono text-sm text-muted-foreground text-center py-12">SELECT A RABBIT HOLE TO MANAGE ITS CLAIMS</p>
      ) : isLoading ? (
        <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {claimsList.map(claim => (
            <div key={claim.id} className="border border-white/10 p-4 hover:border-white/20 transition-colors" data-testid={`admin-claim-${claim.id}`}>
              {editingId === claim.id ? (
                <div>
                  <div className="mb-3"><FormTextarea label="Statement" required value={formData.statement || ""} onChange={e => setFormData({ ...formData, statement: (e.target as HTMLTextAreaElement).value })} rows={2} /></div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <FormSelect label="Stance" value={formData.stance || "Verified"} onChange={e => setFormData({ ...formData, stance: (e.target as HTMLSelectElement).value })}>
                      <option value="Verified">Verified</option><option value="Disputed">Disputed</option><option value="Speculative">Speculative</option>
                    </FormSelect>
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
                      <span className="font-mono text-[10px] text-muted-foreground">{claim.confidence}% confidence</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={() => { setEditingId(claim.id); setFormData({ statement: claim.statement, stance: claim.stance, confidence: claim.confidence, evidence: claim.evidence, counterpoints: claim.counterpoints }); }} className="text-muted-foreground hover:text-white p-1 transition-colors"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm("Delete this claim?")) deleteMutation.mutate(claim.id); }} className="text-muted-foreground hover:text-red-500 p-1 transition-colors"><Trash2 className="w-4 h-4" /></button>
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

function EvidenceEditor({ value, onChange, sources }: { value: { sourceId: number; excerpt: string }[]; onChange: (v: { sourceId: number; excerpt: string }[]) => void; sources: Source[] }) {
  const addEvidence = () => onChange([...value, { sourceId: sources[0]?.id || 0, excerpt: "" }]);
  const removeEvidence = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const updateEvidence = (i: number, field: string, val: any) => onChange(value.map((ev, idx) => idx === i ? { ...ev, [field]: val } : ev));

  return (
    <div className="space-y-2">
      {value.map((ev, i) => (
        <div key={i} className="flex gap-2 items-start">
          <select value={ev.sourceId} onChange={e => updateEvidence(i, "sourceId", parseInt(e.target.value))} className="bg-white/5 border border-white/10 p-2 text-xs font-mono w-48 focus:outline-none focus:border-primary/50">
            {sources.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          <input value={ev.excerpt} onChange={e => updateEvidence(i, "excerpt", e.target.value)} placeholder="Excerpt" className="flex-1 bg-white/5 border border-white/10 p-2 text-xs font-mono focus:outline-none focus:border-primary/50" />
          <button onClick={() => removeEvidence(i)} className="text-red-500 p-2"><Trash2 className="w-3 h-3" /></button>
        </div>
      ))}
      <button onClick={addEvidence} className="text-xs font-mono text-primary flex items-center gap-1"><Plus className="w-3 h-3" /> Add Evidence</button>
    </div>
  );
}

function SourcesManager() {
  const [selectedHole, setSelectedHole] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const { data: holes = [] } = useQuery<RabbitHole[]>({ queryKey: ["/api/holes"] });
  const selectedSlug = holes.find(h => h.id === selectedHole)?.slug;
  const { data: sourcesList = [], isLoading } = useQuery<Source[]>({
    queryKey: [`/api/holes/${selectedSlug}/sources`],
    enabled: !!selectedSlug,
  });

  const validateSource = (data: any): string[] => {
    const errs: string[] = [];
    if (!data.title?.trim()) errs.push("Title is required");
    if (!data.type?.trim()) errs.push("Type is required");
    return errs;
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/sources", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/sources`] }); setShowCreate(false); setFormData({}); setErrors([]); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await adminFetch(`/api/admin/sources/${id}`, { method: "PUT", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/sources`] }); setEditingId(null); setErrors([]); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/sources/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/sources`] }),
  });

  const handleCreate = () => {
    const errs = validateSource(formData);
    if (errs.length) { setErrors(errs); return; }
    createMutation.mutate(formData);
  };

  const newSourceDefaults = { holeId: selectedHole, title: "", author: "", origin: "", publishedDate: "", url: "", summary: "", type: "document", stanceTag: "neutral", credibility: 50 };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <FormSelect label="Select Rabbit Hole" value={selectedHole || ""} onChange={e => setSelectedHole(parseInt((e.target as HTMLSelectElement).value) || null)} data-testid="select-hole-sources">
          <option value="">Select Rabbit Hole</option>
          {holes.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
        </FormSelect>
        {selectedHole && (
          <button onClick={() => { setShowCreate(true); setFormData({ ...newSourceDefaults, holeId: selectedHole }); setErrors([]); }} className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors self-end" data-testid="button-create-source">
            <Plus className="w-4 h-4" /> NEW SOURCE
          </button>
        )}
      </div>

      {showCreate && (
        <div className="border border-primary/20 bg-primary/[0.02] p-6 mb-6">
          <h3 className="font-mono text-xs text-primary uppercase mb-4">CREATE SOURCE</h3>
          <ValidationErrors errors={errors} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormInput label="Title" required placeholder="Source title" value={formData.title || ""} onChange={e => setFormData({ ...formData, title: (e.target as HTMLInputElement).value })} />
            <FormInput label="Author" placeholder="Author name" value={formData.author || ""} onChange={e => setFormData({ ...formData, author: (e.target as HTMLInputElement).value })} />
            <FormInput label="Origin" placeholder="Publication/organization" value={formData.origin || ""} onChange={e => setFormData({ ...formData, origin: (e.target as HTMLInputElement).value })} />
            <FormInput label="Published Date" placeholder="e.g. 1977" value={formData.publishedDate || ""} onChange={e => setFormData({ ...formData, publishedDate: (e.target as HTMLInputElement).value })} />
            <FormInput label="URL" placeholder="https://..." value={formData.url || ""} onChange={e => setFormData({ ...formData, url: (e.target as HTMLInputElement).value })} />
            <FormSelect label="Type" required value={formData.type || "document"} onChange={e => setFormData({ ...formData, type: (e.target as HTMLSelectElement).value })}>
              <option value="document">Document</option>
              <option value="book">Book</option>
              <option value="article">Article</option>
              <option value="report">Report</option>
              <option value="theory">Theory</option>
              <option value="testimony">Testimony</option>
            </FormSelect>
            <FormSelect label="Stance" value={formData.stanceTag || "neutral"} onChange={e => setFormData({ ...formData, stanceTag: (e.target as HTMLSelectElement).value })}>
              <option value="neutral">Neutral</option>
              <option value="supporting">Supporting</option>
              <option value="critical">Critical</option>
            </FormSelect>
            <FormInput label="Credibility %" type="number" min={0} max={100} value={formData.credibility || 50} onChange={e => setFormData({ ...formData, credibility: parseInt((e.target as HTMLInputElement).value) || 0 })} />
          </div>
          <div className="mb-4">
            <FormTextarea label="Summary" placeholder="Brief description of this source" value={formData.summary || ""} onChange={e => setFormData({ ...formData, summary: (e.target as HTMLTextAreaElement).value })} rows={2} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={createMutation.isPending} className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors flex items-center gap-2 disabled:opacity-50">
              {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} SAVE
            </button>
            <button onClick={() => { setShowCreate(false); setErrors([]); }} className="bg-white/5 border border-white/10 text-muted-foreground px-4 py-2 font-mono text-xs hover:text-white transition-colors flex items-center gap-2">
              <X className="w-3 h-3" /> CANCEL
            </button>
          </div>
        </div>
      )}

      {!selectedHole ? (
        <p className="font-mono text-sm text-muted-foreground text-center py-12">SELECT A RABBIT HOLE TO MANAGE ITS SOURCES</p>
      ) : isLoading ? (
        <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {sourcesList.map(source => (
            <div key={source.id} className="border border-white/10 p-4 hover:border-white/20 transition-colors" data-testid={`admin-source-${source.id}`}>
              {editingId === source.id ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <FormInput label="Title" required value={formData.title || ""} onChange={e => setFormData({ ...formData, title: (e.target as HTMLInputElement).value })} />
                    <FormInput label="Author" value={formData.author || ""} onChange={e => setFormData({ ...formData, author: (e.target as HTMLInputElement).value })} />
                    <FormInput label="URL" value={formData.url || ""} onChange={e => setFormData({ ...formData, url: (e.target as HTMLInputElement).value })} />
                    <FormInput label="Credibility %" type="number" min={0} max={100} value={formData.credibility || 50} onChange={e => setFormData({ ...formData, credibility: parseInt((e.target as HTMLInputElement).value) || 0 })} />
                  </div>
                  <div className="mb-3"><FormTextarea label="Summary" value={formData.summary || ""} onChange={e => setFormData({ ...formData, summary: (e.target as HTMLTextAreaElement).value })} rows={2} /></div>
                  <div className="flex gap-2">
                    <button onClick={() => updateMutation.mutate({ id: source.id, data: formData })} className="text-primary font-mono text-xs flex items-center gap-1"><Save className="w-3 h-3" /> SAVE</button>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground font-mono text-xs flex items-center gap-1"><X className="w-3 h-3" /> CANCEL</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 ${source.type === "document" ? "text-green-500 bg-green-500/10" : source.type === "book" ? "text-blue-400 bg-blue-500/10" : "text-muted-foreground bg-white/5"}`}>{source.type}</span>
                      <h3 className="font-display font-bold truncate">{source.title}</h3>
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 ${source.credibility >= 80 ? "text-green-500" : source.credibility >= 50 ? "text-yellow-500" : "text-orange-500"}`}>{source.credibility}%</span>
                    </div>
                    {source.author && <p className="text-xs text-muted-foreground truncate">{source.author}{source.origin && ` — ${source.origin}`}</p>}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={() => { setEditingId(source.id); setFormData({ title: source.title, author: source.author, origin: source.origin, publishedDate: source.publishedDate, url: source.url, summary: source.summary, type: source.type, stanceTag: source.stanceTag, credibility: source.credibility }); }} className="text-muted-foreground hover:text-white p-1 transition-colors"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm("Delete this source?")) deleteMutation.mutate(source.id); }} className="text-muted-foreground hover:text-red-500 p-1 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
  const [errors, setErrors] = useState<string[]>([]);

  const { data: holes = [] } = useQuery<RabbitHole[]>({ queryKey: ["/api/holes"] });
  const selectedSlug = holes.find(h => h.id === selectedHole)?.slug;
  const { data: mediaList = [], isLoading } = useQuery<Media[]>({
    queryKey: [`/api/holes/${selectedSlug}/media`],
    enabled: !!selectedSlug,
  });

  const validateMedia = (data: any): string[] => {
    const errs: string[] = [];
    if (!data.title?.trim()) errs.push("Title is required");
    if (!data.url?.trim()) errs.push("URL is required");
    return errs;
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/media", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/media`] }); setShowCreate(false); setFormData({}); setErrors([]); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await adminFetch(`/api/admin/media/${id}`, { method: "PUT", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/media`] }); setEditingId(null); setErrors([]); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/media/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/media`] }),
  });

  const handleCreate = () => {
    const errs = validateMedia(formData);
    if (errs.length) { setErrors(errs); return; }
    createMutation.mutate(formData);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <FormSelect label="Select Rabbit Hole" value={selectedHole || ""} onChange={e => setSelectedHole(parseInt((e.target as HTMLSelectElement).value) || null)} data-testid="select-hole-media">
          <option value="">Select Rabbit Hole</option>
          {holes.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
        </FormSelect>
        {selectedHole && (
          <button onClick={() => { setShowCreate(true); setFormData({ holeId: selectedHole, title: "", url: "", type: "image", caption: "" }); setErrors([]); }} className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors self-end" data-testid="button-create-media">
            <Plus className="w-4 h-4" /> NEW MEDIA
          </button>
        )}
      </div>

      {showCreate && (
        <div className="border border-primary/20 bg-primary/[0.02] p-6 mb-6">
          <h3 className="font-mono text-xs text-primary uppercase mb-4">ADD MEDIA</h3>
          <ValidationErrors errors={errors} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormInput label="Title" required placeholder="Media title" value={formData.title || ""} onChange={e => setFormData({ ...formData, title: (e.target as HTMLInputElement).value })} />
            <FormInput label="URL" required placeholder="https://..." value={formData.url || ""} onChange={e => setFormData({ ...formData, url: (e.target as HTMLInputElement).value })} />
            <FormSelect label="Type" value={formData.type || "image"} onChange={e => setFormData({ ...formData, type: (e.target as HTMLSelectElement).value })}>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="document">Document</option>
            </FormSelect>
          </div>
          <div className="mb-4">
            <FormTextarea label="Caption" placeholder="Optional caption" value={formData.caption || ""} onChange={e => setFormData({ ...formData, caption: (e.target as HTMLTextAreaElement).value })} rows={2} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={createMutation.isPending} className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors flex items-center gap-2 disabled:opacity-50">
              {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} SAVE
            </button>
            <button onClick={() => { setShowCreate(false); setErrors([]); }} className="bg-white/5 border border-white/10 text-muted-foreground px-4 py-2 font-mono text-xs hover:text-white transition-colors flex items-center gap-2">
              <X className="w-3 h-3" /> CANCEL
            </button>
          </div>
        </div>
      )}

      {!selectedHole ? (
        <p className="font-mono text-sm text-muted-foreground text-center py-12">SELECT A RABBIT HOLE TO MANAGE ITS MEDIA</p>
      ) : isLoading ? (
        <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
      ) : mediaList.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10">
          <Image className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-mono text-sm text-muted-foreground">NO MEDIA ATTACHED</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mediaList.map(m => (
            <div key={m.id} className="border border-white/10 p-4 hover:border-white/20 transition-colors" data-testid={`admin-media-${m.id}`}>
              {editingId === m.id ? (
                <div>
                  <div className="space-y-3 mb-3">
                    <FormInput label="Title" value={formData.title || ""} onChange={e => setFormData({ ...formData, title: (e.target as HTMLInputElement).value })} />
                    <FormInput label="URL" value={formData.url || ""} onChange={e => setFormData({ ...formData, url: (e.target as HTMLInputElement).value })} />
                    <FormTextarea label="Caption" value={formData.caption || ""} onChange={e => setFormData({ ...formData, caption: (e.target as HTMLTextAreaElement).value })} rows={2} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateMutation.mutate({ id: m.id, data: formData })} className="text-primary font-mono text-xs flex items-center gap-1"><Save className="w-3 h-3" /> SAVE</button>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground font-mono text-xs flex items-center gap-1"><X className="w-3 h-3" /> CANCEL</button>
                  </div>
                </div>
              ) : (
                <div>
                  {m.type === "image" && <div className="h-32 bg-white/5 mb-3 flex items-center justify-center overflow-hidden"><img src={m.url} alt={m.title} className="max-h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /></div>}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 text-muted-foreground bg-white/5">{m.type}</span>
                    <h4 className="font-mono text-sm font-bold truncate">{m.title}</h4>
                  </div>
                  {m.caption && <p className="text-xs text-muted-foreground truncate">{m.caption}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => { setEditingId(m.id); setFormData({ title: m.title, url: m.url, type: m.type, caption: m.caption }); }} className="text-muted-foreground hover:text-white p-1 transition-colors"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm("Delete this media?")) deleteMutation.mutate(m.id); }} className="text-muted-foreground hover:text-red-500 p-1 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
