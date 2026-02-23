import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ChevronLeft } from "lucide-react";

export default function LibraryBook() {
  const { workSlug, bookSlug } = useParams<{ workSlug: string; bookSlug: string }>();

  const { data: books } = useQuery({
    queryKey: [`/api/library/works/${workSlug}/books`],
    queryFn: () => fetch(`/api/library/works/${workSlug}/books`).then(r => r.json()),
  });

  const book = books?.find((b: any) => b.slug === bookSlug);

  return (
    <div className="min-h-screen bg-background" data-testid="page-library-book">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link href={`/library/${workSlug}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors mb-6" data-testid="link-back-work">
          <ChevronLeft className="w-3.5 h-3.5" /> ALL BOOKS
        </Link>

        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold tracking-wide" data-testid="text-book-title">
            {book?.name || bookSlug?.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
          </h1>
          {book && (
            <p className="text-muted-foreground text-sm mt-1">
              {book.testament === "OT" ? "Old Testament" : "New Testament"} · {book.chapterCount} chapters
            </p>
          )}
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {book ? (
            Array.from({ length: book.chapterCount }, (_, i) => i + 1).map(ch => (
              <Link
                key={ch}
                href={`/library/${workSlug}/${bookSlug}/${ch}`}
                className="group flex items-center justify-center h-11 bg-card/30 border border-white/5 rounded-sm hover:border-white/15 hover:bg-card/60 transition-all"
                data-testid={`link-chapter-${ch}`}
              >
                <span className="text-sm font-mono text-muted-foreground group-hover:text-primary transition-colors">{ch}</span>
              </Link>
            ))
          ) : (
            Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="h-11 bg-card/20 rounded-sm animate-pulse" />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
