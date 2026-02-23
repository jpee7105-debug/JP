import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { BookOpen, ChevronLeft, Search } from "lucide-react";
import { useState } from "react";

export default function LibraryWork() {
  const { workSlug } = useParams<{ workSlug: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: books, isLoading } = useQuery({
    queryKey: [`/api/library/works/${workSlug}/books`],
    queryFn: () => fetch(`/api/library/works/${workSlug}/books`).then(r => r.json()),
  });

  const { data: searchResults } = useQuery({
    queryKey: ["/api/library/search", workSlug, searchTerm],
    queryFn: () => fetch(`/api/library/search?workSlug=${workSlug}&q=${encodeURIComponent(searchTerm)}&limit=20`).then(r => r.json()),
    enabled: searchTerm.length >= 2,
  });

  const otBooks = books?.filter((b: any) => b.testament === "OT") || [];
  const ntBooks = books?.filter((b: any) => b.testament === "NT") || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchQuery);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-library-work">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        <Link href="/library" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors mb-6" data-testid="link-back-library">
          <ChevronLeft className="w-3.5 h-3.5" /> LIBRARY
        </Link>

        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold tracking-wide" data-testid="text-work-title">
            {books?.[0] ? "KING JAMES VERSION" : workSlug?.toUpperCase().replace(/-/g, " ")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">66 books · Old Testament & New Testament</p>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search within this work..."
              className="w-full pl-10 pr-4 py-2.5 bg-card/50 border border-white/5 rounded-sm text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/15 transition-colors"
              data-testid="input-library-search"
            />
          </div>
        </form>

        {searchTerm && searchResults?.length > 0 && (
          <div className="mb-10 border border-white/5 rounded-sm bg-card/30">
            <div className="px-4 py-2.5 border-b border-white/5">
              <span className="text-xs text-muted-foreground font-mono">
                {searchResults.length} results for "{searchTerm}"
              </span>
            </div>
            <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
              {searchResults.map((r: any, i: number) => (
                <Link
                  key={i}
                  href={`/library/${workSlug}/${r.bookSlug}/${r.chapterNumber}#v${r.verseNumber}`}
                  className="block px-4 py-3 hover:bg-white/[0.02] transition-colors"
                  data-testid={`search-result-${i}`}
                >
                  <span className="text-xs font-mono text-primary/80 mr-2">{r.bookName} {r.chapterNumber}:{r.verseNumber}</span>
                  <span className="text-sm text-muted-foreground">{r.text.slice(0, 120)}...</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {searchTerm && searchResults?.length === 0 && (
          <div className="mb-10 text-center py-8 text-muted-foreground text-sm">No results found for "{searchTerm}"</div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="h-12 bg-card/30 rounded-sm animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {otBooks.length > 0 && (
              <div>
                <h2 className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-4">Old Testament</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {otBooks.map((book: any) => (
                    <Link
                      key={book.slug}
                      href={`/library/${workSlug}/${book.slug}`}
                      className="group px-3 py-2.5 bg-card/30 border border-white/5 rounded-sm hover:border-white/10 hover:bg-card/50 transition-all"
                      data-testid={`card-book-${book.slug}`}
                    >
                      <div className="text-sm font-medium group-hover:text-primary transition-colors truncate">{book.name}</div>
                      <div className="text-[10px] text-muted-foreground/50 mt-0.5">{book.chapterCount} ch</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {ntBooks.length > 0 && (
              <div>
                <h2 className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-4">New Testament</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {ntBooks.map((book: any) => (
                    <Link
                      key={book.slug}
                      href={`/library/${workSlug}/${book.slug}`}
                      className="group px-3 py-2.5 bg-card/30 border border-white/5 rounded-sm hover:border-white/10 hover:bg-card/50 transition-all"
                      data-testid={`card-book-${book.slug}`}
                    >
                      <div className="text-sm font-medium group-hover:text-primary transition-colors truncate">{book.name}</div>
                      <div className="text-[10px] text-muted-foreground/50 mt-0.5">{book.chapterCount} ch</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
