import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useParams } from "wouter";
import { useAdminContext } from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Plus, Trash2, Save, X, GripVertical, Image, FileText,
  CheckCircle2, Calendar, Link2, Edit3, AlertTriangle, BookOpen,
  PanelRightClose, PanelRightOpen, ArrowLeft, ChevronRight, Search
} from "lucide-react";
import type { RabbitHole, DepthNode, Claim, Source, Media } from "@shared/schema";

type AdminEmployee = { id: string; name: string; email: string; role: string };

function adminFetch(url: string, opts?: RequestInit) {
  return fetch(url, {
    ...opts,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
}

function adminQueryFetch(url: string) {
  const sep = url.includes("?") ? "&" : "?";
  return fetch(`${url}${sep}admin=true`, { credentials: "include" }).then(r => {
    if (!r.ok) throw new Error("Unauthorized");
    return r.json();
  });
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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Draft: "text-gray-400 bg-gray-500/10 border-gray-500/20",
    Review: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    Published: "text-green-500 bg-green-500/10 border-green-500/20",
  };
  return <span className={`font-mono text-[10px] px-1.5 py-0.5 border ${colors[status] || "text-muted-foreground bg-white/5 border-white/10"}`}>{status.toUpperCase()}</span>;
}

function NodeEditor({ nodeId, holeId, holeSlug }: { nodeId: number; holeId: number; holeSlug: string }) {
  const { toast } = useToast();
  const titleRef = useRef<HTMLInputElement>(null);
  const [showAddMedia, setShowAddMedia] = useState(false);
  const [showAddClaim, setShowAddClaim] = useState(false);
  const [showAddTimeline, setShowAddTimeline] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [mediaForm, setMediaForm] = useState<any>({});
  const [claimForm, setClaimForm] = useState<any>({});
  const [timelineForm, setTimelineForm] = useState<any>({});
  const [sourceForm, setSourceForm] = useState<any>({});
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

  const { data: nodeMedia = [] } = useQuery<Media[]>({
    queryKey: [`/api/admin/nodes/${nodeId}/media`],
    queryFn: () => adminFetch(`/api/admin/nodes/${nodeId}/media`).then(r => r.ok ? r.json() : []),
    enabled: !!nodeId,
  });

  const { data: nodeClaims = [] } = useQuery<Claim[]>({
    queryKey: [`/api/admin/nodes/${nodeId}/claims`],
    queryFn: () => adminFetch(`/api/admin/nodes/${nodeId}/claims`).then(r => r.ok ? r.json() : []),
    enabled: !!nodeId,
  });

  const { data: nodeSources = [] } = useQuery<Source[]>({
    queryKey: [`/api/admin/nodes/${nodeId}/sources`],
    queryFn: () => adminFetch(`/api/admin/nodes/${nodeId}/sources`).then(r => r.ok ? r.json() : []),
    enabled: !!nodeId,
  });

  const invalidateNodeData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [`/api/admin/nodes/${nodeId}/claims`] });
    queryClient.invalidateQueries({ queryKey: [`/api/admin/nodes/${nodeId}/sources`] });
    queryClient.invalidateQueries({ queryKey: [`/api/admin/nodes/${nodeId}/media`] });
    queryClient.invalidateQueries({ queryKey: [`/api/holes/${holeSlug}/depth-nodes`] });
  }, [nodeId, holeSlug]);

  const updateNodeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch(`/api/admin/depth-nodes/${nodeId}`, { method: "PUT", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/holes/${holeSlug}/depth-nodes`] });
      toast({ title: "Saved", description: "Node updated successfully" });
    },
  });

  const createMediaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/media", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/admin/nodes/${nodeId}/media`] }); setShowAddMedia(false); setMediaForm({}); },
  });

  const deleteMediaMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/media/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/admin/nodes/${nodeId}/media`] }),
  });

  const createClaimMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/claims", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/admin/nodes/${nodeId}/claims`] }); setShowAddClaim(false); setClaimForm({}); },
  });

  const updateClaimMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await adminFetch(`/api/admin/claims/${id}`, { method: "PUT", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/admin/nodes/${nodeId}/claims`] }); setEditingClaimId(null); },
  });

  const deleteClaimMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/claims/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/admin/nodes/${nodeId}/claims`] }),
  });

  const createSourceMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/sources", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/admin/nodes/${nodeId}/sources`] }); setShowAddSource(false); setSourceForm({}); },
  });

  const deleteSourceMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/sources/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/admin/nodes/${nodeId}/sources`] }),
  });

  if (!node) return <div className="py-12 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-primary" /><p className="font-mono text-[10px] text-muted-foreground mt-2">Loading node...</p></div>;

  const wordCount = contentValue.split(/\s+/).filter(Boolean).length;
  const timeline = (node.timeline as { year: string; event: string; type: string }[]) || [];

  return (
    <div data-testid="node-editor" className="space-y-0">
      <div className="mb-8">
        <input
          ref={titleRef}
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
                  <button onClick={() => { if (confirm("Delete?")) deleteMediaMutation.mutate(m.id); }} className="text-muted-foreground hover:text-red-500 p-1" data-testid={`button-delete-media-${m.id}`}><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => { setShowAddMedia(!showAddMedia); setMediaForm({ holeId, nodeId, title: "", url: "", type: "image", caption: "" }); }} className="flex items-center gap-2 text-primary font-mono text-xs hover:text-primary/80" data-testid="button-add-media">
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
              <button onClick={() => { if (mediaForm.title?.trim() && mediaForm.url?.trim()) createMediaMutation.mutate(mediaForm); }} disabled={createMediaMutation.isPending} className="bg-primary/10 border border-primary/30 text-primary px-4 py-1.5 font-mono text-xs flex items-center gap-2 disabled:opacity-50" data-testid="button-save-media"><Save className="w-3 h-3" /> SAVE</button>
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
                      <button onClick={() => updateClaimMutation.mutate({ id: claim.id, data: editClaimForm })} className="text-primary font-mono text-xs flex items-center gap-1" data-testid={`button-save-claim-${claim.id}`}><Save className="w-3 h-3" /> SAVE</button>
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
                      <button onClick={() => { setEditingClaimId(claim.id); setEditClaimForm({ statement: claim.statement, stance: claim.stance, confidence: claim.confidence }); }} className="text-muted-foreground hover:text-white p-1" data-testid={`button-edit-claim-${claim.id}`}><Edit3 className="w-3 h-3" /></button>
                      <button onClick={() => { if (confirm("Delete?")) deleteClaimMutation.mutate(claim.id); }} className="text-muted-foreground hover:text-red-500 p-1" data-testid={`button-delete-claim-${claim.id}`}><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <button onClick={() => { setShowAddClaim(!showAddClaim); setClaimForm({ holeId, nodeId, statement: "", stance: "Verified", confidence: 50, evidence: [], counterpoints: [] }); }} className="flex items-center gap-2 text-primary font-mono text-xs hover:text-primary/80" data-testid="button-add-claim">
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
              <button onClick={() => { if (claimForm.statement?.trim()) createClaimMutation.mutate(claimForm); }} disabled={createClaimMutation.isPending} className="bg-primary/10 border border-primary/30 text-primary px-4 py-1.5 font-mono text-xs flex items-center gap-2 disabled:opacity-50" data-testid="button-save-new-claim"><Save className="w-3 h-3" /> SAVE</button>
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
              <div key={idx} className="flex items-center gap-3 border border-white/10 p-3" data-testid={`timeline-entry-${idx}`}>
                <span className="font-mono text-xs text-primary font-bold w-20 flex-shrink-0">{entry.year}</span>
                <p className="font-mono text-xs flex-1 truncate">{entry.event}</p>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 flex-shrink-0 ${entry.type === "verified" ? "text-green-500 bg-green-500/10" : entry.type === "disputed" ? "text-yellow-500 bg-yellow-500/10" : "text-orange-500 bg-orange-500/10"}`}>{entry.type}</span>
                <button onClick={() => {
                  const newTimeline = timeline.filter((_, i) => i !== idx);
                  updateNodeMutation.mutate({ timeline: newTimeline });
                }} className="text-muted-foreground hover:text-red-500 p-1" data-testid={`button-delete-timeline-${idx}`}><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => { setShowAddTimeline(!showAddTimeline); setTimelineForm({ year: "", event: "", type: "verified" }); }} className="flex items-center gap-2 text-primary font-mono text-xs hover:text-primary/80" data-testid="button-add-timeline">
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
              }} className="bg-primary/10 border border-primary/30 text-primary px-4 py-1.5 font-mono text-xs flex items-center gap-2" data-testid="button-save-timeline"><Save className="w-3 h-3" /> ADD</button>
              <button onClick={() => setShowAddTimeline(false)} className="text-muted-foreground font-mono text-xs"><X className="w-3 h-3 inline mr-1" />CANCEL</button>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/5 pt-6 mt-6" data-testid="node-editor-section-sources">
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="w-4 h-4 text-primary" />
          <span className="font-mono text-xs text-primary uppercase">Sources</span>
          <span className="font-mono text-[10px] text-muted-foreground ml-auto">{nodeSources.length} sources</span>
        </div>
        {nodeSources.length > 0 && (
          <div className="space-y-2 mb-3">
            {nodeSources.map(source => (
              <div key={source.id} className="flex items-center justify-between border border-white/10 p-3" data-testid={`node-source-${source.id}`}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 text-muted-foreground bg-white/5 flex-shrink-0">{source.type}</span>
                  <span className="font-mono text-xs truncate">{source.title}</span>
                  {source.url && <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary/60 hover:text-primary flex-shrink-0"><Link2 className="w-3 h-3" /></a>}
                  <span className={`font-mono text-[10px] flex-shrink-0 ${source.credibility >= 80 ? "text-green-500" : source.credibility >= 50 ? "text-yellow-500" : "text-orange-500"}`}>{source.credibility}%</span>
                </div>
                <button onClick={() => { if (confirm("Delete source?")) deleteSourceMutation.mutate(source.id); }} className="text-muted-foreground hover:text-red-500 p-1 ml-2" data-testid={`button-delete-source-${source.id}`}><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => { setShowAddSource(!showAddSource); setSourceForm({ holeId, nodeId, title: "", author: "", origin: "", publishedDate: "", url: "", summary: "", type: "document", stanceTag: "neutral", credibility: 50 }); }} className="flex items-center gap-2 text-primary font-mono text-xs hover:text-primary/80" data-testid="button-add-source">
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
              <button onClick={() => { if (sourceForm.title?.trim()) createSourceMutation.mutate(sourceForm); }} disabled={createSourceMutation.isPending} className="bg-primary/10 border border-primary/30 text-primary px-4 py-1.5 font-mono text-xs flex items-center gap-2 disabled:opacity-50" data-testid="button-save-source"><Save className="w-3 h-3" /> SAVE</button>
              <button onClick={() => setShowAddSource(false)} className="text-muted-foreground font-mono text-xs"><X className="w-3 h-3 inline mr-1" />CANCEL</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NodeValidationPanel({ nodeId, holeSlug }: { nodeId: number; holeSlug: string }) {
  const { data: allNodes = [] } = useQuery<DepthNode[]>({
    queryKey: [`/api/holes/${holeSlug}/depth-nodes`],
  });
  const node = allNodes.find(n => n.id === nodeId);

  const { data: nodeClaims = [] } = useQuery<Claim[]>({
    queryKey: [`/api/admin/nodes/${nodeId}/claims`],
    queryFn: () => adminFetch(`/api/admin/nodes/${nodeId}/claims`).then(r => r.ok ? r.json() : []),
    enabled: !!nodeId,
  });

  const { data: nodeMedia = [] } = useQuery<Media[]>({
    queryKey: [`/api/admin/nodes/${nodeId}/media`],
    queryFn: () => adminFetch(`/api/admin/nodes/${nodeId}/media`).then(r => r.ok ? r.json() : []),
    enabled: !!nodeId,
  });

  const { data: nodeSources = [] } = useQuery<Source[]>({
    queryKey: [`/api/admin/nodes/${nodeId}/sources`],
    queryFn: () => adminFetch(`/api/admin/nodes/${nodeId}/sources`).then(r => r.ok ? r.json() : []),
    enabled: !!nodeId,
  });

  const hasTitle = !!node?.title?.trim() && node.title !== "New Node";
  const hasContent = !!node?.content?.trim();
  const hasClaims = nodeClaims.length > 0;
  const hasMedia = nodeMedia.length > 0;
  const hasSources = nodeSources.length > 0;
  const claimsWithoutEvidence = nodeClaims.filter(c => !(c.evidence as any[])?.length).length;
  const mediaMissingCaptions = nodeMedia.filter(m => !m.caption?.trim()).length;
  const sourcesWithBrokenLinks = nodeSources.filter(s => s.url && !s.url.startsWith("http")).length;

  const checks = [
    { label: "HAS TITLE", passed: hasTitle },
    { label: "HAS CONTENT", passed: hasContent },
    { label: "HAS CLAIMS", passed: hasClaims },
    { label: "CLAIMS WITH EVIDENCE", passed: claimsWithoutEvidence === 0 && hasClaims },
    { label: "HAS MEDIA", passed: hasMedia },
    { label: "MEDIA CAPTIONS", passed: mediaMissingCaptions === 0 && hasMedia },
    { label: "HAS SOURCES", passed: hasSources },
    { label: "VALID SOURCE LINKS", passed: sourcesWithBrokenLinks === 0 && hasSources },
  ];

  const passedCount = checks.filter(c => c.passed).length;
  const healthPercent = Math.round((passedCount / checks.length) * 100);

  const wordCount = node?.content?.split(/\s+/).filter(Boolean).length || 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div data-testid="node-validation-panel" className="h-full overflow-y-auto p-4 space-y-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-primary" />
        <h2 className="font-mono text-xs uppercase tracking-wider">Node Validation</h2>
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

      {sourcesWithBrokenLinks > 0 && (
        <div className="text-[10px] font-mono text-yellow-500">
          {sourcesWithBrokenLinks} source(s) with invalid URLs
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

      <div className="border-t border-white/5 pt-4">
        <h3 className="font-mono text-[10px] text-muted-foreground uppercase mb-2">SAVE STATUS</h3>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3 h-3 text-green-500/60" />
          <span className="font-mono text-[10px] text-muted-foreground">All changes saved to server</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminInvestigationEditor() {
  const { id: paramId } = useParams<{ id: string }>();
  const holeId = parseInt(paramId || "0");
  const { employee, role, isAdmin, canEdit, navigate } = useAdminContext();
  const { toast } = useToast();
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [showValidation, setShowValidation] = useState(true);
  const [createNodeError, setCreateNodeError] = useState<string | null>(null);

  const { data: hole, isLoading: loadingHole } = useQuery<RabbitHole>({
    queryKey: [`/api/admin/hole/${holeId}`],
    queryFn: async () => {
      const allHoles = await adminQueryFetch("/api/holes");
      return allHoles.find((h: RabbitHole) => h.id === holeId);
    },
    enabled: !!holeId && !!employee,
  });

  const holeSlug = hole?.slug;

  const { data: nodes = [], isLoading: loadingNodes } = useQuery<DepthNode[]>({
    queryKey: [`/api/holes/${holeSlug}/depth-nodes`],
    enabled: !!holeSlug && !!employee,
  });

  const sortedNodes = [...nodes].sort((a, b) => a.position - b.position);

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
      await queryClient.refetchQueries({ queryKey: [`/api/holes/${holeSlug}/depth-nodes`] });
      if (newNode?.id) {
        setSelectedNodeId(newNode.id);
        setTimeout(() => {
          const titleInput = document.querySelector('[data-testid="input-node-title"]') as HTMLInputElement;
          if (titleInput) titleInput.focus();
        }, 100);
      }
    },
    onError: (err: Error) => {
      setCreateNodeError(err.message || "Failed to create node");
      toast({ title: "Error", description: err.message || "Failed to create node", variant: "destructive" });
    },
  });

  const handleAddNode = useCallback(() => {
    if (!createNodeMutation.isPending && holeId) {
      createNodeMutation.mutate({
        holeId,
        title: "New Node",
        summary: "",
        content: "",
        position: nodes.length + 1,
        status: "unlocked",
        branchLinks: [],
        timeline: [],
      });
    }
  }, [createNodeMutation.isPending, holeId, nodes.length, holeSlug]);

  if (loadingHole || loadingNodes) {
    return (
      <div className="flex items-center justify-center py-24" data-testid="editor-loading">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!hole) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4" data-testid="editor-not-found">
        <p className="font-mono text-sm text-muted-foreground">Investigation not found</p>
        <button onClick={() => navigate("/admin?tab=holes")} className="font-mono text-xs text-primary hover:underline">Back to investigations</button>
      </div>
    );
  }

  return (
    <div data-testid="page-admin-investigation-editor">
      <div className="border-b border-white/5 bg-[#111418]/50 px-8 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin?tab=holes")}
            className="flex items-center gap-2 text-muted-foreground hover:text-white font-mono text-xs transition-colors"
            data-testid="button-back-to-investigations"
          >
            <ArrowLeft className="w-4 h-4" /> Investigations
          </button>
          <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
          <span className="font-mono text-xs text-white truncate">{hole.title}</span>
          <StatusBadge status={hole.status} />
          {selectedNodeId && (
            <>
              <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
              <span className="font-mono text-xs text-primary truncate">
                {sortedNodes.find(n => n.id === selectedNodeId)?.title}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-52 border-r border-white/5 bg-[#111418] flex-shrink-0 overflow-y-auto" data-testid="editor-node-sidebar">
          <div className="px-3 py-2">
            <span className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-widest">NODES</span>
          </div>
          {sortedNodes.map(node => (
            <button
              key={node.id}
              onClick={() => setSelectedNodeId(node.id)}
              className={`w-full text-left px-3 py-2.5 font-mono text-xs border-l-2 transition-colors ${selectedNodeId === node.id ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-white"}`}
              data-testid={`node-sidebar-item-${node.id}`}
            >
              <span className="text-primary/60 mr-2">#{node.position}</span>
              {node.title}
            </button>
          ))}
          <button
            onClick={handleAddNode}
            disabled={createNodeMutation.isPending}
            className="w-full flex items-center gap-2 px-3 py-2.5 font-mono text-xs text-primary/60 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-add-node"
          >
            {createNodeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} ADD NODE
          </button>
          {createNodeError && <p className="px-3 py-1 font-mono text-[10px] text-red-500">{createNodeError}</p>}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex">
            <div className="flex-1">
              <div className="container mx-auto px-8 py-6">
                {selectedNodeId && holeSlug ? (
                  <NodeEditor nodeId={selectedNodeId} holeId={holeId} holeSlug={holeSlug} />
                ) : (
                  <InvestigationOverview hole={hole} nodes={sortedNodes} onSelectNode={setSelectedNodeId} onAddNode={handleAddNode} isAddingNode={createNodeMutation.isPending} />
                )}
              </div>
            </div>

            {showValidation && selectedNodeId && holeSlug && (
              <div className="w-72 border-l border-white/5 bg-[#111418] flex-shrink-0 overflow-y-auto">
                <div className="sticky top-0 bg-[#111418] border-b border-white/5 p-2 flex justify-end">
                  <button
                    onClick={() => setShowValidation(false)}
                    className="text-muted-foreground hover:text-white font-mono text-[10px] flex items-center gap-1 px-2 py-1 border border-white/10 hover:border-white/20 transition-colors"
                    data-testid="button-close-validation"
                  >
                    <PanelRightClose className="w-3 h-3" /> HIDE
                  </button>
                </div>
                <NodeValidationPanel nodeId={selectedNodeId} holeSlug={holeSlug} />
              </div>
            )}
          </div>

          {!showValidation && selectedNodeId && (
            <button
              onClick={() => setShowValidation(true)}
              className="fixed bottom-4 right-4 flex items-center gap-2 text-muted-foreground hover:text-white font-mono text-xs transition-colors px-3 py-2 border border-white/10 hover:border-white/20 bg-[#111418] z-10"
              data-testid="button-show-validation"
            >
              <PanelRightOpen className="w-4 h-4" /> VALIDATION
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InvestigationOverview({ hole, nodes, onSelectNode, onAddNode, isAddingNode }: { hole: RabbitHole; nodes: DepthNode[]; onSelectNode: (id: number) => void; onAddNode: () => void; isAddingNode?: boolean }) {
  return (
    <div data-testid="investigation-overview">
      <div className="flex items-center gap-3 mb-6">
        <Search className="w-5 h-5 text-primary" />
        <h2 className="font-display text-lg font-bold uppercase">{hole.title}</h2>
        <StatusBadge status={hole.status} />
      </div>
      <p className="text-muted-foreground text-sm mb-6 max-w-2xl">{hole.summary}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map(node => {
          const wordCount = node.content?.split(/\s+/).filter(Boolean).length || 0;
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
