import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAdminContext } from "@/components/AdminLayout";
import AutosaveIndicator from "@/components/AutosaveIndicator";
import {
  Loader2, Plus, Trash2, X, ArrowLeft, Search,
  Users2, CheckCircle2, AlertTriangle,
  Link2, UserPlus, Heart, Baby, Users, FileText,
  Hash, Clock
} from "lucide-react";
import type { Person, Relationship, RabbitHole } from "@shared/schema";
import { FAMILY_RELATIONSHIP_TYPES } from "@shared/schema";

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

function FormTextarea({ label, required, ...props }: { label: string; required?: boolean } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <textarea {...props} className="w-full bg-white/5 border border-white/10 p-2.5 text-sm font-mono focus:outline-none focus:border-primary/50 resize-y" />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "Published"
    ? "bg-green-500/10 text-green-500 border-green-500/20"
    : status === "Review"
    ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    : "bg-white/10 text-muted-foreground border-white/10";
  return (
    <span data-testid={`badge-status-${status.toLowerCase()}`} className={`font-mono text-[10px] px-2 py-0.5 border ${cls}`}>
      {status.toUpperCase()}
    </span>
  );
}

function generateHandle(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const CASE_REL_TYPES = ["involved_in", "mentioned_in", "witness_in", "suspect_in", "victim_in", "associate_of"] as const;

export default function AdminPeople() {
  const { role, isAdmin } = useAdminContext();
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div data-testid="page-admin-people">
      {selectedPersonId ? (
        <PersonEditor
          personId={selectedPersonId}
          role={role}
          onBack={() => setSelectedPersonId(null)}
        />
      ) : (
        <PeopleList
          role={role}
          statusFilter={statusFilter}
          searchQuery={searchQuery}
          onStatusFilterChange={setStatusFilter}
          onSearchChange={setSearchQuery}
          onSelectPerson={setSelectedPersonId}
        />
      )}
    </div>
  );
}

function PeopleList({
  role,
  statusFilter,
  searchQuery,
  onStatusFilterChange,
  onSearchChange,
  onSelectPerson,
}: {
  role: string;
  statusFilter: string;
  searchQuery: string;
  onStatusFilterChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onSelectPerson: (id: number) => void;
}) {
  const { data: people = [], isLoading } = useQuery<Person[]>({
    queryKey: ["/api/admin/people"],
    queryFn: () => adminFetch("/api/admin/people").then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await adminFetch("/api/admin/people", {
        method: "POST",
        body: JSON.stringify({ fullName: "New Person", status: "Draft" }),
      });
      if (!res.ok) throw new Error("Failed to create person");
      return res.json();
    },
    onSuccess: (newPerson: Person) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/people"] });
      onSelectPerson(newPerson.id);
    },
  });

  const filtered = people.filter(p => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = p.fullName.toLowerCase().includes(q);
      const aliasMatch = p.aliases?.toLowerCase().includes(q);
      const handleMatch = p.handle?.toLowerCase().includes(q);
      if (!nameMatch && !aliasMatch && !handleMatch) return false;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8" data-testid="people-list-view">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Users2 className="w-5 h-5 text-primary" />
          <h1 className="font-mono text-lg uppercase tracking-wider">People Builder</h1>
          <span className="font-mono text-xs text-muted-foreground">({people.length})</span>
        </div>
        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary font-mono text-xs uppercase px-4 py-2 hover:bg-primary/20 transition-colors disabled:opacity-50"
          data-testid="button-create-person"
        >
          {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          CREATE NEW PERSON
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search by name, alias, or handle..."
            className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm font-mono focus:outline-none focus:border-primary/50"
            data-testid="input-search-people"
          />
        </div>
        <div className="flex items-center gap-1">
          {["all", "Draft", "Review", "Published"].map(s => (
            <button
              key={s}
              onClick={() => onStatusFilterChange(s)}
              className={`font-mono text-[10px] uppercase px-3 py-2 border transition-colors ${
                statusFilter === s
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-white/10 text-muted-foreground hover:text-white hover:border-white/20"
              }`}
              data-testid={`filter-status-${s.toLowerCase()}`}
            >
              {s === "all" ? "ALL" : s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground font-mono text-xs" data-testid="text-no-people">
          {people.length === 0 ? "NO PEOPLE ADDED YET" : "NO MATCHING RESULTS"}
        </div>
      ) : (
        <div className="space-y-1" data-testid="people-list">
          <div className="grid grid-cols-[1fr_120px_100px_150px_120px] gap-4 px-4 py-2 font-mono text-[10px] text-muted-foreground/50 uppercase tracking-wider">
            <span>NAME</span>
            <span>HANDLE</span>
            <span>STATUS</span>
            <span>TAGS</span>
            <span>UPDATED</span>
          </div>
          {filtered.map(person => (
            <button
              key={person.id}
              onClick={() => onSelectPerson(person.id)}
              className="w-full grid grid-cols-[1fr_120px_100px_150px_120px] gap-4 px-4 py-3 border border-white/5 hover:border-white/15 hover:bg-white/[0.02] transition-all text-left items-center"
              data-testid={`person-row-${person.id}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Users2 className="w-4 h-4 text-primary/60 flex-shrink-0" />
                <span className="font-mono text-sm truncate" data-testid={`text-person-name-${person.id}`}>{person.fullName}</span>
              </div>
              <span className="font-mono text-xs text-muted-foreground truncate" data-testid={`text-person-handle-${person.id}`}>
                {person.handle ? `@${person.handle}` : "—"}
              </span>
              <StatusBadge status={person.status} />
              <div className="flex gap-1 overflow-hidden">
                {(person.tags as string[] || []).slice(0, 2).map(tag => (
                  <span key={tag} className="font-mono text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 truncate">{tag}</span>
                ))}
              </div>
              <span className="font-mono text-[10px] text-muted-foreground" data-testid={`text-person-updated-${person.id}`}>
                {person.updatedAt ? new Date(person.updatedAt).toLocaleDateString() : "—"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PersonEditor({
  personId,
  role,
  onBack,
}: {
  personId: number;
  role: string;
  onBack: () => void;
}) {
  const isAdmin = role === "Admin";
  const { setDirty } = useAdminContext();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localData, setLocalData] = useState<Partial<Person>>({});
  const [initialized, setInitialized] = useState(false);

  const { data: person, isLoading: personLoading } = useQuery<Person>({
    queryKey: ["/api/admin/people", personId],
    queryFn: () => adminFetch(`/api/admin/people/${personId}`).then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
  });

  const { data: allPeople = [] } = useQuery<Person[]>({
    queryKey: ["/api/admin/people"],
    queryFn: () => adminFetch("/api/admin/people").then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
  });

  const { data: allRelationships = [] } = useQuery<Relationship[]>({
    queryKey: ["/api/admin/relationships"],
    queryFn: () => adminFetch("/api/admin/relationships").then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
  });

  const { data: allHoles = [] } = useQuery<RabbitHole[]>({
    queryKey: ["/api/holes?admin=true"],
    queryFn: () => fetch("/api/holes?admin=true", { credentials: "include" }).then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
  });

  useEffect(() => {
    if (person && !initialized) {
      setLocalData({
        fullName: person.fullName,
        handle: person.handle,
        aliases: person.aliases,
        description: person.description,
        birthDate: person.birthDate,
        deathDate: person.deathDate,
        nationality: person.nationality,
        avatarUrl: person.avatarUrl,
        bannerUrl: person.bannerUrl,
        tags: person.tags,
        status: person.status,
      });
      setInitialized(true);
    }
  }, [person, initialized]);

  const autoSave = useCallback((data: Partial<Person>) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const res = await adminFetch(`/api/admin/people/${personId}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Save failed");
        setSaveStatus("saved");
        setDirty(false);
        queryClient.invalidateQueries({ queryKey: ["/api/admin/people", personId] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/people"] });
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
      }
    }, 600);
  }, [personId]);

  const updateField = useCallback((field: string, value: any) => {
    setDirty(true);
    setLocalData(prev => {
      const next = { ...prev, [field]: value };
      autoSave(next);
      return next;
    });
  }, [autoSave, setDirty]);

  const handleBlurWithAutoHandle = useCallback(() => {
    if (!localData.handle && localData.fullName) {
      const handle = generateHandle(localData.fullName);
      setLocalData(prev => {
        const next = { ...prev, handle };
        autoSave(next);
        return next;
      });
    }
  }, [localData.handle, localData.fullName, autoSave]);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await adminFetch(`/api/admin/people/${personId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/people"] });
      onBack();
    },
  });

  const personRelationships = allRelationships.filter(
    r => (r.fromType === "person" && r.fromId === personId) || (r.toType === "person" && r.toId === personId)
  );

  const familyRels = personRelationships.filter(r =>
    (FAMILY_RELATIONSHIP_TYPES as readonly string[]).includes(r.relationshipType)
  );

  const caseRels = personRelationships.filter(r =>
    r.fromType === "case" || r.toType === "case" ||
    (!(FAMILY_RELATIONSHIP_TYPES as readonly string[]).includes(r.relationshipType) && (r.fromType !== "person" || r.toType !== "person" || !((FAMILY_RELATIONSHIP_TYPES as readonly string[]).includes(r.relationshipType))))
  ).filter(r => !(FAMILY_RELATIONSHIP_TYPES as readonly string[]).includes(r.relationshipType));

  if (personLoading || !initialized) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-white font-mono text-xs mb-4" data-testid="button-back-list">
          <ArrowLeft className="w-4 h-4" /> People List
        </button>
        <p className="font-mono text-sm text-red-500">Person not found.</p>
      </div>
    );
  }

  const publishChecklist = [
    { label: "FULL NAME", passed: !!(localData.fullName?.trim()) },
    { label: "HANDLE", passed: !!(localData.handle?.trim()) },
    { label: "DESCRIPTION", passed: !!(localData.description?.trim()) },
  ];
  const allChecksPassed = publishChecklist.every(c => c.passed);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6" data-testid="person-editor">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-white font-mono text-xs transition-colors" data-testid="button-back-list">
            <ArrowLeft className="w-4 h-4" /> People List
          </button>
          <div className="w-px h-4 bg-white/10" />
          <h1 className="font-mono text-sm uppercase tracking-wider truncate max-w-[300px]" data-testid="text-editing-name">
            {localData.fullName || "Untitled"}
          </h1>
          <StatusBadge status={localData.status || "Draft"} />
        </div>
        <div className="flex items-center gap-3">
          <AutosaveIndicator status={saveStatus} />
          {isAdmin && (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 font-mono text-[10px] uppercase px-3 py-1.5 hover:bg-red-500/20 transition-colors"
              data-testid="button-delete-person"
            >
              <Trash2 className="w-3 h-3" /> DELETE
            </button>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" data-testid="dialog-delete-confirm">
          <div className="bg-[#1a1a1a] border border-white/10 p-6 max-w-sm w-full">
            <h3 className="font-mono text-sm uppercase mb-3">Confirm Deletion</h3>
            <p className="font-mono text-xs text-muted-foreground mb-6">
              Are you sure you want to delete <strong className="text-white">{localData.fullName}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 font-mono text-xs uppercase px-4 py-2 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                data-testid="button-confirm-delete"
              >
                {deleteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} DELETE
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="font-mono text-xs text-muted-foreground hover:text-white px-4 py-2 border border-white/10"
                data-testid="button-cancel-delete"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
          <div className="border border-white/10 bg-white/[0.02] p-6 space-y-5" data-testid="section-identity">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-primary" />
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">SECTION A: IDENTITY</h2>
            </div>
            <FormInput
              label="Full Name"
              required
              value={localData.fullName || ""}
              onChange={e => updateField("fullName", e.target.value)}
              onBlur={handleBlurWithAutoHandle}
              data-testid="input-fullname"
            />
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Handle"
                value={localData.handle || ""}
                onChange={e => updateField("handle", e.target.value)}
                placeholder="auto-generated from name"
                data-testid="input-handle"
              />
              <FormInput
                label="Aliases"
                value={localData.aliases || ""}
                onChange={e => updateField("aliases", e.target.value)}
                placeholder="Comma-separated aliases"
                data-testid="input-aliases"
              />
            </div>
          </div>

          <div className="border border-white/10 bg-white/[0.02] p-6 space-y-5" data-testid="section-profile">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">SECTION B: PROFILE</h2>
            </div>
            <FormTextarea
              label="Description"
              required
              rows={8}
              value={localData.description || ""}
              onChange={e => updateField("description", e.target.value)}
              data-testid="input-description"
            />
            <FormInput
              label="Tags (comma separated)"
              value={(localData.tags as string[] || []).join(", ")}
              onChange={e => updateField("tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
              data-testid="input-tags"
            />
            <div className="grid grid-cols-3 gap-4">
              <FormInput
                label="Birth Date"
                value={localData.birthDate || ""}
                onChange={e => updateField("birthDate", e.target.value)}
                placeholder="YYYY-MM-DD"
                data-testid="input-birthdate"
              />
              <FormInput
                label="Death Date"
                value={localData.deathDate || ""}
                onChange={e => updateField("deathDate", e.target.value)}
                placeholder="YYYY-MM-DD"
                data-testid="input-deathdate"
              />
              <FormInput
                label="Nationality"
                value={localData.nationality || ""}
                onChange={e => updateField("nationality", e.target.value)}
                data-testid="input-nationality"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Avatar URL"
                value={localData.avatarUrl || ""}
                onChange={e => updateField("avatarUrl", e.target.value)}
                placeholder="https://..."
                data-testid="input-avatarurl"
              />
              <FormInput
                label="Banner URL"
                value={localData.bannerUrl || ""}
                onChange={e => updateField("bannerUrl", e.target.value)}
                placeholder="https://..."
                data-testid="input-bannerurl"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <WorkflowPanel
            role={role}
            status={localData.status || "Draft"}
            checklist={publishChecklist}
            allPassed={allChecksPassed}
            onStatusChange={(status) => updateField("status", status)}
          />
          <FamilyPanel
            personId={personId}
            personName={localData.fullName || ""}
            familyRels={familyRels}
            allPeople={allPeople}
            role={role}
          />
          <CaseLinksPanel
            personId={personId}
            caseRels={caseRels}
            allPeople={allPeople}
            allHoles={allHoles}
            allRelationships={allRelationships}
            role={role}
          />
        </div>
      </div>
    </div>
  );
}

function WorkflowPanel({
  role,
  status,
  checklist,
  allPassed,
  onStatusChange,
}: {
  role: string;
  status: string;
  checklist: { label: string; passed: boolean }[];
  allPassed: boolean;
  onStatusChange: (s: string) => void;
}) {
  const isAdmin = role === "Admin";
  const statuses = ["Draft", "Review", "Published"];

  return (
    <div className="border border-white/10 bg-white/[0.02] p-4 space-y-4" data-testid="panel-workflow">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">WORKFLOW STATUS</h3>
      </div>
      <div className="flex gap-1">
        {statuses.map(s => {
          const disabled = s === "Published" && !isAdmin;
          return (
            <button
              key={s}
              onClick={() => !disabled && onStatusChange(s)}
              disabled={disabled}
              className={`flex-1 font-mono text-[10px] uppercase py-2 border transition-colors ${
                status === s
                  ? s === "Published" ? "border-green-500/50 bg-green-500/10 text-green-500"
                    : s === "Review" ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-500"
                    : "border-primary/50 bg-primary/10 text-primary"
                  : "border-white/10 text-muted-foreground hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              }`}
              data-testid={`button-status-${s.toLowerCase()}`}
            >
              {s.toUpperCase()}
            </button>
          );
        })}
      </div>
      {!isAdmin && (
        <p className="font-mono text-[9px] text-muted-foreground/60">Only Admin can set Published status</p>
      )}
      <div className="space-y-1.5 pt-2">
        <p className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-wider">Publish Checklist</p>
        {checklist.map(c => (
          <div key={c.label} className="flex items-center gap-2" data-testid={`check-${c.label.toLowerCase().replace(/\s/g, "-")}`}>
            {c.passed ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-500" />}
            <span className={`font-mono text-[10px] ${c.passed ? "text-muted-foreground" : "text-red-400"}`}>{c.label}</span>
          </div>
        ))}
        <div className={`mt-2 p-2 border ${allPassed ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
          <span className={`font-mono text-[10px] ${allPassed ? "text-green-500" : "text-red-400"}`}>
            {allPassed ? "✓ READY TO PUBLISH" : "✗ NOT READY"}
          </span>
        </div>
      </div>
    </div>
  );
}

function FamilyPanel({
  personId,
  personName,
  familyRels,
  allPeople,
  role,
}: {
  personId: number;
  personName: string;
  familyRels: Relationship[];
  allPeople: Person[];
  role: string;
}) {
  const [addingType, setAddingType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const isAdmin = role === "Admin";

  const createRelMutation = useMutation({
    mutationFn: async (data: { fromType: string; fromId: number; toType: string; toId: number; relationshipType: string; status: string }) => {
      const res = await adminFetch("/api/admin/relationships", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed" }));
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/relationships"] });
      setAddingType(null);
      setSearchTerm("");
    },
  });

  const deleteRelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/relationships/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/relationships"] });
    },
  });

  const handleSelectPerson = (selectedId: number) => {
    if (!addingType) return;
    let data: { fromType: string; fromId: number; toType: string; toId: number; relationshipType: string; status: string };

    if (addingType === "parent") {
      data = { fromType: "person", fromId: selectedId, toType: "person", toId: personId, relationshipType: "parent_of", status: "Published" };
    } else if (addingType === "child") {
      data = { fromType: "person", fromId: personId, toType: "person", toId: selectedId, relationshipType: "parent_of", status: "Published" };
    } else if (addingType === "spouse") {
      data = { fromType: "person", fromId: personId, toType: "person", toId: selectedId, relationshipType: "spouse_of", status: "Published" };
    } else {
      data = { fromType: "person", fromId: personId, toType: "person", toId: selectedId, relationshipType: "sibling_of", status: "Published" };
    }
    createRelMutation.mutate(data);
  };

  const getRelLabel = (rel: Relationship) => {
    const isFrom = rel.fromId === personId && rel.fromType === "person";
    const otherId = isFrom ? rel.toId : rel.fromId;
    const otherPerson = allPeople.find(p => p.id === otherId);
    const otherName = otherPerson?.fullName || `Person #${otherId}`;

    if (rel.relationshipType === "parent_of") {
      return isFrom ? `Parent of ${otherName}` : `Child of ${otherName}`;
    }
    return `${rel.relationshipType.replace(/_/g, " ")} — ${otherName}`;
  };

  const getOtherId = (rel: Relationship) => {
    return (rel.fromId === personId && rel.fromType === "person") ? rel.toId : rel.fromId;
  };

  const searchResults = searchTerm.trim()
    ? allPeople.filter(p =>
        p.id !== personId &&
        (p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (p.aliases || "").toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, 8)
    : [];

  const familyButtons = [
    { type: "parent", label: "ADD PARENT", icon: UserPlus },
    { type: "child", label: "ADD CHILD", icon: Baby },
    { type: "spouse", label: "ADD SPOUSE", icon: Heart },
    { type: "sibling", label: "ADD SIBLING", icon: Users },
  ];

  return (
    <div className="border border-white/10 bg-white/[0.02] p-4 space-y-3" data-testid="panel-family">
      <div className="flex items-center gap-2">
        <Users2 className="w-4 h-4 text-primary" />
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">FAMILY RELATIONSHIPS</h3>
      </div>

      {familyRels.length > 0 ? (
        <div className="space-y-1">
          {familyRels.map(rel => (
            <div key={rel.id} className="flex items-center justify-between bg-white/5 px-3 py-2 border border-white/5" data-testid={`family-rel-${rel.id}`}>
              <span className="font-mono text-xs truncate flex-1">{getRelLabel(rel)}</span>
              {(isAdmin) && (
                <button
                  onClick={() => deleteRelMutation.mutate(rel.id)}
                  disabled={deleteRelMutation.isPending}
                  className="text-red-500/60 hover:text-red-500 ml-2 flex-shrink-0"
                  data-testid={`button-remove-rel-${rel.id}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="font-mono text-[10px] text-muted-foreground/50 py-2" data-testid="text-no-family">No family relationships</p>
      )}

      <div className="flex flex-wrap gap-1 pt-1">
        {familyButtons.map(btn => (
          <button
            key={btn.type}
            onClick={() => { setAddingType(addingType === btn.type ? null : btn.type); setSearchTerm(""); }}
            className={`flex items-center gap-1 font-mono text-[9px] uppercase px-2 py-1 border transition-colors ${
              addingType === btn.type ? "border-primary/50 bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:text-white"
            }`}
            data-testid={`button-add-${btn.type}`}
          >
            <btn.icon className="w-3 h-3" /> {btn.label}
          </button>
        ))}
      </div>

      {addingType && (
        <div className="border border-primary/20 bg-primary/5 p-3 space-y-2" data-testid="inline-search-family">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={`Search people to add as ${addingType}...`}
            className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary/50"
            autoFocus
            data-testid="input-search-family-person"
          />
          {createRelMutation.error && (
            <p className="font-mono text-[10px] text-red-500" data-testid="text-rel-error">{(createRelMutation.error as Error).message}</p>
          )}
          {searchResults.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {searchResults.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPerson(p.id)}
                  disabled={createRelMutation.isPending}
                  className="w-full text-left px-3 py-2 font-mono text-xs hover:bg-white/5 transition-colors flex items-center gap-2 disabled:opacity-50"
                  data-testid={`select-family-person-${p.id}`}
                >
                  <Users2 className="w-3 h-3 text-primary/60" />
                  <span>{p.fullName}</span>
                  {p.handle && <span className="text-muted-foreground text-[10px]">@{p.handle}</span>}
                </button>
              ))}
            </div>
          )}
          {searchTerm.trim() && searchResults.length === 0 && (
            <p className="font-mono text-[10px] text-muted-foreground py-1">No results</p>
          )}
        </div>
      )}
    </div>
  );
}

function CaseLinksPanel({
  personId,
  caseRels,
  allPeople,
  allHoles,
  allRelationships,
  role,
}: {
  personId: number;
  caseRels: Relationship[];
  allPeople: Person[];
  allHoles: RabbitHole[];
  allRelationships: Relationship[];
  role: string;
}) {
  const [adding, setAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRelType, setSelectedRelType] = useState<string>(CASE_REL_TYPES[0]);
  const isAdmin = role === "Admin";

  const createRelMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/relationships", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed" }));
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/relationships"] });
      setAdding(false);
      setSearchTerm("");
    },
  });

  const deleteRelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/relationships/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/relationships"] });
    },
  });

  const handleSelectCase = (holeId: number) => {
    createRelMutation.mutate({
      fromType: "person",
      fromId: personId,
      toType: "case",
      toId: holeId,
      relationshipType: selectedRelType,
      status: "Published",
    });
  };

  const getCaseLabel = (rel: Relationship) => {
    const caseId = rel.fromType === "case" ? rel.fromId : rel.toId;
    const hole = allHoles.find(h => h.id === caseId);
    return `${rel.relationshipType.replace(/_/g, " ")} — ${hole?.title || `Case #${caseId}`}`;
  };

  const searchResults = searchTerm.trim()
    ? allHoles.filter(h => h.title.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div className="border border-white/10 bg-white/[0.02] p-4 space-y-3" data-testid="panel-cases">
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-primary" />
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">CASE / EVENT LINKS</h3>
      </div>

      {caseRels.length > 0 ? (
        <div className="space-y-1">
          {caseRels.map(rel => (
            <div key={rel.id} className="flex items-center justify-between bg-white/5 px-3 py-2 border border-white/5" data-testid={`case-rel-${rel.id}`}>
              <span className="font-mono text-xs truncate flex-1">{getCaseLabel(rel)}</span>
              {(isAdmin) && (
                <button
                  onClick={() => deleteRelMutation.mutate(rel.id)}
                  disabled={deleteRelMutation.isPending}
                  className="text-red-500/60 hover:text-red-500 ml-2 flex-shrink-0"
                  data-testid={`button-remove-case-rel-${rel.id}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="font-mono text-[10px] text-muted-foreground/50 py-2" data-testid="text-no-cases">No case links</p>
      )}

      <button
        onClick={() => { setAdding(!adding); setSearchTerm(""); }}
        className={`flex items-center gap-1 font-mono text-[9px] uppercase px-2 py-1 border transition-colors ${
          adding ? "border-primary/50 bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:text-white"
        }`}
        data-testid="button-link-case"
      >
        <Link2 className="w-3 h-3" /> LINK CASE
      </button>

      {adding && (
        <div className="border border-primary/20 bg-primary/5 p-3 space-y-2" data-testid="inline-search-case">
          <div className="flex gap-2">
            <select
              value={selectedRelType}
              onChange={e => setSelectedRelType(e.target.value)}
              className="bg-white/5 border border-white/10 px-2 py-2 text-xs font-mono focus:outline-none focus:border-primary/50"
              data-testid="select-case-rel-type"
            >
              {CASE_REL_TYPES.map(t => (
                <option key={t} value={t}>{t.replace(/_/g, " ").toUpperCase()}</option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search cases..."
            className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary/50"
            autoFocus
            data-testid="input-search-case"
          />
          {createRelMutation.error && (
            <p className="font-mono text-[10px] text-red-500" data-testid="text-case-rel-error">{(createRelMutation.error as Error).message}</p>
          )}
          {searchResults.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {searchResults.map(h => (
                <button
                  key={h.id}
                  onClick={() => handleSelectCase(h.id)}
                  disabled={createRelMutation.isPending}
                  className="w-full text-left px-3 py-2 font-mono text-xs hover:bg-white/5 transition-colors flex items-center gap-2 disabled:opacity-50"
                  data-testid={`select-case-${h.id}`}
                >
                  <FileText className="w-3 h-3 text-primary/60" />
                  <span className="truncate">{h.title}</span>
                </button>
              ))}
            </div>
          )}
          {searchTerm.trim() && searchResults.length === 0 && (
            <p className="font-mono text-[10px] text-muted-foreground py-1">No results</p>
          )}
        </div>
      )}
    </div>
  );
}
