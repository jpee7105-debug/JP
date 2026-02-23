import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { BookOpen, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import type { LibraryBook, LibraryWork } from "@shared/schema";

export default function LibraryWork() {
  const { workSlug } = useParams<{ workSlug: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [bookFilter, setBookFilter] = useState("");

  const { data: works } = useQuery<LibraryWork[]>({
    queryKey: ["/api/library/works"],
    queryFn: () => fetch("/api/library/works").then(r => r.json()),
  });

  const work = works?.find((w) => w.slug === workSlug);

  const { data: books, isLoading } = useQuery<LibraryBook[]>({
    queryKey: [`/api/library/works/${workSlug}/books`],
    queryFn: () => fetch(`/api/library/works/${workSlug}/books`).then(r => r.json()),
  });

  const { data: searchResults } = useQuery({
    queryKey: ["/api/library/search", workSlug, searchTerm],
    queryFn: () => fetch(`/api/library/search?workSlug=${workSlug}&q=${encodeURIComponent(searchTerm)}&limit=20`).then(r => r.json()),
    enabled: searchTerm.length >= 2,
  });

  const filteredBooks = books?.filter((b) =>
    bookFilter.length === 0 ||
    b.name.toLowerCase().includes(bookFilter.toLowerCase())
  );

  const otBooks = filteredBooks?.filter((b) => b.testament === "Old Testament") || [];
  const ntBooks = filteredBooks?.filter((b) => b.testament === "New Testament") || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchQuery);
  };

  const workTitle = work?.title || workSlug?.toUpperCase().replace(/-/g, " ") || "";

  return (
    <div className="min-h-screen bg-background" data-testid="page-library-work">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        <nav className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-6" data-testid="breadcrumb-work">
          <Link href="/library" className="hover:text-white transition-colors" data-testid="link-breadcrumb-library">LIBRARY</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground" data-testid="text-breadcrumb-current">{workTitle.toUpperCase()}</span>
        </nav>

        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold tracking-wide" data-testid="text-work-title">
            {workTitle.toUpperCase()}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {work ? `${work.bookCount} books` : ""} {otBooks.length > 0 && ntBooks.length > 0 ? "· Old Testament & New Testament" : ""}
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-4">
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

        <div className="mb-8">
          <input
            type="text"
            value={bookFilter}
            onChange={e => setBookFilter(e.target.value)}
            placeholder="Filter books by name..."
            className="w-full px-4 py-2 bg-card/30 border border-white/5 rounded-sm text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/15 transition-colors"
            data-testid="input-filter-books"
          />
        </div>

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
                <h2 className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-4" data-testid="text-section-ot">Old Testament</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {otBooks.map((book) => (
                    <Link
                      key={book.slug}
                      href={`/library/${workSlug}/${book.slug}`}
                      className="group px-3 py-2.5 bg-card/30 border border-white/5 rounded-sm hover:border-white/10 hover:bg-card/50 transition-all"
                      data-testid={`card-book-${book.slug}`}
                    >
                      <div className="text-sm font-medium group-hover:text-primary transition-colors truncate" data-testid={`text-book-name-${book.slug}`}>{book.name}</div>
                      <div className="text-[10px] text-muted-foreground/50 mt-0.5">{book.chapterCount} ch</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {ntBooks.length > 0 && (
              <div>
                <h2 className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-4" data-testid="text-section-nt">New Testament</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {ntBooks.map((book) => (
                    <Link
                      key={book.slug}
                      href={`/library/${workSlug}/${book.slug}`}
                      className="group px-3 py-2.5 bg-card/30 border border-white/5 rounded-sm hover:border-white/10 hover:bg-card/50 transition-all"
                      data-testid={`card-book-${book.slug}`}
                    >
                      <div className="text-sm font-medium group-hover:text-primary transition-colors truncate" data-testid={`text-book-name-${book.slug}`}>{book.name}</div>
                      <div className="text-[10px] text-muted-foreground/50 mt-0.5">{book.chapterCount} ch</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {otBooks.length === 0 && ntBooks.length === 0 && filteredBooks && filteredBooks.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No books match your filter.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
