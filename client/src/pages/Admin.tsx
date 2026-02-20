import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Plus, Trash2, Edit3, Save, X, Lock, LogOut, Shield } from "lucide-react";
import type { RabbitHole, DepthNode, Claim, Source, Category } from "@shared/schema";

function adminFetch(url: string, opts?: RequestInit) {
  const token = localStorage.getItem("rh-admin-token");
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...opts?.headers },
  });
}

type Tab = "holes" | "nodes" | "claims" | "sources";

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
      </div>
    </div>
  );
}

function HolesManager() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [showCreate, setShowCreate] = useState(false);

  const { data: holes = [], isLoading } = useQuery<RabbitHole[]>({ queryKey: ["/api/holes"] });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/holes", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/holes"] }); setShowCreate(false); setFormData({}); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await adminFetch(`/api/admin/holes/${id}`, { method: "PUT", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/holes"] }); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/holes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/holes"] }),
  });

  if (isLoading) return <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-sm text-muted-foreground">{holes.length} RABBIT HOLES</h2>
        <button onClick={() => { setShowCreate(true); setFormData({ title: "", slug: "", summary: "", status: "Active", completion: 0, isSpecialist: false, connections: 0, sourceCount: 0, categorySlug: "" }); }} className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors" data-testid="button-create-hole">
          <Plus className="w-4 h-4" /> NEW HOLE
        </button>
      </div>

      {showCreate && (
        <div className="border border-primary/20 bg-primary/[0.02] p-6 mb-6" data-testid="form-create-hole">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input placeholder="Title" value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} className="bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="input-hole-title" />
            <input placeholder="Slug" value={formData.slug || ""} onChange={e => setFormData({ ...formData, slug: e.target.value })} className="bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="input-hole-slug" />
            <select value={formData.status || "Active"} onChange={e => setFormData({ ...formData, status: e.target.value })} className="bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50">
              <option value="Active">Active</option><option value="Verified">Verified</option><option value="Unsolved">Unsolved</option><option value="Specialist">Specialist</option>
            </select>
            <select value={formData.categorySlug || ""} onChange={e => setFormData({ ...formData, categorySlug: e.target.value })} className="bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50">
              <option value="">No Category</option>
              {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                <input type="checkbox" checked={formData.isSpecialist || false} onChange={e => setFormData({ ...formData, isSpecialist: e.target.checked })} /> Specialist
              </label>
              <input type="number" placeholder="Completion %" value={formData.completion || 0} onChange={e => setFormData({ ...formData, completion: parseInt(e.target.value) || 0 })} className="bg-white/5 border border-white/10 p-2 text-sm font-mono w-24 focus:outline-none focus:border-primary/50" />
            </div>
          </div>
          <textarea placeholder="Summary" value={formData.summary || ""} onChange={e => setFormData({ ...formData, summary: e.target.value })} className="w-full bg-white/5 border border-white/10 p-2 text-sm font-mono h-24 mb-4 focus:outline-none focus:border-primary/50 resize-none" data-testid="input-hole-summary" />
          <div className="flex gap-2">
            <button onClick={() => createMutation.mutate(formData)} className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors flex items-center gap-2" data-testid="button-save-hole">
              <Save className="w-3 h-3" /> SAVE
            </button>
            <button onClick={() => setShowCreate(false)} className="bg-white/5 border border-white/10 text-muted-foreground px-4 py-2 font-mono text-xs hover:text-white transition-colors flex items-center gap-2">
              <X className="w-3 h-3" /> CANCEL
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {holes.map(hole => (
          <div key={hole.id} className="border border-white/10 p-4 flex items-center justify-between group hover:border-white/20 transition-colors" data-testid={`admin-hole-${hole.id}`}>
            {editingId === hole.id ? (
              <div className="flex-1 mr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  <input value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} className="bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50" />
                  <input value={formData.summary || ""} onChange={e => setFormData({ ...formData, summary: e.target.value })} className="bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateMutation.mutate({ id: hole.id, data: formData })} className="text-primary font-mono text-xs flex items-center gap-1"><Save className="w-3 h-3" /> SAVE</button>
                  <button onClick={() => setEditingId(null)} className="text-muted-foreground font-mono text-xs flex items-center gap-1"><X className="w-3 h-3" /> CANCEL</button>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-primary">#{hole.id}</span>
                  <h3 className="font-display font-bold truncate">{hole.title}</h3>
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 ${hole.status === "Verified" ? "text-green-500 bg-green-500/10" : hole.status === "Specialist" ? "text-red-500 bg-red-500/10" : "text-yellow-500 bg-yellow-500/10"}`}>{hole.status}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{hole.summary}</p>
              </div>
            )}
            <div className="flex items-center gap-2 ml-4">
              <button onClick={() => { setEditingId(hole.id); setFormData({ title: hole.title, summary: hole.summary, status: hole.status }); }} className="text-muted-foreground hover:text-white p-1 transition-colors" data-testid={`button-edit-hole-${hole.id}`}>
                <Edit3 className="w-4 h-4" />
              </button>
              <button onClick={() => { if (confirm("Delete this rabbit hole and all its data?")) deleteMutation.mutate(hole.id); }} className="text-muted-foreground hover:text-red-500 p-1 transition-colors" data-testid={`button-delete-hole-${hole.id}`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
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

  const { data: holes = [] } = useQuery<RabbitHole[]>({ queryKey: ["/api/holes"] });

  const selectedSlug = holes.find(h => h.id === selectedHole)?.slug;
  const { data: nodes = [], isLoading } = useQuery<DepthNode[]>({
    queryKey: [`/api/holes/${selectedSlug}/depth-nodes`],
    enabled: !!selectedSlug,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/depth-nodes", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/depth-nodes`] }); setShowCreate(false); setFormData({}); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await adminFetch(`/api/admin/depth-nodes/${id}`, { method: "PUT", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/depth-nodes`] }); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/depth-nodes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/depth-nodes`] }),
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <select value={selectedHole || ""} onChange={e => setSelectedHole(parseInt(e.target.value) || null)} className="bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="select-hole-nodes">
          <option value="">Select Rabbit Hole</option>
          {holes.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
        </select>
        {selectedHole && (
          <button onClick={() => { setShowCreate(true); setFormData({ holeId: selectedHole, title: "", summary: "", content: "", position: nodes.length + 1, status: "unlocked" }); }} className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors" data-testid="button-create-node">
            <Plus className="w-4 h-4" /> NEW NODE
          </button>
        )}
      </div>

      {showCreate && (
        <div className="border border-primary/20 bg-primary/[0.02] p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input placeholder="Title" value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} className="bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50" />
            <input placeholder="Summary" value={formData.summary || ""} onChange={e => setFormData({ ...formData, summary: e.target.value })} className="bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50" />
          </div>
          <textarea placeholder="Content (paragraphs separated by double newlines)" value={formData.content || ""} onChange={e => setFormData({ ...formData, content: e.target.value })} className="w-full bg-white/5 border border-white/10 p-2 text-sm font-mono h-32 mb-4 focus:outline-none focus:border-primary/50 resize-none" />
          <div className="flex gap-2">
            <button onClick={() => createMutation.mutate(formData)} className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors flex items-center gap-2"><Save className="w-3 h-3" /> SAVE</button>
            <button onClick={() => setShowCreate(false)} className="bg-white/5 border border-white/10 text-muted-foreground px-4 py-2 font-mono text-xs hover:text-white transition-colors flex items-center gap-2"><X className="w-3 h-3" /> CANCEL</button>
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
            <div key={node.id} className="border border-white/10 p-4 flex items-center justify-between group hover:border-white/20 transition-colors" data-testid={`admin-node-${node.id}`}>
              {editingId === node.id ? (
                <div className="flex-1 mr-4 space-y-2">
                  <input value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50" />
                  <textarea value={formData.content || ""} onChange={e => setFormData({ ...formData, content: e.target.value })} className="w-full bg-white/5 border border-white/10 p-2 text-sm font-mono h-24 focus:outline-none focus:border-primary/50 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => updateMutation.mutate({ id: node.id, data: formData })} className="text-primary font-mono text-xs flex items-center gap-1"><Save className="w-3 h-3" /> SAVE</button>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground font-mono text-xs flex items-center gap-1"><X className="w-3 h-3" /> CANCEL</button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-primary">#{node.position}</span>
                    <h3 className="font-display font-bold truncate">{node.title}</h3>
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 ${node.status === "unlocked" ? "text-green-500 bg-green-500/10" : "text-yellow-500 bg-yellow-500/10"}`}>{node.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{node.summary}</p>
                </div>
              )}
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => { setEditingId(node.id); setFormData({ title: node.title, content: node.content, summary: node.summary }); }} className="text-muted-foreground hover:text-white p-1 transition-colors"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm("Delete this node?")) deleteMutation.mutate(node.id); }} className="text-muted-foreground hover:text-red-500 p-1 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
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

  const { data: holes = [] } = useQuery<RabbitHole[]>({ queryKey: ["/api/holes"] });
  const selectedSlug = holes.find(h => h.id === selectedHole)?.slug;
  const { data: claims = [], isLoading } = useQuery<Claim[]>({
    queryKey: [`/api/holes/${selectedSlug}/claims`],
    enabled: !!selectedSlug,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/claims", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/claims`] }); setShowCreate(false); setFormData({}); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await adminFetch(`/api/admin/claims/${id}`, { method: "PUT", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/claims`] }); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/claims/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/claims`] }),
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <select value={selectedHole || ""} onChange={e => setSelectedHole(parseInt(e.target.value) || null)} className="bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="select-hole-claims">
          <option value="">Select Rabbit Hole</option>
          {holes.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
        </select>
        {selectedHole && (
          <button onClick={() => { setShowCreate(true); setFormData({ holeId: selectedHole, statement: "", stance: "Verified", confidence: 50 }); }} className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors" data-testid="button-create-claim">
            <Plus className="w-4 h-4" /> NEW CLAIM
          </button>
        )}
      </div>

      {showCreate && (
        <div className="border border-primary/20 bg-primary/[0.02] p-6 mb-6">
          <input placeholder="Statement" value={formData.statement || ""} onChange={e => setFormData({ ...formData, statement: e.target.value })} className="w-full bg-white/5 border border-white/10 p-2 text-sm font-mono mb-4 focus:outline-none focus:border-primary/50" />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <select value={formData.stance || "Verified"} onChange={e => setFormData({ ...formData, stance: e.target.value })} className="bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50">
              <option value="Verified">Verified</option><option value="Disputed">Disputed</option><option value="Speculative">Speculative</option>
            </select>
            <input type="number" placeholder="Confidence %" value={formData.confidence || 50} onChange={e => setFormData({ ...formData, confidence: parseInt(e.target.value) || 0 })} className="bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => createMutation.mutate(formData)} className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors flex items-center gap-2"><Save className="w-3 h-3" /> SAVE</button>
            <button onClick={() => setShowCreate(false)} className="bg-white/5 border border-white/10 text-muted-foreground px-4 py-2 font-mono text-xs hover:text-white transition-colors flex items-center gap-2"><X className="w-3 h-3" /> CANCEL</button>
          </div>
        </div>
      )}

      {!selectedHole ? (
        <p className="font-mono text-sm text-muted-foreground text-center py-12">SELECT A RABBIT HOLE TO MANAGE ITS CLAIMS</p>
      ) : isLoading ? (
        <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {claims.map(claim => (
            <div key={claim.id} className="border border-white/10 p-4 flex items-center justify-between group hover:border-white/20 transition-colors" data-testid={`admin-claim-${claim.id}`}>
              {editingId === claim.id ? (
                <div className="flex-1 mr-4 space-y-2">
                  <input value={formData.statement || ""} onChange={e => setFormData({ ...formData, statement: e.target.value })} className="w-full bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50" />
                  <div className="flex gap-2">
                    <button onClick={() => updateMutation.mutate({ id: claim.id, data: formData })} className="text-primary font-mono text-xs flex items-center gap-1"><Save className="w-3 h-3" /> SAVE</button>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground font-mono text-xs flex items-center gap-1"><X className="w-3 h-3" /> CANCEL</button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 ${claim.stance === "Verified" ? "text-green-500 bg-green-500/10" : claim.stance === "Disputed" ? "text-yellow-500 bg-yellow-500/10" : "text-orange-500 bg-orange-500/10"}`}>{claim.stance}</span>
                    <span className="font-mono text-xs text-muted-foreground">{claim.confidence}%</span>
                  </div>
                  <p className="text-sm truncate">{claim.statement}</p>
                </div>
              )}
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => { setEditingId(claim.id); setFormData({ statement: claim.statement, stance: claim.stance, confidence: claim.confidence }); }} className="text-muted-foreground hover:text-white p-1 transition-colors"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm("Delete this claim?")) deleteMutation.mutate(claim.id); }} className="text-muted-foreground hover:text-red-500 p-1 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
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

  const { data: holes = [] } = useQuery<RabbitHole[]>({ queryKey: ["/api/holes"] });
  const selectedSlug = holes.find(h => h.id === selectedHole)?.slug;
  const { data: sources = [], isLoading } = useQuery<Source[]>({
    queryKey: [`/api/holes/${selectedSlug}/sources`],
    enabled: !!selectedSlug,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/sources", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/sources`] }); setShowCreate(false); setFormData({}); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await adminFetch(`/api/admin/sources/${id}`, { method: "PUT", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/sources`] }); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/sources/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/holes/${selectedSlug}/sources`] }),
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <select value={selectedHole || ""} onChange={e => setSelectedHole(parseInt(e.target.value) || null)} className="bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="select-hole-sources">
          <option value="">Select Rabbit Hole</option>
          {holes.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
        </select>
        {selectedHole && (
          <button onClick={() => { setShowCreate(true); setFormData({ holeId: selectedHole, title: "", author: "", origin: "", publishedDate: "", url: "", summary: "", type: "document", stanceTag: "neutral", credibility: 50 }); }} className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors" data-testid="button-create-source">
            <Plus className="w-4 h-4" /> NEW SOURCE
          </button>
        )}
      </div>

      {showCreate && (
        <div className="border border-primary/20 bg-primary/[0.02] p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input placeholder="Title" value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} className="bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50" />
            <input placeholder="Author" value={formData.author || ""} onChange={e => setFormData({ ...formData, author: e.target.value })} className="bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50" />
            <input placeholder="Origin" value={formData.origin || ""} onChange={e => setFormData({ ...formData, origin: e.target.value })} className="bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50" />
            <input placeholder="URL" value={formData.url || ""} onChange={e => setFormData({ ...formData, url: e.target.value })} className="bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50" />
            <select value={formData.type || "document"} onChange={e => setFormData({ ...formData, type: e.target.value })} className="bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50">
              <option value="document">Document</option><option value="book">Book</option><option value="theory">Theory</option><option value="article">Article</option>
            </select>
            <select value={formData.stanceTag || "neutral"} onChange={e => setFormData({ ...formData, stanceTag: e.target.value })} className="bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50">
              <option value="neutral">Neutral</option><option value="supporting">Supporting</option><option value="critical">Critical</option>
            </select>
            <input type="number" placeholder="Credibility %" value={formData.credibility || 50} onChange={e => setFormData({ ...formData, credibility: parseInt(e.target.value) || 0 })} className="bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50" />
          </div>
          <textarea placeholder="Summary" value={formData.summary || ""} onChange={e => setFormData({ ...formData, summary: e.target.value })} className="w-full bg-white/5 border border-white/10 p-2 text-sm font-mono h-20 mb-4 focus:outline-none focus:border-primary/50 resize-none" />
          <div className="flex gap-2">
            <button onClick={() => createMutation.mutate(formData)} className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors flex items-center gap-2"><Save className="w-3 h-3" /> SAVE</button>
            <button onClick={() => setShowCreate(false)} className="bg-white/5 border border-white/10 text-muted-foreground px-4 py-2 font-mono text-xs hover:text-white transition-colors flex items-center gap-2"><X className="w-3 h-3" /> CANCEL</button>
          </div>
        </div>
      )}

      {!selectedHole ? (
        <p className="font-mono text-sm text-muted-foreground text-center py-12">SELECT A RABBIT HOLE TO MANAGE ITS SOURCES</p>
      ) : isLoading ? (
        <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {sources.map(source => (
            <div key={source.id} className="border border-white/10 p-4 flex items-center justify-between group hover:border-white/20 transition-colors" data-testid={`admin-source-${source.id}`}>
              {editingId === source.id ? (
                <div className="flex-1 mr-4 space-y-2">
                  <input value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-white/5 border border-white/10 p-2 text-sm font-mono focus:outline-none focus:border-primary/50" />
                  <div className="flex gap-2">
                    <button onClick={() => updateMutation.mutate({ id: source.id, data: formData })} className="text-primary font-mono text-xs flex items-center gap-1"><Save className="w-3 h-3" /> SAVE</button>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground font-mono text-xs flex items-center gap-1"><X className="w-3 h-3" /> CANCEL</button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 ${source.type === "document" ? "text-green-500 bg-green-500/10" : "text-blue-400 bg-blue-500/10"}`}>{source.type}</span>
                    <span className="font-mono text-xs text-muted-foreground">{source.credibility}%</span>
                  </div>
                  <h3 className="font-display font-bold text-sm truncate">{source.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{source.author}</p>
                </div>
              )}
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => { setEditingId(source.id); setFormData({ title: source.title, author: source.author, credibility: source.credibility }); }} className="text-muted-foreground hover:text-white p-1 transition-colors"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm("Delete this source?")) deleteMutation.mutate(source.id); }} className="text-muted-foreground hover:text-red-500 p-1 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
