import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Plus, Trash2, Edit3, Save, X, Calendar, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import type { GlobalTimelineItem, RabbitHole, TimelineEntry } from "@shared/schema";
import { useAdminContext } from "@/components/AdminLayout";

function adminFetch(url: string, opts?: RequestInit) {
  return fetch(url, { ...opts, credentials: "include", headers: { "Content-Type": "application/json", ...opts?.headers } });
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Draft: "text-gray-400 bg-gray-500/10 border-gray-500/20",
    Review: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    Published: "text-green-500 bg-green-500/10 border-green-500/20",
  };
  return <span className={`font-mono text-[10px] px-1.5 py-0.5 border ${colors[status] || "text-muted-foreground bg-white/5 border-white/10"}`} data-testid={`status-badge-${status.toLowerCase()}`}>{status.toUpperCase()}</span>;
}

function LinkTypeBadge({ linkType }: { linkType: string }) {
  const colors: Record<string, string> = {
    investigation: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    node: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    person: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    external: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    timeline_entry: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  };
  return <span className={`font-mono text-[10px] px-1.5 py-0.5 border ${colors[linkType] || "text-muted-foreground bg-white/5 border-white/10"}`}>{linkType.toUpperCase()}</span>;
}

const emptyForm = {
  date: "",
  title: "",
  summary: "",
  featuredImageUrl: "",
  country: "",
  region: "",
  city: "",
  lat: "" as string | number | null,
  lng: "" as string | number | null,
  linkType: "investigation" as string,
  linkId: "",
  linkUrl: "",
  relatedInvestigationId: "" as string | number,
  tags: [] as string[],
  status: "Draft",
  sortPriority: 0,
};

type FormData = typeof emptyForm;

function TimelineForm({ formData, setFormData, onSave, onCancel, saving, error, investigations, isCreate }: {
  formData: FormData;
  setFormData: (data: FormData) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
  investigations: RabbitHole[];
  isCreate: boolean;
}) {
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <div className="border border-primary/20 bg-primary/[0.02] p-6 mb-6 space-y-4" data-testid={isCreate ? "form-create-timeline" : "form-edit-timeline"}>
      <h3 className="font-mono text-xs text-primary uppercase mb-2">{isCreate ? "CREATE NEW TIMELINE ITEM" : "EDIT TIMELINE ITEM"}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Date <span className="text-primary">*</span></label>
          <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
            className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="input-timeline-date" />
        </div>
        <div>
          <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Status</label>
          <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
            className="w-full border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50 bg-white/5" data-testid="select-timeline-status">
            <option value="Draft">Draft</option>
            <option value="Review">Review</option>
            <option value="Published">Published</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Title <span className="text-primary">*</span></label>
        <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
          className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50" placeholder="Timeline item title" data-testid="input-timeline-title" />
      </div>

      <div>
        <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Summary</label>
        <textarea value={formData.summary} onChange={e => setFormData({ ...formData, summary: e.target.value })} rows={3}
          className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50 resize-none" placeholder="Brief summary..." data-testid="input-timeline-summary" />
      </div>

      <div>
        <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Featured Image URL</label>
        <input type="text" value={formData.featuredImageUrl} onChange={e => setFormData({ ...formData, featuredImageUrl: e.target.value })}
          className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50" placeholder="https://..." data-testid="input-timeline-image" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Link Type</label>
          <select value={formData.linkType} onChange={e => setFormData({ ...formData, linkType: e.target.value })}
            className="w-full border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50 bg-white/5" data-testid="select-timeline-linktype">
            <option value="investigation">Investigation</option>
            <option value="node">Node</option>
            <option value="person">Person</option>
            <option value="external">External</option>
            <option value="timeline_entry">Timeline Entry</option>
          </select>
        </div>
        <div>
          <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">{formData.linkType === "external" ? "Link URL" : "Link ID / Slug"}</label>
          {formData.linkType === "external" ? (
            <input type="text" value={formData.linkUrl} onChange={e => setFormData({ ...formData, linkUrl: e.target.value })}
              className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50" placeholder="https://..." data-testid="input-timeline-linkurl" />
          ) : (
            <input type="text" value={formData.linkId} onChange={e => setFormData({ ...formData, linkId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50" placeholder="slug-or-id" data-testid="input-timeline-linkid" />
          )}
        </div>
        <div>
          <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Related Investigation</label>
          <select value={formData.relatedInvestigationId || ""} onChange={e => setFormData({ ...formData, relatedInvestigationId: e.target.value ? parseInt(e.target.value) : "" })}
            className="w-full border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50 bg-white/5" data-testid="select-timeline-investigation">
            <option value="">None</option>
            {investigations.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Country</label>
          <input type="text" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })}
            className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="input-timeline-country" />
        </div>
        <div>
          <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Region</label>
          <input type="text" value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })}
            className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="input-timeline-region" />
        </div>
        <div>
          <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">City</label>
          <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })}
            className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="input-timeline-city" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Latitude</label>
          <input type="text" value={formData.lat} onChange={e => setFormData({ ...formData, lat: e.target.value })}
            className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="input-timeline-lat" />
        </div>
        <div>
          <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Longitude</label>
          <input type="text" value={formData.lng} onChange={e => setFormData({ ...formData, lng: e.target.value })}
            className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="input-timeline-lng" />
        </div>
        <div>
          <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Sort Priority</label>
          <input type="number" value={formData.sortPriority} onChange={e => setFormData({ ...formData, sortPriority: parseInt(e.target.value) || 0 })}
            className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50" data-testid="input-timeline-priority" />
        </div>
      </div>

      <div>
        <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Tags</label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {formData.tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 px-2 py-1 text-xs font-mono border border-primary/30 text-primary bg-primary/10">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-white" data-testid={`remove-tag-${tag}`}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            className="flex-1 bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50" placeholder="Add tag..." data-testid="input-timeline-tag" />
          <button onClick={addTag} className="px-3 py-2 border border-white/10 text-muted-foreground hover:text-white font-mono text-xs" data-testid="button-add-tag">ADD</button>
        </div>
      </div>

      {error && <p className="text-xs font-mono text-red-500 bg-red-500/10 border border-red-500/20 p-3">{error}</p>}

      <div className="flex gap-3">
        <button onClick={onSave} disabled={saving || !formData.title.trim() || !formData.date}
          className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs uppercase hover:bg-primary/20 disabled:opacity-50 transition-colors" data-testid="button-save-timeline">
          <Save className="w-3 h-3" /> {saving ? "SAVING..." : "SAVE"}
        </button>
        <button onClick={onCancel} className="flex items-center gap-2 border border-white/10 text-muted-foreground px-4 py-2 font-mono text-xs uppercase hover:text-white transition-colors" data-testid="button-cancel-timeline">
          <X className="w-3 h-3" /> CANCEL
        </button>
      </div>
    </div>
  );
}

export default function AdminTimeline() {
  const { employee, isAdmin } = useAdminContext();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({ ...emptyForm });
  const [statusFilter, setStatusFilter] = useState("all");
  const [promoteInvestigationId, setPromoteInvestigationId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery<GlobalTimelineItem[]>({
    queryKey: ["/api/admin/timeline"],
    queryFn: () => adminFetch("/api/admin/timeline").then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
  });

  const { data: investigations = [] } = useQuery<RabbitHole[]>({
    queryKey: ["/api/holes?admin=true"],
    queryFn: () => fetch("/api/holes?admin=true", { credentials: "include" }).then(r => r.json()),
  });

  const { data: promoteEntries = [] } = useQuery<TimelineEntry[]>({
    queryKey: ["/api/admin/timeline-entries", promoteInvestigationId],
    queryFn: () => adminFetch(`/api/admin/timeline-entries/${promoteInvestigationId}`).then(r => r.json()),
    enabled: !!promoteInvestigationId,
  });

  const createMut = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data };
      if (!payload.relatedInvestigationId) delete payload.relatedInvestigationId;
      if (!payload.featuredImageUrl) payload.featuredImageUrl = null;
      if (!payload.country) payload.country = null;
      if (!payload.region) payload.region = null;
      if (!payload.city) payload.city = null;
      payload.lat = payload.lat ? parseFloat(payload.lat) : null;
      payload.lng = payload.lng ? parseFloat(payload.lng) : null;
      if (!payload.linkId) payload.linkId = null;
      if (!payload.linkUrl) payload.linkUrl = null;
      const res = await adminFetch("/api/admin/timeline", { method: "POST", body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json().catch(() => ({ message: "Failed" })); throw new Error(e.message || "Failed"); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/timeline"] }); setShowCreate(false); setFormData({ ...emptyForm }); setError(null); },
    onError: (err: Error) => setError(err.message),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const payload = { ...data };
      if (!payload.relatedInvestigationId) delete payload.relatedInvestigationId;
      if (!payload.featuredImageUrl) payload.featuredImageUrl = null;
      if (!payload.country) payload.country = null;
      if (!payload.region) payload.region = null;
      if (!payload.city) payload.city = null;
      payload.lat = payload.lat ? parseFloat(payload.lat) : null;
      payload.lng = payload.lng ? parseFloat(payload.lng) : null;
      if (!payload.linkId) payload.linkId = null;
      if (!payload.linkUrl) payload.linkUrl = null;
      const res = await adminFetch(`/api/admin/timeline/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json().catch(() => ({ message: "Failed" })); throw new Error(e.message || "Failed"); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/timeline"] }); setEditingId(null); setFormData({ ...emptyForm }); setError(null); },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/timeline/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/timeline"] }),
  });

  const promoteMut = useMutation({
    mutationFn: async (entryId: number) => {
      const res = await adminFetch("/api/admin/timeline/promote", { method: "POST", body: JSON.stringify({ entryId: String(entryId) }) });
      if (!res.ok) { const e = await res.json().catch(() => ({ message: "Failed" })); throw new Error(e.message || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/timeline"] });
    },
  });

  const filteredItems = items.filter(item => statusFilter === "all" || item.status === statusFilter);

  const startEdit = (item: GlobalTimelineItem) => {
    setEditingId(item.id);
    setShowCreate(false);
    setError(null);
    setFormData({
      date: item.date || "",
      title: item.title || "",
      summary: item.summary || "",
      featuredImageUrl: item.featuredImageUrl || "",
      country: item.country || "",
      region: item.region || "",
      city: item.city || "",
      lat: item.lat || "",
      lng: item.lng || "",
      linkType: item.linkType || "investigation",
      linkId: item.linkId || "",
      linkUrl: item.linkUrl || "",
      relatedInvestigationId: item.relatedInvestigationId || "",
      tags: (item.tags as string[]) || [],
      status: item.status || "Draft",
      sortPriority: item.sortPriority || 0,
    });
  };

  const investigationMap = Object.fromEntries(investigations.map(h => [h.id, h]));

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div data-testid="page-admin-timeline" className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h1 className="font-display text-lg font-bold uppercase">Global Timeline</h1>
          </div>
          <span className="font-mono text-xs text-muted-foreground">{filteredItems.length} ITEMS</span>
        </div>
        <button onClick={() => { setShowCreate(true); setEditingId(null); setFormData({ ...emptyForm }); setError(null); }}
          className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors" data-testid="button-create-timeline-item">
          <Plus className="w-4 h-4" /> NEW ITEM
        </button>
      </div>

      <div className="flex gap-1 mb-6">
        {["all", "Draft", "Review", "Published"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-2 py-1 font-mono text-[10px] border transition-colors ${statusFilter === s ? "border-primary text-primary bg-primary/10" : "border-white/10 text-muted-foreground hover:text-white"}`}
            data-testid={`filter-timeline-status-${s.toLowerCase()}`}
          >{s.toUpperCase()}</button>
        ))}
      </div>

      {showCreate && (
        <TimelineForm
          formData={formData}
          setFormData={setFormData}
          onSave={() => createMut.mutate(formData)}
          onCancel={() => { setShowCreate(false); setError(null); }}
          saving={createMut.isPending}
          error={error}
          investigations={investigations}
          isCreate={true}
        />
      )}

      {editingId && (
        <TimelineForm
          formData={formData}
          setFormData={setFormData}
          onSave={() => updateMut.mutate({ id: editingId, data: formData })}
          onCancel={() => { setEditingId(null); setError(null); }}
          saving={updateMut.isPending}
          error={error}
          investigations={investigations}
          isCreate={false}
        />
      )}

      <div className="border border-white/10 mb-8">
        <div className="grid grid-cols-[1fr_120px_100px_100px_80px_100px] gap-2 px-4 py-2 border-b border-white/10 bg-white/[0.02]">
          <span className="font-mono text-[10px] text-muted-foreground uppercase">Title</span>
          <span className="font-mono text-[10px] text-muted-foreground uppercase">Date</span>
          <span className="font-mono text-[10px] text-muted-foreground uppercase">Status</span>
          <span className="font-mono text-[10px] text-muted-foreground uppercase">Link Type</span>
          <span className="font-mono text-[10px] text-muted-foreground uppercase">Priority</span>
          <span className="font-mono text-[10px] text-muted-foreground uppercase">Actions</span>
        </div>
        {filteredItems.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="font-mono text-sm text-muted-foreground">No timeline items found.</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className={`grid grid-cols-[1fr_120px_100px_100px_80px_100px] gap-2 px-4 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors ${editingId === item.id ? "bg-primary/5" : ""}`}
              data-testid={`timeline-item-${item.id}`}>
              <div className="min-w-0">
                <span className="font-mono text-sm truncate block">{item.title}</span>
                {item.tags && (item.tags as string[]).length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {(item.tags as string[]).slice(0, 3).map(tag => (
                      <span key={tag} className="font-mono text-[9px] px-1 py-0.5 border border-white/10 text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <span className="font-mono text-xs text-muted-foreground self-center">{item.date}</span>
              <div className="self-center"><StatusBadge status={item.status} /></div>
              <div className="self-center"><LinkTypeBadge linkType={item.linkType} /></div>
              <div className="self-center flex items-center gap-1">
                <span className="font-mono text-xs text-muted-foreground">{item.sortPriority}</span>
              </div>
              <div className="self-center flex items-center gap-2">
                <button onClick={() => startEdit(item)} className="text-muted-foreground hover:text-white transition-colors" data-testid={`button-edit-timeline-${item.id}`}>
                  <Edit3 className="w-4 h-4" />
                </button>
                {isAdmin && (
                  <button onClick={() => { if (confirm("Delete this timeline item?")) deleteMut.mutate(item.id); }}
                    className="text-red-400 hover:text-red-300 transition-colors" data-testid={`button-delete-timeline-${item.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border border-white/10 p-6" data-testid="promote-section">
        <div className="flex items-center gap-2 mb-4">
          <ArrowUp className="w-4 h-4 text-primary" />
          <h2 className="font-mono text-sm uppercase">Promote from Investigation</h2>
        </div>
        <p className="font-mono text-xs text-muted-foreground mb-4">Select an investigation to view its timeline entries and promote them to the global timeline.</p>

        <div className="mb-4">
          <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">Investigation</label>
          <select value={promoteInvestigationId || ""} onChange={e => setPromoteInvestigationId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full max-w-md border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50 bg-white/5" data-testid="select-promote-investigation">
            <option value="">Select investigation...</option>
            {investigations.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
          </select>
        </div>

        {promoteInvestigationId && (
          <div className="space-y-2">
            {promoteEntries.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground py-4">No timeline entries for this investigation.</p>
            ) : (
              promoteEntries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between border border-white/10 bg-white/[0.02] p-3" data-testid={`promote-entry-${entry.id}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={entry.status} />
                      <span className="font-mono text-sm">{entry.title}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                      <span>{entry.date}</span>
                      <span>{entry.description?.slice(0, 80)}</span>
                    </div>
                  </div>
                  <button onClick={() => promoteMut.mutate(entry.id)} disabled={promoteMut.isPending}
                    className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-3 py-1.5 font-mono text-xs hover:bg-primary/20 disabled:opacity-50 transition-colors" data-testid={`button-promote-${entry.id}`}>
                    <ArrowUp className="w-3 h-3" /> PROMOTE
                  </button>
                </div>
              ))
            )}
            {promoteMut.isError && <p className="text-xs font-mono text-red-500 mt-2">{(promoteMut.error as Error).message}</p>}
          </div>
        )}
      </div>
    </div>
  );
}