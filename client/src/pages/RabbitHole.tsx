import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { GitBranch, ChevronLeft, CheckCircle2, AlertTriangle, FileText, Lock, Loader2 } from "lucide-react";
import ThreadComment from "@/components/RedThread";
import type { RabbitHole as RabbitHoleType, Comment } from "@shared/schema";

function statusBadge(status: string) {
  switch (status) {
    case "Verified":
      return <span className="text-green-500 border border-green-500/30 px-2 py-1 flex items-center gap-1 text-xs font-mono"><CheckCircle2 className="w-3 h-3" /> VERIFIED</span>;
    case "Specialist":
      return <span className="text-red-500 border border-red-500/30 px-2 py-1 flex items-center gap-1 text-xs font-mono"><AlertTriangle className="w-3 h-3" /> SPECIALIST</span>;
    case "Unsolved":
      return <span className="text-yellow-500 border border-yellow-500/30 px-2 py-1 flex items-center gap-1 text-xs font-mono"><AlertTriangle className="w-3 h-3" /> UNSOLVED</span>;
    default:
      return <span className="text-primary border border-primary/30 px-2 py-1 flex items-center gap-1 text-xs font-mono">ACTIVE</span>;
  }
}

export default function RabbitHolePage() {
  const params = useParams<{ id: string }>();
  const slug = params.id;
  const [activeTab, setActiveTab] = useState("overview");
  const [commentText, setCommentText] = useState("");

  const { data: hole, isLoading: loadingHole } = useQuery<RabbitHoleType>({
    queryKey: [`/api/holes/${slug}`],
  });

  const { data: holeComments = [], isLoading: loadingComments } = useQuery<Comment[]>({
    queryKey: [`/api/holes/${slug}/comments`],
    enabled: !!hole,
  });

  const addComment = useMutation({
    mutationFn: async (data: { username: string; content: string; reputation: number }) => {
      const res = await apiRequest("POST", `/api/holes/${slug}/comments`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/holes/${slug}/comments`] });
      setCommentText("");
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/comments/${id}/upvote`);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/holes/${slug}/comments`] }),
  });

  const downvoteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/comments/${id}/downvote`);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/holes/${slug}/comments`] }),
  });

  if (loadingHole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!hole) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="font-mono text-muted-foreground">RABBIT HOLE NOT FOUND</p>
        <Link href="/" className="text-primary font-mono text-sm">Return to Archive</Link>
      </div>
    );
  }

  const timeline = (hole.timeline || []) as { year: string; event: string; type: string }[];
  const sources = (hole.sources || []) as { id: number; title: string; type: string; credibility: number; img: string | null }[];

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    const anonNames = ["Ghost_Node", "Signal_Lost", "Deep_Archive", "Cipher_X", "Void_Walker"];
    addComment.mutate({
      username: anonNames[Math.floor(Math.random() * anonNames.length)],
      content: commentText,
      reputation: Math.floor(Math.random() * 50),
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      
      <main className="flex-1 overflow-y-auto relative z-10 border-r border-white/5 bg-background">
        
        <nav className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-white/5 z-50 p-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors font-mono text-sm uppercase">
            <ChevronLeft className="w-4 h-4" /> Back to Archive
          </Link>
          <div className="flex items-center gap-4">
            {statusBadge(hole.status)}
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-6 py-12">
          
          <header className="mb-12">
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 tracking-tighter">
              {hole.title}
            </h1>
            
            <div className="flex flex-col gap-4 bg-white/[0.02] border border-white/10 p-6">
              <div className="flex items-center justify-between font-mono text-sm">
                <span className="text-muted-foreground">EXPLORATION DEPTH</span>
                <span className="text-primary">{hole.completion}%</span>
              </div>
              <div className="h-1 bg-black w-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000 ease-out glow-effect"
                  style={{ width: `${hole.completion}%` }}
                />
              </div>
            </div>
          </header>

          <section className="mb-16">
            <h2 className="font-display text-xl uppercase tracking-widest text-muted-foreground mb-4 border-l-2 border-primary pl-4">AI Consensus Overview</h2>
            <p className="text-lg leading-relaxed text-foreground/90 font-light">
              {hole.summary}
            </p>
          </section>

          <div className="flex gap-8 border-b border-white/10 mb-8 font-mono text-sm uppercase tracking-wider overflow-x-auto">
            <button 
              className={`pb-4 px-2 whitespace-nowrap transition-colors border-b-2 ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-white'}`}
              onClick={() => setActiveTab('overview')}
              data-testid="tab-overview"
            >
              Timeline & Evidence
            </button>
            <button 
              className={`pb-4 px-2 whitespace-nowrap transition-colors border-b-2 ${activeTab === 'sources' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-white'}`}
              onClick={() => setActiveTab('sources')}
              data-testid="tab-sources"
            >
              Source Library
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="relative pl-8 border-l border-white/10 space-y-12 mb-20">
              {timeline.map((item, i) => (
                <div key={i} className="relative group">
                  <div className={`absolute -left-[37px] top-1 w-4 h-4 bg-background border-2 rounded-full group-hover:bg-green-500 transition-colors z-10 ${item.type === 'verified' ? 'border-green-500' : 'border-yellow-500'}`} />
                  <div className={`font-mono mb-2 ${item.type === 'verified' ? 'text-green-500' : 'text-yellow-500'}`}>{item.year}</div>
                  <p className="text-foreground/80 leading-relaxed">{item.event}</p>
                  {item.type === 'disputed' && (
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-yellow-500 mt-2 bg-yellow-500/10 px-2 py-0.5">
                      <AlertTriangle className="w-3 h-3" /> DISPUTED
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'sources' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
              {sources.map((source) => (
                <div key={source.id} className="border border-white/10 bg-white/[0.01] p-4 flex flex-col gap-4 group hover:border-primary/30 transition-colors">
                  <div className="aspect-[4/3] bg-black/50 border border-white/5 flex items-center justify-center text-muted-foreground">
                    <FileText className="w-12 h-12 opacity-20" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-xs font-mono px-2 py-0.5 ${source.type === 'document' ? 'bg-green-500/10 text-green-500' : source.type === 'book' ? 'bg-blue-500/10 text-blue-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        {source.type.toUpperCase()}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">AI CONFIDENCE: {source.credibility}%</span>
                    </div>
                    <h4 className="font-bold font-display">{source.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      <aside className="w-full md:w-96 bg-[#0a0a0a] border-l border-white/5 flex flex-col relative z-20">
        <div className="p-4 border-b border-white/5 bg-background/50 backdrop-blur-md z-10">
          <h3 className="font-display font-bold flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" /> 
            LIVE ANALYSIS
          </h3>
          <p className="text-xs font-mono text-muted-foreground mt-1">{holeComments.length} contributions</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 relative">
          <div className="absolute left-10 top-0 bottom-0 w-px bg-primary/30" />
          
          {loadingComments ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : holeComments.length === 0 ? (
            <div className="text-center py-12 font-mono text-xs text-muted-foreground">
              NO ANALYSIS THREADS YET
            </div>
          ) : (
            <div className="space-y-6">
              {holeComments.map((comment) => (
                <ThreadComment 
                  key={comment.id}
                  id={comment.id}
                  user={comment.username} 
                  rep={comment.reputation} 
                  time={new Date(comment.createdAt).toLocaleDateString()}
                  content={comment.content}
                  upvotes={comment.upvotes}
                  links={(comment.links || []) as { text: string; target: string }[]}
                  onUpvote={() => upvoteMutation.mutate(comment.id)}
                  onDownvote={() => downvoteMutation.mutate(comment.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 bg-black/50 space-y-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add your analysis..."
            className="w-full bg-white/5 border border-white/10 p-3 text-sm text-foreground font-mono resize-none h-20 focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/50"
            data-testid="input-comment"
          />
          <button 
            onClick={handleSubmitComment}
            disabled={addComment.isPending || !commentText.trim()}
            className="w-full bg-primary/10 border border-primary/30 text-primary font-mono text-xs uppercase py-2 hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-submit-comment"
          >
            {addComment.isPending ? "TRANSMITTING..." : "SUBMIT ANALYSIS"}
          </button>
        </div>
      </aside>

    </div>
  );
}