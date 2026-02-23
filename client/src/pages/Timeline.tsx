import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { Clock, MapPin, Tag, ExternalLink, ArrowRight, Loader2, Calendar } from "lucide-react";
import type { GlobalTimelineItem, RabbitHole } from "@shared/schema";

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function TimelineItemCard({ item, investigations }: { item: GlobalTimelineItem; investigations: RabbitHole[] }) {
  const [, navigate] = useLocation();

  const handleClick = () => {
    switch (item.linkType) {
      case "investigation":
        if (item.linkId) navigate(`/rabbithole/${item.linkId}`);
        break;
      case "node":
        if (item.linkId) navigate(`/rabbithole/${item.linkId}`);
        break;
      case "person":
        if (item.linkId) navigate(`/people/${item.linkId}`);
        break;
      case "external":
        if (item.linkUrl) window.open(item.linkUrl, "_blank", "noopener");
        break;
      case "timeline_entry": {
        const inv = investigations.find((i) => i.id === item.relatedInvestigationId);
        if (inv) navigate(`/rabbithole/${inv.slug}`);
        break;
      }
    }
  };

  const location = [item.city, item.region, item.country].filter(Boolean).join(", ");

  return (
    <div
      className="group relative pl-8 md:pl-12 pb-12 cursor-pointer"
      onClick={handleClick}
      data-testid={`card-timeline-${item.id}`}
    >
      <div className="absolute left-0 md:left-3 top-1.5 w-3 h-3 border-2 border-primary bg-background rounded-full z-10 group-hover:bg-primary transition-colors" />

      <div className="border border-white/10 bg-card/40 hover:bg-card/60 transition-all duration-300 overflow-hidden">
        {item.featuredImageUrl && (
          <div className="w-full h-48 overflow-hidden border-b border-white/10">
            <img
              src={item.featuredImageUrl}
              alt={item.title}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              data-testid={`img-timeline-${item.id}`}
            />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="font-mono text-xs text-primary flex items-center gap-1" data-testid={`text-date-${item.id}`}>
              <Calendar className="w-3 h-3" />
              {formatDate(item.date)}
            </span>
            {location && (
              <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {location}
              </span>
            )}
            <span className="font-mono text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 text-muted-foreground uppercase">
              {item.linkType.replace("_", " ")}
            </span>
          </div>

          <h3 className="font-display text-xl font-bold mb-2 group-hover:text-primary transition-colors" data-testid={`text-title-${item.id}`}>
            {item.title}
          </h3>

          {item.summary && (
            <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3" data-testid={`text-summary-${item.id}`}>
              {item.summary}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-2 flex-wrap">
              {(item.tags as string[])?.map((tag: string) => (
                <span
                  key={tag}
                  className="font-mono text-[10px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20"
                  data-testid={`tag-${item.id}-${tag}`}
                >
                  <Tag className="w-2.5 h-2.5 inline mr-1" />
                  {tag}
                </span>
              ))}
            </div>
            <span className="text-xs font-mono text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.linkType === "external" ? (
                <>
                  OPEN <ExternalLink className="w-3 h-3" />
                </>
              ) : (
                <>
                  VIEW <ArrowRight className="w-3 h-3" />
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Timeline() {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeInvestigation, setActiveInvestigation] = useState<string>("");

  const { data: tags = [] } = useQuery<string[]>({
    queryKey: ["/api/timeline/tags"],
  });

  const { data: investigations = [] } = useQuery<RabbitHole[]>({
    queryKey: ["/api/holes"],
  });

  const buildUrl = (offset: number) => {
    const params = new URLSearchParams();
    params.set("limit", "20");
    params.set("offset", String(offset));
    if (activeTag) params.set("tag", activeTag);
    if (activeInvestigation) params.set("investigationId", activeInvestigation);
    return `/api/timeline?${params.toString()}`;
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<GlobalTimelineItem[]>({
    queryKey: ["/api/timeline", activeTag, activeInvestigation],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await fetch(buildUrl(pageParam as number), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch timeline");
      return res.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 20) return undefined;
      return allPages.reduce((acc, page) => acc + page.length, 0);
    },
    initialPageParam: 0,
  });

  const items = data?.pages.flat() ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-primary" />
            <h1 className="font-display text-3xl font-bold uppercase tracking-wider" data-testid="text-timeline-title">
              Timeline
            </h1>
          </div>
          <p className="text-muted-foreground font-light max-w-2xl">
            A chronological record of key events, connections, and discoveries across all investigations.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveTag(null)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase whitespace-nowrap border transition-colors ${!activeTag ? "border-primary text-primary bg-primary/10" : "border-white/10 text-muted-foreground hover:text-white hover:border-white/20"}`}
              data-testid="button-tag-all"
            >
              ALL
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase whitespace-nowrap border transition-colors ${activeTag === tag ? "border-primary text-primary bg-primary/10" : "border-white/10 text-muted-foreground hover:text-white hover:border-white/20"}`}
                data-testid={`button-tag-${tag}`}
              >
                <Tag className="w-3 h-3" />
                {tag}
              </button>
            ))}
          </div>

          <select
            value={activeInvestigation}
            onChange={(e) => setActiveInvestigation(e.target.value)}
            className="bg-card border border-white/10 text-sm font-mono px-3 py-2 text-muted-foreground focus:outline-none focus:border-primary/50 max-w-xs"
            data-testid="select-investigation-filter"
          >
            <option value="">ALL INVESTIGATIONS</option>
            {investigations.map((inv) => (
              <option key={inv.id} value={String(inv.id)}>
                {inv.title}
              </option>
            ))}
          </select>
        </div>

        <div className="font-mono text-xs text-muted-foreground mb-6">
          {items.length} EVENT{items.length !== 1 ? "S" : ""}
        </div>
      </div>

      <main className="flex-1 container mx-auto px-6 pb-16">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 font-mono text-sm text-muted-foreground" data-testid="text-timeline-empty">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
            NO TIMELINE EVENTS FOUND
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-1.5 md:left-[18px] top-0 bottom-0 w-px bg-white/10" />

            {items.map((item) => (
              <TimelineItemCard key={item.id} item={item} investigations={investigations} />
            ))}

            {hasNextPage && (
              <div className="pl-8 md:pl-12 pt-4">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="flex items-center gap-2 px-6 py-3 text-xs font-mono uppercase border border-white/10 text-muted-foreground hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
                  data-testid="button-load-more"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      LOADING...
                    </>
                  ) : (
                    "LOAD MORE"
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
