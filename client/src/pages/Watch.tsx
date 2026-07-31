import { useState, useRef, useEffect } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Radio, Crown, User, Tag, Calendar, Clock, Send, MessageSquare, Lock, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { Stream, Creator, LiveChatMessage } from "@shared/schema";

interface StreamData {
  stream: Stream;
  creator: Creator;
  premium: boolean;
  hasAccess: boolean;
  /** True when BILLING_ENABLED=false on the server. Client shows "coming soon" instead of upgrade wall. */
  billingDisabled?: boolean;
}

function formatTime(date: string | Date | null) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatScheduledTime(date: string | Date | null) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function StateBadge({ state }: { state: string }) {
  if (state === "live") {
    return (
      <span className="flex items-center gap-1.5 px-2 py-1 bg-red-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider" data-testid="badge-stream-state">
        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        LIVE
      </span>
    );
  }
  if (state === "upcoming") {
    return (
      <span className="px-2 py-1 bg-yellow-600/80 text-white text-[10px] font-mono font-bold uppercase tracking-wider" data-testid="badge-stream-state">
        UPCOMING
      </span>
    );
  }
  return (
    <span className="px-2 py-1 bg-white/10 text-white/60 text-[10px] font-mono font-bold uppercase tracking-wider" data-testid="badge-stream-state">
      ENDED
    </span>
  );
}

function ChatMessage({ msg }: { msg: LiveChatMessage }) {
  return (
    <div className="px-4 py-2 hover:bg-white/[0.03] transition-colors" data-testid={`chat-message-${msg.id}`}>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-xs font-bold text-primary shrink-0" data-testid={`chat-username-${msg.id}`}>
          {msg.usernameDisplay}
        </span>
        <span className="text-sm text-foreground break-words" data-testid={`chat-text-${msg.id}`}>
          {msg.message}
        </span>
      </div>
      <span className="font-mono text-[10px] text-white/30 mt-0.5 block" data-testid={`chat-time-${msg.id}`}>
        {formatTime(msg.createdAt)}
      </span>
    </div>
  );
}

export default function Watch() {
  const { streamId } = useParams<{ streamId: string }>();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: streamData, isLoading: streamLoading } = useQuery<StreamData>({
    queryKey: [`/api/streams/${streamId}`],
    enabled: !!streamId,
  });

  const { data: chatMessages = [], isLoading: chatLoading } = useQuery<LiveChatMessage[]>({
    queryKey: [`/api/chat/${streamId}`],
    enabled: !!streamId,
    refetchInterval: 5000,
  });

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", `/api/chat/${streamId}`, { message });
      return await res.json();
    },
    onSuccess: () => {
      setChatInput("");
      queryClient.invalidateQueries({ queryKey: [`/api/chat/${streamId}`] });
    },
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    sendMessage.mutate(trimmed);
  };

  if (streamLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" data-testid="loading-watch">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!streamData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground" data-testid="error-watch">
        <Radio className="w-12 h-12 opacity-20" />
        <p className="font-mono text-sm text-white/40">Stream not found</p>
        <Link href="/live" className="font-mono text-xs text-primary hover:underline" data-testid="link-back-live">
          ← Back to Live
        </Link>
      </div>
    );
  }

  const { stream, creator, premium, hasAccess, billingDisabled } = streamData;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground" data-testid="page-watch">
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Player + Info (left ~70%) */}
        <div className="flex-1 lg:w-[70%] flex flex-col">
          {/* Player Area */}
          <div className="relative w-full aspect-video bg-black" data-testid="player-area">
            {hasAccess ? (
              <iframe
                src={stream.embedUrl}
                className="w-full h-full border-0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                data-testid="player-iframe"
              />
            ) : billingDisabled ? (
              /* Billing disabled: show neutral placeholder — never expose premium URL */
              /* TODO Phase 4 (Billing): remove this block when BILLING_ENABLED=true */
              <div className="w-full h-full flex flex-col items-center justify-center gap-6" style={{ background: "linear-gradient(135deg, #161a1e 0%, #111418 50%, #161a1e 100%)" }} data-testid="billing-coming-soon">
                <div className="p-4 rounded-full bg-white/5 border border-white/10">
                  <Radio className="w-10 h-10 text-white/30" />
                </div>
                <div className="text-center">
                  <h3 className="font-display text-2xl font-bold mb-2 text-white/70">Coming Soon</h3>
                  <p className="font-mono text-sm text-white/40 max-w-md px-4">
                    Premium streaming will be available when subscriptions launch.
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
                    This stream is available exclusively for Pro subscribers.
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

          {/* Stream Info */}
          <div className="px-6 py-6 border-b border-white/5">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <StateBadge state={stream.streamState} />
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

            {stream.scheduledStart && (
              <div className="flex items-center gap-2 text-xs font-mono text-white/40 mb-3" data-testid="text-scheduled-time">
                <Calendar className="w-3.5 h-3.5" />
                {formatScheduledTime(stream.scheduledStart)}
              </div>
            )}

            {stream.endedAt && (
              <div className="flex items-center gap-2 text-xs font-mono text-white/40 mb-3" data-testid="text-ended-time">
                <Clock className="w-3.5 h-3.5" />
                Ended {formatScheduledTime(stream.endedAt)}
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
        </div>

        {/* Chat Panel (right ~30%) */}
        <div className="lg:w-[30%] lg:min-w-[320px] lg:max-w-[420px] flex flex-col border-t lg:border-t-0 lg:border-l border-white/10 bg-card/30" data-testid="chat-panel">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="font-display text-sm font-bold uppercase tracking-wider" data-testid="text-chat-header">Live Chat</span>
            </div>
            <span className="font-mono text-[10px] text-white/30" data-testid="text-chat-count">
              {chatMessages.length} message{chatMessages.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto min-h-[300px] lg:min-h-0" data-testid="chat-messages">
            {chatLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/20" data-testid="chat-empty">
                <MessageSquare className="w-8 h-8 mb-2" />
                <span className="font-mono text-xs">No messages yet</span>
              </div>
            ) : (
              <>
                {chatMessages.map((msg) => (
                  <ChatMessage key={msg.id} msg={msg} />
                ))}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Chat Input */}
          <div className="shrink-0 border-t border-white/10">
            {!isAuthenticated ? (
              <div className="px-4 py-4 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 font-mono text-xs text-primary hover:text-primary/80 transition-colors"
                  data-testid="link-login-chat"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Login to chat
                </Link>
              </div>
            ) : premium && user?.plan !== "Pro" ? (
              <div className="px-4 py-4 text-center" data-testid="chat-premium-required">
                <div className="flex items-center justify-center gap-2 font-mono text-xs text-yellow-600">
                  <Crown className="w-3.5 h-3.5" />
                  Premium required
                </div>
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-3" data-testid="form-chat">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Send a message..."
                  maxLength={500}
                  className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-white/20 font-mono focus:outline-none focus:border-primary/50 transition-colors"
                  data-testid="input-chat"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || sendMessage.isPending}
                  className="p-2 bg-primary hover:bg-primary/80 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                  data-testid="button-send-chat"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
