import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Radio, Clock, Calendar, Play, Crown, User, Tag, ArrowRight } from "lucide-react";
import type { Stream, Creator } from "@shared/schema";

type StreamWithCreator = Stream & { creator: Pick<Creator, "id" | "handle" | "displayName" | "avatarUrl"> };

interface LiveData {
  live: StreamWithCreator[];
  upcoming: StreamWithCreator[];
  replays: StreamWithCreator[];
  featured: StreamWithCreator[];
}

function formatScheduledTime(date: string | Date | null) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function timeAgo(date: string | Date | null) {
  if (!date) return "";
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function StreamCard({ stream, variant }: { stream: StreamWithCreator; variant: "live" | "upcoming" | "replay" }) {
  const href = variant === "replay" ? `/replay/${stream.id}` : `/watch/${stream.id}`;
  const isPremium = stream.visibility === "premium";
  const isLive = variant === "live";

  return (
    <Link
      href={href}
      className="group block relative bg-black/40 border border-white/10 hover:bg-black/60 transition-all duration-300 overflow-hidden cursor-pointer"
      data-testid={`card-stream-${stream.id}`}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-white/[0.02]">
        {stream.thumbnailUrl ? (
          <img
            src={stream.thumbnailUrl}
            alt={stream.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            data-testid={`img-thumbnail-${stream.id}`}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, #1a0000 0%, #0E0E0E 50%, #1a0505 100%)` }}
            data-testid={`placeholder-thumbnail-${stream.id}`}
          >
            <Radio className="w-10 h-10 text-primary/30" />
          </div>
        )}

        <div className="absolute top-2 left-2 flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-red-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider" data-testid={`badge-live-${stream.id}`}>
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              LIVE
            </span>
          )}
          {isPremium && (
            <span className="flex items-center gap-1 px-2 py-1 bg-yellow-600/90 text-white text-[10px] font-mono font-bold uppercase tracking-wider" data-testid={`badge-premium-${stream.id}`}>
              <Crown className="w-3 h-3" />
              PREMIUM
            </span>
          )}
        </div>

        {variant === "replay" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-12 h-12 text-white/80" />
          </div>
        )}
      </div>

      <div className="p-4">
        <h4 className="font-display text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2" data-testid={`text-title-${stream.id}`}>
          {stream.title}
        </h4>

        <Link
          href={`/channel/${stream.creator.handle}`}
          className="flex items-center gap-2 mb-3 hover:text-primary transition-colors"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          data-testid={`link-creator-${stream.id}`}
        >
          {stream.creator.avatarUrl ? (
            <img src={stream.creator.avatarUrl} alt={stream.creator.displayName} className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-muted-foreground" />
          )}
          <span className="font-mono text-xs text-muted-foreground group-hover:text-primary/80">
            {stream.creator.displayName}
          </span>
        </Link>

        {variant === "upcoming" && stream.scheduledStart && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground mb-3" data-testid={`text-scheduled-${stream.id}`}>
            <Calendar className="w-3 h-3" />
            {formatScheduledTime(stream.scheduledStart)}
          </div>
        )}

        {variant === "replay" && stream.endedAt && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground mb-3" data-testid={`text-ended-${stream.id}`}>
            <Clock className="w-3 h-3" />
            {timeAgo(stream.endedAt)}
          </div>
        )}

        {stream.tags && stream.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap" data-testid={`tags-${stream.id}`}>
            <Tag className="w-3 h-3 text-muted-foreground" />
            {stream.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="font-mono text-[10px] px-1.5 py-0.5 bg-white/5 border border-white/10 text-muted-foreground"
                data-testid={`tag-${stream.id}-${tag}`}
              >
                {tag.toUpperCase()}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-primary group-hover:w-full transition-all duration-500 ease-out" />
    </Link>
  );
}

export default function Live() {
  const { data, isLoading } = useQuery<LiveData>({
    queryKey: ["/api/live"],
  });

  const { live = [], upcoming = [], replays = [], featured = [] } = data || {};

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-2">
            <Radio className="w-6 h-6 text-primary" />
            <h1 className="font-display text-3xl font-bold uppercase tracking-wider" data-testid="text-live-title">Live</h1>
          </div>
          <p className="text-muted-foreground font-light max-w-2xl">
            Watch live streams, catch upcoming broadcasts, and replay past sessions from Rabbit Hole creators.
          </p>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-6 pb-16">
        {featured.length > 0 && (
          <section className="mt-10 mb-16" data-testid="section-featured">
            <Link
              href={featured[0].streamState === "ended" ? `/replay/${featured[0].id}` : `/watch/${featured[0].id}`}
              className="group block relative overflow-hidden border border-white/10 hover:border-primary/30 transition-colors"
              data-testid={`card-featured-${featured[0].id}`}
            >
              <div className="relative h-[50vh] min-h-[320px] w-full">
                {featured[0].thumbnailUrl ? (
                  <img
                    src={featured[0].thumbnailUrl}
                    alt={featured[0].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ background: `linear-gradient(135deg, #2a0000 0%, #0E0E0E 60%, #1a0505 100%)` }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-center gap-2 mb-4">
                    {featured[0].streamState === "live" && (
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-red-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider" data-testid={`badge-featured-live-${featured[0].id}`}>
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        LIVE NOW
                      </span>
                    )}
                    {featured[0].visibility === "premium" && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-yellow-600/90 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                        <Crown className="w-3 h-3" />
                        PREMIUM
                      </span>
                    )}
                    <span className="px-2 py-1 bg-primary/20 text-primary text-[10px] font-mono font-bold uppercase tracking-wider border border-primary/30">
                      FEATURED
                    </span>
                  </div>

                  <h2 className="font-display text-4xl md:text-5xl font-bold mb-3 group-hover:text-primary transition-colors" data-testid={`text-featured-title-${featured[0].id}`}>
                    {featured[0].title}
                  </h2>

                  {featured[0].description && (
                    <p className="text-muted-foreground text-sm md:text-base mb-4 max-w-2xl line-clamp-2">
                      {featured[0].description}
                    </p>
                  )}

                  <div className="flex items-center gap-4">
                    <Link
                      href={`/channel/${featured[0].creator.handle}`}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      data-testid={`link-featured-creator-${featured[0].id}`}
                    >
                      {featured[0].creator.avatarUrl ? (
                        <img src={featured[0].creator.avatarUrl} alt={featured[0].creator.displayName} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-muted-foreground" />
                      )}
                      <span className="font-mono text-sm text-muted-foreground">
                        {featured[0].creator.displayName}
                      </span>
                    </Link>

                    <span className="text-xs font-mono text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      WATCH <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {isLoading ? (
          <div className="space-y-16 mt-10">
            {[1, 2, 3].map((section) => (
              <div key={section}>
                <div className="h-6 w-40 bg-white/5 mb-8 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-video border border-white/10 bg-white/[0.01] animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {live.length > 0 && (
              <section className="mb-16" data-testid="section-live">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-display text-2xl font-bold uppercase tracking-widest border-l-2 border-red-600 pl-4 flex items-center gap-3" data-testid="text-section-live">
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                    Live Now
                  </h3>
                  <span className="font-mono text-[10px] text-red-500 animate-pulse">BROADCASTING</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {live.map((stream) => (
                    <StreamCard key={stream.id} stream={stream} variant="live" />
                  ))}
                </div>
              </section>
            )}

            {upcoming.length > 0 && (
              <section className="mb-16" data-testid="section-upcoming">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-display text-2xl font-bold uppercase tracking-widest border-l-2 border-primary pl-4" data-testid="text-section-upcoming">
                    Upcoming
                  </h3>
                  <span className="font-mono text-[10px] text-muted-foreground">{upcoming.length} SCHEDULED</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcoming.map((stream) => (
                    <StreamCard key={stream.id} stream={stream} variant="upcoming" />
                  ))}
                </div>
              </section>
            )}

            {replays.length > 0 && (
              <section className="mb-16" data-testid="section-replays">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-display text-2xl font-bold uppercase tracking-widest border-l-2 border-white/20 pl-4" data-testid="text-section-replays">
                    Past Streams
                  </h3>
                  <span className="font-mono text-[10px] text-muted-foreground">{replays.length} REPLAY{replays.length !== 1 ? "S" : ""}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {replays.map((stream) => (
                    <StreamCard key={stream.id} stream={stream} variant="replay" />
                  ))}
                </div>
              </section>
            )}

            {live.length === 0 && upcoming.length === 0 && replays.length === 0 && featured.length === 0 && (
              <div className="text-center py-24 font-mono text-sm text-muted-foreground" data-testid="text-empty-state">
                <Radio className="w-12 h-12 mx-auto mb-4 opacity-20" />
                NO STREAMS AVAILABLE
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
