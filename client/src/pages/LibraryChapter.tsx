import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { LibraryBook, LibraryChapter as LibraryChapterType, LibraryVerse, LibraryWork } from "@shared/schema";

export default function LibraryChapter() {
  const { workSlug, bookSlug, chapterNumber } = useParams<{ workSlug: string; bookSlug: string; chapterNumber: string }>();
  const chNum = parseInt(chapterNumber || "1");
  const [verseSearch, setVerseSearch] = useState("");

  const { data: works } = useQuery<LibraryWork[]>({
    queryKey: ["/api/library/works"],
    queryFn: () => fetch("/api/library/works").then(r => r.json()),
  });

  const work = works?.find((w) => w.slug === workSlug);

  const { data, isLoading } = useQuery<{ book: LibraryBook; chapter: LibraryChapterType; verses: LibraryVerse[] }>({
    queryKey: [`/api/library/works/${workSlug}/books/${bookSlug}/chapters/${chNum}`],
    queryFn: () => fetch(`/api/library/works/${workSlug}/books/${bookSlug}/chapters/${chNum}`).then(r => r.json()),
  });

  useEffect(() => {
    if (!isLoading && data?.verses) {
      const hash = window.location.hash;
      if (hash) {
        const el = document.getElementById(hash.slice(1));
        if (el) {
          setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
        }
      }
    }
  }, [isLoading, data, chapterNumber]);

  const book = data?.book;
  const chapter = data?.chapter;
  const verses = data?.verses || [];
  const hasPrev = chNum > 1;
  const hasNext = book ? chNum < book.chapterCount : false;

  const searchLower = verseSearch.toLowerCase();
  const filteredVerses = verseSearch.length > 0
    ? verses.filter((v) => v.text.toLowerCase().includes(searchLower))
    : verses;

  const highlightText = (text: string, query: string) => {
    if (!query) return <span className="text-foreground/90">{text}</span>;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span className="text-foreground/90">
        {parts.map((part, i) =>
          regex.test(part)
            ? <mark key={i} className="bg-primary/30 text-foreground rounded-sm px-0.5">{part}</mark>
            : <span key={i}>{part}</span>
        )}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-library-chapter">
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <nav className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-6 flex-wrap" data-testid="breadcrumb-chapter">
          <Link href="/library" className="hover:text-white transition-colors" data-testid="link-breadcrumb-library">LIBRARY</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/library/${workSlug}`} className="hover:text-white transition-colors" data-testid="link-breadcrumb-work">
            {work?.title?.toUpperCase() || workSlug?.toUpperCase().replace(/-/g, " ")}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/library/${workSlug}/${bookSlug}`} className="hover:text-white transition-colors" data-testid="link-breadcrumb-book">
            {book?.name?.toUpperCase() || bookSlug?.replace(/-/g, " ").toUpperCase()}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground" data-testid="text-breadcrumb-current">CHAPTER {chNum}</span>
        </nav>

        <div className="mb-8 flex items-baseline justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-wide" data-testid="text-chapter-title">
              {book?.name || bookSlug} — Chapter {chNum}
            </h1>
            <p className="text-muted-foreground text-xs mt-1" data-testid="text-verse-count">{chapter?.verseCount || verses.length} verses</p>
          </div>
          <div className="flex items-center gap-2">
            {hasPrev && (
              <Link href={`/library/${workSlug}/${bookSlug}/${chNum - 1}`} className="p-1.5 text-muted-foreground hover:text-white transition-colors" data-testid="link-prev-chapter">
                <ChevronLeft className="w-4 h-4" />
              </Link>
            )}
            {hasNext && (
              <Link href={`/library/${workSlug}/${bookSlug}/${chNum + 1}`} className="p-1.5 text-muted-foreground hover:text-white transition-colors" data-testid="link-next-chapter">
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              type="text"
              value={verseSearch}
              onChange={e => setVerseSearch(e.target.value)}
              placeholder="Search within this chapter..."
              className="w-full pl-10 pr-4 py-2 bg-card/30 border border-white/5 rounded-sm text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/15 transition-colors"
              data-testid="input-search-chapter"
            />
          </div>
          {verseSearch && (
            <p className="text-xs text-muted-foreground mt-2 font-mono" data-testid="text-search-count">
              {filteredVerses.length} verse{filteredVerses.length !== 1 ? "s" : ""} matching "{verseSearch}"
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-5 bg-card/20 rounded-sm animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
            ))}
          </div>
        ) : (
          <div className="space-y-0">
            {filteredVerses.map((verse) => {
              const anchorId = `v${verse.verseNumber}`;
              const isHighlighted = typeof window !== "undefined" && window.location.hash === `#${anchorId}`;
              return (
                <p
                  key={verse.id}
                  id={anchorId}
                  className={`py-1.5 text-sm leading-[1.8] scroll-mt-24 transition-colors ${isHighlighted ? "bg-primary/10 -mx-3 px-3 rounded-sm" : ""}`}
                  data-testid={`verse-${verse.verseNumber}`}
                >
                  <a
                    href={`#${anchorId}`}
                    className="inline-block w-8 text-right mr-3 text-xs font-mono text-muted-foreground/40 hover:text-primary/60 transition-colors select-none"
                    data-testid={`link-verse-anchor-${verse.verseNumber}`}
                  >
                    {verse.verseNumber}
                  </a>
                  {highlightText(verse.text, verseSearch)}
                </p>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between mt-12 pt-6 border-t border-white/5">
          {hasPrev ? (
            <Link href={`/library/${workSlug}/${bookSlug}/${chNum - 1}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors" data-testid="link-prev-chapter-bottom">
              <ChevronLeft className="w-3.5 h-3.5" /> Chapter {chNum - 1}
            </Link>
          ) : <div />}
          {hasNext ? (
            <Link href={`/library/${workSlug}/${bookSlug}/${chNum + 1}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors" data-testid="link-next-chapter-bottom">
              Chapter {chNum + 1} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          ) : <div />}
        </div>
      </div>
    </div>
  );
}
