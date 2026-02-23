import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BookOpen, Library as LibraryIcon, ArrowRight } from "lucide-react";

export default function Library() {
  const { data: works, isLoading } = useQuery({
    queryKey: ["/api/library/works"],
    queryFn: () => fetch("/api/library/works").then(r => r.json()),
  });

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

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-28 bg-card/50 rounded-sm border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : works?.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No works available yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {works?.map((work: any) => (
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
                        {work.author && <span>{work.author}</span>}
                        {work.year && <span>{work.year}</span>}
                        {work.bookCount > 0 && <span>{work.bookCount} books</span>}
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
