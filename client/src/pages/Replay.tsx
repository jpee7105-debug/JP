import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Radio, Crown, User, Tag, Clock, Lock, Play, Film } from "lucide-react";
import type { Stream, Creator, StreamReplay } from "@shared/schema";

interface ReplayData {
  stream: Stream;
  creator: Creator;
  replays: StreamReplay[];
  premium: boolean;
  hasAccess: boolean;
  /** True when BILLING_ENABLED=false on the server. Client shows "coming soon" instead of upgrade wall. */
  billingDisabled?: boolean;
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatEndedTime(date: string | Date | null) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function Replay() {
  const { streamId } = useParams<{ streamId: string }>();
  const [activeReplayIndex, setActiveReplayIndex] = useState(0);

  const { data: replayData, isLoading } = useQuery<ReplayData>({
    queryKey: [`/api/replays/${streamId}`],
    enabled: !!streamId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" data-testid="loading-replay">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!replayData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground" data-testid="error-replay">
        <Radio className="w-12 h-12 opacity-20" />
        <p className="font-mono text-sm text-white/40">Replay not found</p>
        <Link href="/live" className="font-mono text-xs text-primary hover:underline" data-testid="link-back-live">
          ← Back to Live
        </Link>
      </div>
    );
  }

  const { stream, creator, replays, premium, hasAccess, billingDisabled } = replayData;

  const currentEmbedUrl = replays.length > 0
    ? replays[activeReplayIndex]?.embedUrl ?? stream.embedUrl
    : stream.embedUrl;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground" data-testid="page-replay">
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
        <div className="relative w-full aspect-video bg-black" data-testid="player-area">
          {hasAccess ? (
            <iframe
              src={currentEmbedUrl}
              className="w-full h-full border-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              data-testid="player-iframe"
            />
          ) : billingDisabled ? (
            /* Billing disabled: show neutral placeholder — never expose premium replay URL */
            /* TODO Phase 4 (Billing): remove this block when BILLING_ENABLED=true */
            <div className="w-full h-full flex flex-col items-center justify-center gap-6" style={{ background: "linear-gradient(135deg, #161a1e 0%, #111418 50%, #161a1e 100%)" }} data-testid="billing-coming-soon">
              <div className="p-4 rounded-full bg-white/5 border border-white/10">
                <Film className="w-10 h-10 text-white/30" />
              </div>
              <div className="text-center">
                <h3 className="font-display text-2xl font-bold mb-2 text-white/70">Coming Soon</h3>
                <p className="font-mono text-sm text-white/40 max-w-md px-4">
                  Premium replays will be available when subscriptions launch.
                </p>
              </div>
            </div>
          ) : (
            /* TODO Phase 4 (Billing): restore this upgrade wall when BILLING_ENABLED=true */
            <div className="w-full h-full flex flex-col items-center justify-center gap-6" style={{ background: "linear-gradient(135deg, #161a1e 0%, #111418 50%, #161a1e 100%)" }} data-testid="premium-wall">
              <div className="p-4 rounded-full bg-primary/20 border border-primary/30">
                <Lock className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-display text-2xl font-bold mb-2" data-testid="text-premium-title">Premium Content</h3>
                <p className="font-mono text-sm text-white/50 mb-6 max-w-md px-4" data-testid="text-premium-desc">
                  This replay is available exclusively for Pro subscribers.
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 text-white font-mono text-sm font-bold uppercase tracking-wider transition-colors"
                  data-testid="link-upgrade"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="flex items-center gap-1.5 px-2 py-1 bg-white/10 text-white/60 text-[10px] font-mono font-bold uppercase tracking-wider" data-testid="badge-replay">
              <Film className="w-3 h-3" />
              REPLAY
            </span>
            {premium && (
              <span className="flex items-center gap-1 px-2 py-1 bg-yellow-600/90 text-white text-[10px] font-mono font-bold uppercase tracking-wider" data-testid="badge-premium">
                <Crown className="w-3 h-3" />
                PREMIUM
              </span>
            )}
          </div>

          <h1 className="font-display text-2xl md:text-3xl font-bold mb-3" data-testid="text-stream-title">
            {stream.title}
          </h1>

          <Link
            href={`/channel/${creator.handle}`}
            className="inline-flex items-center gap-2 mb-4 hover:text-primary transition-colors"
            data-testid="link-creator"
          >
            {creator.avatarUrl ? (
              <img src={creator.avatarUrl} alt={creator.displayName} className="w-6 h-6 rounded-full object-cover" data-testid="img-creator-avatar" />
            ) : (
              <User className="w-6 h-6 text-white/40" />
            )}
            <span className="font-mono text-sm text-white/60 hover:text-primary" data-testid="text-creator-name">
              {creator.displayName}
            </span>
          </Link>

          {stream.endedAt && (
            <div className="flex items-center gap-2 text-xs font-mono text-white/40 mb-3" data-testid="text-ended-time">
              <Clock className="w-3.5 h-3.5" />
              Ended {formatEndedTime(stream.endedAt)}
            </div>
          )}

          {stream.tags && stream.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-4" data-testid="stream-tags">
              <Tag className="w-3.5 h-3.5 text-white/30" />
              {stream.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 text-white/50"
                  data-testid={`tag-${tag}`}
                >
                  {tag.toUpperCase()}
                </span>
              ))}
            </div>
          )}

          {stream.description && (
            <p className="text-sm text-white/50 leading-relaxed max-w-3xl" data-testid="text-stream-description">
              {stream.description}
            </p>
          )}
        </div>

        {replays.length > 1 && (
          <div className="px-6 py-6" data-testid="replay-parts">
            <h2 className="font-display text-lg font-bold mb-4 uppercase tracking-wider" data-testid="text-replay-parts-header">
              Replay Parts
            </h2>
            <div className="flex flex-col gap-2">
              {replays.map((replay, index) => (
                <button
                  key={replay.id}
                  onClick={() => setActiveReplayIndex(index)}
                  className={`flex items-center gap-3 px-4 py-3 text-left transition-colors border ${
                    index === activeReplayIndex
                      ? "bg-primary/20 border-primary/40 text-white"
                      : "bg-white/[0.03] border-white/5 text-white/60 hover:bg-white/[0.06] hover:text-white/80"
                  }`}
                  data-testid={`button-replay-part-${replay.id}`}
                >
                  <Play className={`w-4 h-4 shrink-0 ${index === activeReplayIndex ? "text-primary" : "text-white/30"}`} />
                  <span className="font-mono text-sm flex-1">Part {index + 1}</span>
                  {replay.durationSeconds > 0 && (
                    <span className="font-mono text-[10px] text-white/30" data-testid={`text-replay-duration-${replay.id}`}>
                      {formatDuration(replay.durationSeconds)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
