import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";

export default function LibraryChapter() {
  const { workSlug, bookSlug, chapterNumber } = useParams<{ workSlug: string; bookSlug: string; chapterNumber: string }>();
  const chNum = parseInt(chapterNumber || "1");

  const { data, isLoading } = useQuery({
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

  return (
    <div className="min-h-screen bg-background" data-testid="page-library-chapter">
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <Link href={`/library/${workSlug}/${bookSlug}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors mb-6" data-testid="link-back-book">
          <ChevronLeft className="w-3.5 h-3.5" /> {book?.name?.toUpperCase() || "BOOK"}
        </Link>

        <div className="mb-8 flex items-baseline justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-wide" data-testid="text-chapter-title">
              {book?.name || bookSlug} — Chapter {chNum}
            </h1>
            <p className="text-muted-foreground text-xs mt-1">{chapter?.verseCount || verses.length} verses</p>
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

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-5 bg-card/20 rounded-sm animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
            ))}
          </div>
        ) : (
          <div className="space-y-0">
            {verses.map((verse: any) => {
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
                  <span className="text-foreground/90">{verse.text}</span>
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
