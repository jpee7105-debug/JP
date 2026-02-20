import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Plus, Trash2, Edit3, Save, X, Shield, LogOut, Radio, Users, MessageSquare, Play, Pause, Square, Eye, EyeOff, Clock, AlertTriangle, Crown } from "lucide-react";
import type { Employee, Creator, Stream, StreamReplay, LiveChatMessage, ChatModerationAction } from "@shared/schema";

type AdminEmployee = Omit<Employee, "passwordHash">;

function adminFetch(url: string, opts?: RequestInit) {
  return fetch(url, { ...opts, credentials: "include", headers: { "Content-Type": "application/json", ...opts?.headers } });
}

type LiveTab = "creators" | "streams" | "chat";

export default function AdminLive() {
  const [employee, setEmployee] = useState<AdminEmployee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<LiveTab>("streams");

  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(emp => { setEmployee(emp); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!employee) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground font-mono text-sm mb-4">Please log in to the admin panel first.</p>
        <a href="/admin" className="text-primary font-mono text-sm hover:underline" data-testid="link-admin-login">Go to Admin Login</a>
      </div>
    </div>
  );

  const role = employee.role as "Admin" | "Editor" | "Moderator";
  const canEdit = role === "Admin" || role === "Editor";
  const isAdmin = role === "Admin";

  if (!canEdit) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground font-mono">Insufficient permissions</p></div>;

  const tabs: { id: LiveTab; label: string; icon: any }[] = [
    { id: "streams", label: "Streams", icon: Play },
    { id: "creators", label: "Creators", icon: Users },
    { id: "chat", label: "Chat Moderation", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen" data-testid="page-admin-live">
      <div className="border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radio className="w-5 h-5 text-primary" />
          <h1 className="font-display text-xl font-bold uppercase tracking-wider">Live Admin</h1>
        </div>
        <div className="flex items-center gap-4">
          <a href="/admin" className="text-xs font-mono text-muted-foreground hover:text-white" data-testid="link-back-admin">← Admin CMS</a>
          <span className="text-xs font-mono text-muted-foreground">{employee.name} <span className="text-primary/60">({role})</span></span>
        </div>
      </div>

      <div className="flex border-b border-white/5">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-mono text-xs uppercase transition-colors border-b-2 flex items-center gap-2 ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-white"}`}
            data-testid={`live-tab-${tab.id}`}
          >
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="container mx-auto px-6 py-8">
        {activeTab === "creators" && <CreatorsManager isAdmin={isAdmin} />}
        {activeTab === "streams" && <StreamsManager isAdmin={isAdmin} role={role} employeeId={employee.id} />}
        {activeTab === "chat" && <ChatModeration employeeId={employee.id} />}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Draft: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    Review: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    Published: "text-green-500 bg-green-500/10 border-green-500/20",
  };
  return <span className={`font-mono text-[10px] px-1.5 py-0.5 border ${colors[status] || "text-muted-foreground bg-white/5 border-white/10"}`}>{status.toUpperCase()}</span>;
}

function StateBadge({ state }: { state: string }) {
  const colors: Record<string, string> = {
    upcoming: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    live: "text-red-500 bg-red-500/10 border-red-500/20",
    ended: "text-muted-foreground bg-white/5 border-white/10",
  };
  return <span className={`font-mono text-[10px] px-1.5 py-0.5 border ${colors[state] || "text-muted-foreground bg-white/5 border-white/10"}`}>{state.toUpperCase()}</span>;
}

function CreatorsManager({ isAdmin }: { isAdmin: boolean }) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});

  const { data: allCreators = [], isLoading } = useQuery<Creator[]>({
    queryKey: ["/api/admin/creators"],
    queryFn: () => adminFetch("/api/admin/creators").then(r => r.json()),
  });

  const { data: employees = [] } = useQuery<AdminEmployee[]>({
    queryKey: ["/api/admin/employees-list"],
    queryFn: () => adminFetch("/api/admin/me").then(async r => {
      const allEmps = await adminFetch("/api/admin/employees").then(r2 => r2.json());
      return allEmps;
    }),
  });

  const createMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/creators", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/creators"] }); setShowCreate(false); setFormData({}); },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await adminFetch(`/api/admin/creators/${id}`, { method: "PUT", body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/creators"] }); setEditingId(null); setFormData({}); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/creators/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/creators"] }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div data-testid="creators-manager">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-lg font-bold uppercase">Creators</h2>
        <button onClick={() => { setShowCreate(!showCreate); setFormData({}); }} className="flex items-center gap-2 text-primary font-mono text-xs hover:text-primary/80" data-testid="button-create-creator">
          <Plus className="w-4 h-4" /> ADD CREATOR
        </button>
      </div>

      {showCreate && (
        <div className="border border-primary/20 bg-primary/5 p-4 mb-4 space-y-3">
          <div>
            <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Employee <span className="text-primary">*</span></label>
            <select value={formData.employeeId || ""} onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="select-creator-employee">
              <option value="">Select employee...</option>
              {(Array.isArray(employees) ? employees : []).filter((e: any) => e.isActive).map((e: any) => <option key={e.id} value={e.id}>{e.name} ({e.email})</option>)}
            </select>
          </div>
          <InputField label="Handle" required value={formData.handle || ""} onChange={v => setFormData({ ...formData, handle: v })} testId="input-creator-handle" placeholder="unique-handle" />
          <InputField label="Display Name" required value={formData.displayName || ""} onChange={v => setFormData({ ...formData, displayName: v })} testId="input-creator-name" />
          <InputField label="Bio" value={formData.bio || ""} onChange={v => setFormData({ ...formData, bio: v })} testId="input-creator-bio" />
          <InputField label="Avatar URL" value={formData.avatarUrl || ""} onChange={v => setFormData({ ...formData, avatarUrl: v })} testId="input-creator-avatar" />
          <InputField label="Banner URL" value={formData.bannerUrl || ""} onChange={v => setFormData({ ...formData, bannerUrl: v })} testId="input-creator-banner" />
          <button onClick={() => createMut.mutate(formData)} disabled={!formData.handle || !formData.displayName || !formData.employeeId || createMut.isPending}
            className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs uppercase hover:bg-primary/20 disabled:opacity-50" data-testid="button-save-creator">
            <Save className="w-3 h-3" /> {createMut.isPending ? "Saving..." : "Save"}
          </button>
          {createMut.isError && <p className="text-xs font-mono text-red-500">{(createMut.error as Error).message}</p>}
        </div>
      )}

      <div className="space-y-2">
        {allCreators.map(c => (
          <div key={c.id} className="border border-white/10 bg-white/[0.02] p-3 flex items-center justify-between" data-testid={`creator-${c.id}`}>
            {editingId === c.id ? (
              <div className="flex-1 space-y-2 mr-4">
                <InputField label="Handle" value={formData.handle || ""} onChange={v => setFormData({ ...formData, handle: v })} />
                <InputField label="Display Name" value={formData.displayName || ""} onChange={v => setFormData({ ...formData, displayName: v })} />
                <InputField label="Bio" value={formData.bio || ""} onChange={v => setFormData({ ...formData, bio: v })} />
                <InputField label="Avatar URL" value={formData.avatarUrl || ""} onChange={v => setFormData({ ...formData, avatarUrl: v })} />
                <InputField label="Banner URL" value={formData.bannerUrl || ""} onChange={v => setFormData({ ...formData, bannerUrl: v })} />
                <div className="flex gap-2">
                  <button onClick={() => updateMut.mutate({ id: c.id, data: formData })} className="text-primary text-xs font-mono"><Save className="w-3 h-3 inline mr-1" />Save</button>
                  <button onClick={() => { setEditingId(null); setFormData({}); }} className="text-muted-foreground text-xs font-mono"><X className="w-3 h-3 inline mr-1" />Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  {c.avatarUrl ? <img src={c.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" /> : <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><Users className="w-4 h-4 text-primary" /></div>}
                  <div>
                    <span className="font-mono text-sm font-bold">{c.displayName}</span>
                    <span className="ml-2 text-[10px] font-mono text-primary/60">@{c.handle}</span>
                    <p className="text-[10px] font-mono text-muted-foreground">{c.bio?.slice(0, 60)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono ${c.isActive ? "text-green-500" : "text-red-400"}`}>{c.isActive ? "ACTIVE" : "INACTIVE"}</span>
                  <button onClick={() => { setEditingId(c.id); setFormData({ handle: c.handle, displayName: c.displayName, bio: c.bio, avatarUrl: c.avatarUrl, bannerUrl: c.bannerUrl }); }}
                    className="text-muted-foreground hover:text-white" data-testid={`button-edit-creator-${c.id}`}><Edit3 className="w-4 h-4" /></button>
                  {isAdmin && <button onClick={() => { if (confirm("Delete this creator?")) deleteMut.mutate(c.id); }}
                    className="text-red-400 hover:text-red-300" data-testid={`button-delete-creator-${c.id}`}><Trash2 className="w-4 h-4" /></button>}
                </div>
              </>
            )}
          </div>
        ))}
        {allCreators.length === 0 && <p className="text-sm font-mono text-muted-foreground py-4">No creators yet. Add one to get started.</p>}
      </div>
    </div>
  );
}

function StreamsManager({ isAdmin, role, employeeId }: { isAdmin: boolean; role: string; employeeId: string }) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");

  const { data: allStreams = [], isLoading } = useQuery<Stream[]>({
    queryKey: ["/api/admin/streams"],
    queryFn: () => adminFetch("/api/admin/streams").then(r => r.json()),
  });

  const { data: allCreators = [] } = useQuery<Creator[]>({
    queryKey: ["/api/admin/creators"],
    queryFn: () => adminFetch("/api/admin/creators").then(r => r.json()),
  });

  const createMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/streams", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/streams"] }); setShowCreate(false); setFormData({}); },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await adminFetch(`/api/admin/streams/${id}`, { method: "PUT", body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/streams"] }); setEditingId(null); setFormData({}); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/streams/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/streams"] }),
  });

  const filtered = allStreams.filter(s => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (stateFilter !== "all" && s.streamState !== stateFilter) return false;
    return true;
  });

  const creatorMap = Object.fromEntries(allCreators.map(c => [c.id, c]));

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div data-testid="streams-manager">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold uppercase">Streams</h2>
        <button onClick={() => { setShowCreate(!showCreate); setFormData({ visibility: "premium", provider: "custom_iframe", chatEnabled: true, tags: [] }); }}
          className="flex items-center gap-2 text-primary font-mono text-xs hover:text-primary/80" data-testid="button-create-stream">
          <Plus className="w-4 h-4" /> NEW STREAM
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="select-status-filter">
          <option value="all">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Review">Review</option>
          <option value="Published">Published</option>
        </select>
        <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
          className="bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="select-state-filter">
          <option value="all">All States</option>
          <option value="upcoming">Upcoming</option>
          <option value="live">Live</option>
          <option value="ended">Ended</option>
        </select>
      </div>

      {showCreate && (
        <div className="border border-primary/20 bg-primary/5 p-4 mb-4 space-y-3">
          <div>
            <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Creator <span className="text-primary">*</span></label>
            <select value={formData.creatorId || ""} onChange={e => setFormData({ ...formData, creatorId: parseInt(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="select-stream-creator">
              <option value="">Select creator...</option>
              {allCreators.map(c => <option key={c.id} value={c.id}>{c.displayName} (@{c.handle})</option>)}
            </select>
          </div>
          <InputField label="Title" required value={formData.title || ""} onChange={v => setFormData({ ...formData, title: v })} testId="input-stream-title" />
          <div>
            <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Description</label>
            <textarea value={formData.description || ""} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3}
              className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50 resize-none" data-testid="input-stream-description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Provider</label>
              <select value={formData.provider || "custom_iframe"} onChange={e => setFormData({ ...formData, provider: e.target.value })}
                className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="select-stream-provider">
                <option value="custom_iframe">Custom iFrame</option>
                <option value="youtube_live">YouTube Live</option>
                <option value="twitch">Twitch</option>
              </select>
            </div>
            <InputField label="Embed URL" required value={formData.embedUrl || ""} onChange={v => setFormData({ ...formData, embedUrl: v })} testId="input-stream-embed" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Scheduled Start" value={formData.scheduledStart || ""} onChange={v => setFormData({ ...formData, scheduledStart: v })} testId="input-stream-start" placeholder="2026-03-01T20:00" type="datetime-local" />
            <InputField label="Scheduled End" value={formData.scheduledEnd || ""} onChange={v => setFormData({ ...formData, scheduledEnd: v })} testId="input-stream-end" placeholder="2026-03-01T22:00" type="datetime-local" />
          </div>
          <InputField label="Thumbnail URL" value={formData.thumbnailUrl || ""} onChange={v => setFormData({ ...formData, thumbnailUrl: v })} testId="input-stream-thumbnail" />
          <InputField label="Tags (comma separated)" value={(formData.tags || []).join(", ")} onChange={v => setFormData({ ...formData, tags: v.split(",").map((t: string) => t.trim()).filter(Boolean) })} testId="input-stream-tags" />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 font-mono text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={formData.visibility === "premium"} onChange={e => setFormData({ ...formData, visibility: e.target.checked ? "premium" : "public" })} data-testid="check-stream-premium" />
              <Crown className="w-3 h-3 text-yellow-500" /> Premium Only
            </label>
            <label className="flex items-center gap-2 font-mono text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={formData.chatEnabled !== false} onChange={e => setFormData({ ...formData, chatEnabled: e.target.checked })} data-testid="check-stream-chat" />
              <MessageSquare className="w-3 h-3" /> Chat Enabled
            </label>
          </div>
          <button onClick={() => createMut.mutate(formData)} disabled={!formData.title || !formData.embedUrl || !formData.creatorId || createMut.isPending}
            className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs uppercase hover:bg-primary/20 disabled:opacity-50" data-testid="button-save-stream">
            <Save className="w-3 h-3" /> {createMut.isPending ? "Saving..." : "Save"}
          </button>
          {createMut.isError && <p className="text-xs font-mono text-red-500">{(createMut.error as Error).message}</p>}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(s => (
          <div key={s.id} className="border border-white/10 bg-white/[0.02] p-4" data-testid={`stream-${s.id}`}>
            {editingId === s.id ? (
              <div className="space-y-3">
                <InputField label="Title" value={formData.title || ""} onChange={v => setFormData({ ...formData, title: v })} />
                <InputField label="Embed URL" value={formData.embedUrl || ""} onChange={v => setFormData({ ...formData, embedUrl: v })} />
                <InputField label="Thumbnail URL" value={formData.thumbnailUrl || ""} onChange={v => setFormData({ ...formData, thumbnailUrl: v })} />
                <InputField label="Tags" value={(formData.tags || []).join(", ")} onChange={v => setFormData({ ...formData, tags: v.split(",").map((t: string) => t.trim()).filter(Boolean) })} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Status</label>
                    <select value={formData.status || "Draft"} onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50">
                      <option value="Draft">Draft</option>
                      <option value="Review">Review</option>
                      {isAdmin && <option value="Published">Published</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Stream State</label>
                    <select value={formData.streamState || "upcoming"} onChange={e => setFormData({ ...formData, streamState: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50">
                      <option value="upcoming">Upcoming</option>
                      <option value="live">Live</option>
                      <option value="ended">Ended</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 font-mono text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={formData.visibility === "premium"} onChange={e => setFormData({ ...formData, visibility: e.target.checked ? "premium" : "public" })} />
                    <Crown className="w-3 h-3 text-yellow-500" /> Premium
                  </label>
                  <label className="flex items-center gap-2 font-mono text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={formData.chatEnabled !== false} onChange={e => setFormData({ ...formData, chatEnabled: e.target.checked })} />
                    <MessageSquare className="w-3 h-3" /> Chat
                  </label>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateMut.mutate({ id: s.id, data: formData })} disabled={updateMut.isPending}
                    className="text-primary text-xs font-mono flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
                  <button onClick={() => { setEditingId(null); setFormData({}); }} className="text-muted-foreground text-xs font-mono flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
                </div>
                {updateMut.isError && <p className="text-xs font-mono text-red-500">{(updateMut.error as Error).message}</p>}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={s.status} />
                    <StateBadge state={s.streamState} />
                    {s.visibility === "premium" && <span className="text-[10px] font-mono text-yellow-500 border border-yellow-500/20 px-1.5 py-0.5">PREMIUM</span>}
                    <span className="font-mono text-sm font-bold truncate">{s.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                    <span>{creatorMap[s.creatorId]?.displayName || "Unknown"}</span>
                    <span>{s.provider}</span>
                    {s.scheduledStart && <span><Clock className="w-3 h-3 inline mr-1" />{new Date(s.scheduledStart).toLocaleString()}</span>}
                    {s.tags && (s.tags as string[]).length > 0 && <span>{(s.tags as string[]).join(", ")}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {s.status === "Draft" && (
                    <button onClick={() => updateMut.mutate({ id: s.id, data: { status: "Review" } })}
                      className="px-3 py-1.5 text-[10px] font-mono uppercase border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                      data-testid={`button-stream-review-${s.id}`}>→ Review</button>
                  )}
                  {s.status === "Review" && isAdmin && (
                    <button onClick={() => updateMut.mutate({ id: s.id, data: { status: "Published" } })}
                      className="px-3 py-1.5 text-[10px] font-mono uppercase border border-green-500/30 text-green-500 hover:bg-green-500/10"
                      data-testid={`button-stream-publish-${s.id}`}>Publish</button>
                  )}
                  {s.streamState === "upcoming" && s.status === "Published" && (
                    <button onClick={() => updateMut.mutate({ id: s.id, data: { streamState: "live", startedAt: new Date().toISOString() } })}
                      className="px-3 py-1.5 text-[10px] font-mono uppercase border border-red-500/30 text-red-500 hover:bg-red-500/10"
                      data-testid={`button-go-live-${s.id}`}><Play className="w-3 h-3 inline mr-1" />Go Live</button>
                  )}
                  {s.streamState === "live" && (
                    <button onClick={() => updateMut.mutate({ id: s.id, data: { streamState: "ended", endedAt: new Date().toISOString() } })}
                      className="px-3 py-1.5 text-[10px] font-mono uppercase border border-white/20 text-muted-foreground hover:bg-white/5"
                      data-testid={`button-end-stream-${s.id}`}><Square className="w-3 h-3 inline mr-1" />End</button>
                  )}
                  <button onClick={() => { setEditingId(s.id); setFormData({ title: s.title, embedUrl: s.embedUrl, thumbnailUrl: s.thumbnailUrl, tags: s.tags, status: s.status, streamState: s.streamState, visibility: s.visibility, chatEnabled: s.chatEnabled }); }}
                    className="text-muted-foreground hover:text-white" data-testid={`button-edit-stream-${s.id}`}><Edit3 className="w-4 h-4" /></button>
                  {isAdmin && <button onClick={() => { if (confirm("Delete this stream?")) deleteMut.mutate(s.id); }}
                    className="text-red-400 hover:text-red-300" data-testid={`button-delete-stream-${s.id}`}><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm font-mono text-muted-foreground py-4">No streams found.</p>}
      </div>
    </div>
  );
}

function ChatModeration({ employeeId }: { employeeId: string }) {
  const [selectedStreamId, setSelectedStreamId] = useState<number | null>(null);

  const { data: allStreams = [] } = useQuery<Stream[]>({
    queryKey: ["/api/admin/streams"],
    queryFn: () => adminFetch("/api/admin/streams").then(r => r.json()),
  });

  const { data: messages = [] } = useQuery<LiveChatMessage[]>({
    queryKey: ["/api/admin/chat", selectedStreamId],
    queryFn: () => adminFetch(`/api/admin/chat/${selectedStreamId}`).then(r => r.json()),
    enabled: !!selectedStreamId,
    refetchInterval: 5000,
  });

  const { data: modActions = [] } = useQuery<ChatModerationAction[]>({
    queryKey: ["/api/admin/chat/moderation", selectedStreamId],
    queryFn: () => adminFetch(`/api/admin/chat/moderation/${selectedStreamId}`).then(r => r.json()),
    enabled: !!selectedStreamId,
  });

  const deleteMsg = useMutation({
    mutationFn: async ({ msgId, streamId, username }: { msgId: number; streamId: number; username: string }) => {
      await adminFetch(`/api/admin/chat/${msgId}/delete`, { method: "POST", body: JSON.stringify({ streamId, targetUsername: username }) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chat", selectedStreamId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chat/moderation", selectedStreamId] });
    },
  });

  const banUser = useMutation({
    mutationFn: async ({ streamId, username, reason }: { streamId: number; username: string; reason: string }) => {
      await adminFetch("/api/admin/chat/moderate", { method: "POST", body: JSON.stringify({ streamId, actionType: "ban", targetUsername: username, reason }) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/chat/moderation", selectedStreamId] }),
  });

  return (
    <div data-testid="chat-moderation">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-lg font-bold uppercase">Chat Moderation</h2>
        <select value={selectedStreamId || ""} onChange={e => setSelectedStreamId(e.target.value ? parseInt(e.target.value) : null)}
          className="bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="select-chat-stream">
          <option value="">Select Stream...</option>
          {allStreams.map(s => <option key={s.id} value={s.id}>{s.title} ({s.streamState})</option>)}
        </select>
      </div>

      {selectedStreamId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-mono text-sm font-bold mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" /> Messages ({messages.length})</h3>
            <div className="border border-white/10 max-h-[500px] overflow-y-auto">
              {messages.map(msg => (
                <div key={msg.id} className={`p-3 border-b border-white/5 flex items-start justify-between gap-3 ${msg.isDeleted ? "opacity-40" : ""}`} data-testid={`chat-msg-${msg.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs font-bold text-primary">{msg.usernameDisplay}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      {msg.isDeleted && <span className="text-[10px] font-mono text-red-400">[DELETED]</span>}
                    </div>
                    <p className="text-sm text-foreground/80">{msg.message}</p>
                  </div>
                  {!msg.isDeleted && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => deleteMsg.mutate({ msgId: msg.id, streamId: selectedStreamId, username: msg.usernameDisplay })}
                        className="text-red-400 hover:text-red-300 p-1" title="Delete message" data-testid={`button-delete-msg-${msg.id}`}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => { if (confirm(`Ban user ${msg.usernameDisplay}?`)) banUser.mutate({ streamId: selectedStreamId, username: msg.usernameDisplay, reason: "Banned by moderator" }); }}
                        className="text-orange-400 hover:text-orange-300 p-1" title="Ban user" data-testid={`button-ban-user-${msg.id}`}>
                        <AlertTriangle className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {messages.length === 0 && <p className="p-4 text-sm font-mono text-muted-foreground">No messages yet.</p>}
            </div>
          </div>

          <div>
            <h3 className="font-mono text-sm font-bold mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Moderation Log ({modActions.length})</h3>
            <div className="border border-white/10 max-h-[500px] overflow-y-auto">
              {modActions.map(a => (
                <div key={a.id} className="p-3 border-b border-white/5" data-testid={`mod-action-${a.id}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 border ${a.actionType === "ban" ? "text-red-400 border-red-500/20" : a.actionType === "delete_message" ? "text-yellow-500 border-yellow-500/20" : "text-muted-foreground border-white/10"}`}>
                      {a.actionType.toUpperCase()}
                    </span>
                    {a.targetUsername && <span className="text-xs font-mono text-primary">{a.targetUsername}</span>}
                    <span className="text-[10px] font-mono text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                  {a.reason && <p className="text-xs text-muted-foreground">{a.reason}</p>}
                </div>
              ))}
              {modActions.length === 0 && <p className="p-4 text-sm font-mono text-muted-foreground">No moderation actions.</p>}
            </div>
          </div>
        </div>
      )}

      {!selectedStreamId && <p className="text-sm font-mono text-muted-foreground py-4">Select a stream to moderate its chat.</p>}
    </div>
  );
}

function InputField({ label, required, value, onChange, testId, placeholder, type }: { label: string; required?: boolean; value: string; onChange: (v: string) => void; testId?: string; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">{label} {required && <span className="text-primary">*</span>}</label>
      <input type={type || "text"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50"
        data-testid={testId} />
    </div>
  );
}
