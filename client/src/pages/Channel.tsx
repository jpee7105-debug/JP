import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Radio, Clock, Calendar, Play, Crown, Tag, User, Info, Film, ArrowRight } from "lucide-react";
import type { Stream, Creator } from "@shared/schema";

interface ChannelData {
  creator: Creator;
  live: Stream[];
  upcoming: Stream[];
  replays: Stream[];
}

type TabKey = "live" | "upcoming" | "replays" | "about";

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

function StreamCard({ stream, variant }: { stream: Stream; variant: "live" | "upcoming" | "replay" }) {
  const href = variant === "replay" ? `/replay/${stream.id}` : `/watch/${stream.id}`;
  const isPremium = stream.visibility === "premium";
  const isLive = variant === "live";

  return (
    <Link
      href={href}
      className="group block relative bg-card/40 border border-white/10 hover:bg-card/60 transition-all duration-300 overflow-hidden cursor-pointer"
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
            style={{ background: `linear-gradient(135deg, #161a1e 0%, #111418 50%, #161a1e 100%)` }}
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

        {variant === "upcoming" && stream.scheduledStart && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground mb-3" data-testid={`text-scheduled-${stream.id}`}>
            <Calendar className="w-3 h-3" />
            {formatScheduledTime(stream.scheduledStart)}
          </div>
        )}

        {variant === "live" && stream.startedAt && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground mb-3" data-testid={`text-started-${stream.id}`}>
            <Clock className="w-3 h-3" />
            Started {timeAgo(stream.startedAt)}
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

export default function Channel() {
  const { handle } = useParams<{ handle: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>("live");

  const { data, isLoading, error } = useQuery<ChannelData>({
    queryKey: [`/api/channels/${handle}`],
    enabled: !!handle,
  });

  const creator = data?.creator;
  const live = data?.live ?? [];
  const upcoming = data?.upcoming ?? [];
  const replays = data?.replays ?? [];

  const tabs: { key: TabKey; label: string; count?: number; icon: React.ReactNode }[] = [
    { key: "live", label: "Live", count: live.length, icon: <Radio className="w-3.5 h-3.5" /> },
    { key: "upcoming", label: "Upcoming", count: upcoming.length, icon: <Calendar className="w-3.5 h-3.5" /> },
    { key: "replays", label: "Replays", count: replays.length, icon: <Film className="w-3.5 h-3.5" /> },
    { key: "about", label: "About", icon: <Info className="w-3.5 h-3.5" /> },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-48 md:h-64 bg-white/[0.02] animate-pulse" />
        <div className="container mx-auto px-6 -mt-16">
          <div className="flex items-end gap-5 mb-8">
            <div className="w-28 h-28 rounded-full bg-white/5 border-4 border-background animate-pulse" />
            <div className="pb-2 space-y-2">
              <div className="h-7 w-48 bg-white/5 animate-pulse" />
              <div className="h-4 w-24 bg-white/5 animate-pulse" />
            </div>
          </div>
          <div className="flex gap-4 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 w-24 bg-white/5 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-video border border-white/10 bg-white/[0.01] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center font-mono text-sm text-muted-foreground" data-testid="text-channel-error">
          <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
          CHANNEL NOT FOUND
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="relative h-48 md:h-64 w-full overflow-hidden">
        {creator.bannerUrl ? (
          <img
            src={creator.bannerUrl}
            alt={`${creator.displayName} banner`}
            className="w-full h-full object-cover"
            data-testid="img-channel-banner"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: "linear-gradient(135deg, hsl(0 72% 30%) 0%, #1a1215 40%, #111418 100%)" }}
            data-testid="placeholder-channel-banner"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-6 -mt-16 relative z-10">
        <div className="flex items-end gap-5 mb-6">
          <div className="relative shrink-0">
            {creator.avatarUrl ? (
              <img
                src={creator.avatarUrl}
                alt={creator.displayName}
                className="w-28 h-28 rounded-full object-cover border-4 border-background"
                data-testid="img-channel-avatar"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-white/5 border-4 border-background flex items-center justify-center" data-testid="placeholder-channel-avatar">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
            {creator.isActive && (
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" data-testid="badge-active" />
            )}
          </div>

          <div className="pb-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold" data-testid="text-channel-name">
              {creator.displayName}
            </h1>
            <p className="font-mono text-sm text-muted-foreground" data-testid="text-channel-handle">
              @{creator.handle}
            </p>
          </div>
        </div>

        {creator.bio && (
          <p className="text-sm text-muted-foreground max-w-2xl mb-8 leading-relaxed" data-testid="text-channel-bio">
            {creator.bio}
          </p>
        )}

        <div className="flex items-center gap-1 border-b border-white/10 mb-10" data-testid="tabs-channel">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 font-mono text-xs uppercase tracking-wider transition-colors relative ${
                activeTab === tab.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-${tab.key}`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`font-mono text-[10px] px-1.5 py-0.5 ${
                  activeTab === tab.key ? "bg-primary/30 text-foreground" : "bg-white/5 text-muted-foreground"
                }`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
              )}
            </button>
          ))}
        </div>

        <main className="pb-16">
          {activeTab === "live" && (
            <section data-testid="section-channel-live">
              {live.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-display text-xl font-bold uppercase tracking-widest border-l-2 border-red-600 pl-4 flex items-center gap-3" data-testid="text-section-live">
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
                </>
              ) : (
                <div className="text-center py-24 font-mono text-sm text-muted-foreground" data-testid="text-empty-live">
                  <Radio className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  NO LIVE STREAMS RIGHT NOW
                </div>
              )}
            </section>
          )}

          {activeTab === "upcoming" && (
            <section data-testid="section-channel-upcoming">
              {upcoming.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-display text-xl font-bold uppercase tracking-widest border-l-2 border-primary pl-4" data-testid="text-section-upcoming">
                      Upcoming
                    </h3>
                    <span className="font-mono text-[10px] text-muted-foreground">{upcoming.length} SCHEDULED</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcoming.map((stream) => (
                      <StreamCard key={stream.id} stream={stream} variant="upcoming" />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-24 font-mono text-sm text-muted-foreground" data-testid="text-empty-upcoming">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  NO UPCOMING STREAMS SCHEDULED
                </div>
              )}
            </section>
          )}

          {activeTab === "replays" && (
            <section data-testid="section-channel-replays">
              {replays.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-display text-xl font-bold uppercase tracking-widest border-l-2 border-white/20 pl-4" data-testid="text-section-replays">
                      Past Streams
                    </h3>
                    <span className="font-mono text-[10px] text-muted-foreground">{replays.length} REPLAY{replays.length !== 1 ? "S" : ""}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {replays.map((stream) => (
                      <StreamCard key={stream.id} stream={stream} variant="replay" />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-24 font-mono text-sm text-muted-foreground" data-testid="text-empty-replays">
                  <Film className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  NO REPLAYS AVAILABLE
                </div>
              )}
            </section>
          )}

          {activeTab === "about" && (
            <section data-testid="section-channel-about">
              <div className="max-w-2xl">
                <h3 className="font-display text-xl font-bold uppercase tracking-widest border-l-2 border-primary pl-4 mb-8" data-testid="text-section-about">
                  About
                </h3>

                <div className="space-y-6">
                  {creator.bio && (
                    <div className="bg-white/[0.02] border border-white/10 p-6" data-testid="card-about-bio">
                      <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">Bio</h4>
                      <p className="text-sm leading-relaxed text-foreground">
                        {creator.bio}
                      </p>
                    </div>
                  )}

                  <div className="bg-white/[0.02] border border-white/10 p-6" data-testid="card-about-info">
                    <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">Channel Info</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-muted-foreground">Handle</span>
                        <span className="font-mono text-xs text-foreground">@{creator.handle}</span>
                      </div>
                      <div className="border-t border-white/5" />
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-muted-foreground">Status</span>
                        <span className={`font-mono text-xs ${creator.isActive ? "text-green-400" : "text-muted-foreground"}`}>
                          {creator.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="border-t border-white/5" />
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-muted-foreground">Total Streams</span>
                        <span className="font-mono text-xs text-foreground">{live.length + upcoming.length + replays.length}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/live"
                    className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="link-back-live"
                  >
                    <ArrowRight className="w-3 h-3 rotate-180" />
                    Back to Live
                  </Link>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}