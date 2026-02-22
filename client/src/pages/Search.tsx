import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, GitBranch, Scale, Loader2, FileText, Tag, User } from "lucide-react";
import type { RabbitHole, Source, Claim, Person } from "@shared/schema";

function statusColor(status: string) {
  switch (status) {
    case "Verified": return "text-green-500 bg-green-500/10";
    case "Unsolved": return "text-yellow-500 bg-yellow-500/10";
    case "Active": return "text-primary bg-primary/10";
    case "Specialist": return "text-red-500 bg-red-500/10";
    default: return "text-muted-foreground bg-white/5";
  }
}

function stanceStyle(stance: string) {
  switch (stance) {
    case "Verified": return "text-green-500 bg-green-500/10";
    case "Disputed": return "text-yellow-500 bg-yellow-500/10";
    case "Speculative": return "text-orange-500 bg-orange-500/10";
    default: return "text-muted-foreground bg-white/5";
  }
}

export default function SearchPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const initialQuery = params.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<"all" | "holes" | "sources" | "claims" | "people">("all");

  const { data, isLoading } = useQuery<{ holes: RabbitHole[]; sources: Source[]; claims: Claim[]; people: Person[] }>({
    queryKey: [`/api/search?q=${encodeURIComponent(searchTerm)}`],
    enabled: searchTerm.length > 0,
  });

  useEffect(() => {
    const p = new URLSearchParams(searchString);
    const q = p.get("q") || "";
    if (q && q !== searchTerm) {
      setQuery(q);
      setSearchTerm(q);
    }
  }, [searchString]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchTerm(query.trim());
      window.history.replaceState(null, "", `/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const holes = data?.holes || [];
  const sources = data?.sources || [];
  const claims = data?.claims || [];
  const people = data?.people || [];
  const total = holes.length + sources.length + claims.length + people.length;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-6 py-6">
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-black/50 border border-white/10 text-lg font-mono focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="SEARCH INVESTIGATIONS, SOURCES, CLAIMS..."
                data-testid="input-search-page"
                autoFocus
              />
            </div>
          </form>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-6 py-8">
        {!searchTerm ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <SearchIcon className="w-16 h-16 text-white/5 mb-6" />
            <h2 className="font-display text-2xl font-bold mb-2">Search the Archive</h2>
            <p className="text-muted-foreground font-mono text-sm">Enter a query to search across investigations, sources, and claims</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="font-mono text-sm text-muted-foreground">
                {total} results for "<span className="text-white">{searchTerm}</span>"
              </p>
            </div>

            <div className="flex gap-4 mb-8 font-mono text-xs">
              {[
                { id: "all" as const, label: "ALL", count: total },
                { id: "holes" as const, label: "INVESTIGATIONS", count: holes.length },
                { id: "sources" as const, label: "SOURCES", count: sources.length },
                { id: "claims" as const, label: "CLAIMS", count: claims.length },
                { id: "people" as const, label: "PEOPLE", count: people.length },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 border transition-colors ${activeTab === tab.id ? 'border-primary text-primary bg-primary/10' : 'border-white/10 text-muted-foreground hover:text-white'}`}
                  data-testid={`search-tab-${tab.id}`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {(activeTab === "all" || activeTab === "holes") && holes.map(hole => (
                <Link key={`hole-${hole.id}`} href={`/rabbithole/${hole.slug}`} className="block border border-white/10 p-5 hover:border-primary/30 transition-colors group" data-testid={`search-result-hole-${hole.slug}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <GitBranch className="w-4 h-4 text-primary" />
                    <span className="font-mono text-[10px] text-primary">INVESTIGATION</span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 ${statusColor(hole.status)}`}>{hole.status}</span>
                    {hole.categorySlug && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 text-muted-foreground bg-white/5 flex items-center gap-1">
                        <Tag className="w-2 h-2" /> {hole.categorySlug.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-xl font-bold group-hover:text-primary transition-colors">{hole.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{hole.summary}</p>
                </Link>
              ))}

              {(activeTab === "all" || activeTab === "sources") && sources.map(source => (
                <div key={`source-${source.id}`} className="border border-white/10 p-5 hover:border-primary/20 transition-colors" data-testid={`search-result-source-${source.id}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="font-mono text-[10px] text-blue-400">SOURCE</span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 ${source.type === 'document' ? 'bg-green-500/10 text-green-500' : source.type === 'book' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`}>
                      {source.type.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold">{source.title}</h3>
                  {source.author && <p className="text-xs text-muted-foreground font-mono mt-1">{source.author}{source.origin && ` — ${source.origin}`}</p>}
                  {source.summary && <p className="text-sm text-foreground/60 mt-2 line-clamp-2">{source.summary}</p>}
                  <div className="mt-2 text-xs font-mono text-muted-foreground">CREDIBILITY: {source.credibility}%</div>
                </div>
              ))}

              {(activeTab === "all" || activeTab === "claims") && claims.map(claim => (
                <div key={`claim-${claim.id}`} className="border border-white/10 p-5 hover:border-primary/20 transition-colors" data-testid={`search-result-claim-${claim.id}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="w-4 h-4 text-yellow-500" />
                    <span className="font-mono text-[10px] text-yellow-500">CLAIM</span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 ${stanceStyle(claim.stance)}`}>{claim.stance.toUpperCase()}</span>
                  </div>
                  <p className="font-display text-base font-semibold">{claim.statement}</p>
                  <div className="mt-2 text-xs font-mono text-muted-foreground">CONFIDENCE: {claim.confidence}%</div>
                </div>
              ))}

              {(activeTab === "all" || activeTab === "people") && people.map(person => (
                <Link key={`person-${person.id}`} href={`/people/${person.id}`} className="block border border-white/10 p-5 hover:border-primary/30 transition-colors group" data-testid={`search-result-person-${person.id}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-mono text-[10px] text-primary">PERSON</span>
                  </div>
                  <h3 className="font-display text-xl font-bold group-hover:text-primary transition-colors">{person.fullName}</h3>
                  {person.aliases && <p className="text-xs text-muted-foreground font-mono mt-1">AKA: {person.aliases}</p>}
                  {person.description && <p className="text-sm text-foreground/60 mt-2 line-clamp-2">{person.description}</p>}
                </Link>
              ))}

              {total === 0 && (
                <div className="text-center py-20 font-mono text-sm text-muted-foreground">
                  <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  NO RESULTS FOUND FOR "{searchTerm}"
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
