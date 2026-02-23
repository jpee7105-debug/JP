import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BookOpen, Library as LibraryIcon, ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import type { LibraryWork } from "@shared/schema";

export default function Library() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: works, isLoading } = useQuery<LibraryWork[]>({
    queryKey: ["/api/library/works"],
    queryFn: () => fetch("/api/library/works").then(r => r.json()),
  });

  const filteredWorks = works?.filter((w) =>
    searchQuery.length === 0 ||
    w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background" data-testid="page-library">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <LibraryIcon className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl font-bold tracking-wide" data-testid="text-library-title">LIBRARY</h1>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-prose">
            Browse primary source texts referenced across investigations. Search within works, follow citation links, and explore the original context behind claims.
          </p>
        </div>

        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter works..."
              className="w-full pl-10 pr-4 py-2.5 bg-card/50 border border-white/5 rounded-sm text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/15 transition-colors"
              data-testid="input-search-works"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-28 bg-card/50 rounded-sm border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredWorks?.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No works available yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWorks?.map((work) => (
              <Link
                key={work.slug}
                href={`/library/${work.slug}`}
                className="block group"
                data-testid={`card-work-${work.slug}`}
              >
                <div className="p-6 bg-card/50 border border-white/5 rounded-sm hover:border-white/10 hover:bg-card/70 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-display text-lg font-semibold group-hover:text-primary transition-colors" data-testid={`text-work-title-${work.slug}`}>
                        {work.title}
                      </h2>
                      <p className="text-muted-foreground text-sm mt-1">{work.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground/70">
                        {work.author && <span data-testid={`text-work-author-${work.slug}`}>{work.author}</span>}
                        {work.year && <span data-testid={`text-work-year-${work.slug}`}>{work.year}</span>}
                        {work.bookCount > 0 && <span data-testid={`text-work-bookcount-${work.slug}`}>{work.bookCount} books</span>}
                        <span className="uppercase text-[10px] tracking-wider bg-white/5 px-2 py-0.5 rounded">{work.language}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors mt-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
