import { ArrowUp, ArrowDown, Link2 } from "lucide-react";

interface LinkObj {
  text: string;
  target: string;
}

interface ThreadCommentProps {
  id: number;
  user: string;
  rep: number;
  time: string;
  content: string;
  upvotes: number;
  links?: LinkObj[];
  onUpvote?: () => void;
  onDownvote?: () => void;
}

export default function ThreadComment({ id, user, rep, time, content, upvotes, links = [], onUpvote, onDownvote }: ThreadCommentProps) {
  return (
    <div className="relative pl-10 group" data-testid={`comment-${id}`}>
      <div className="absolute left-[-5px] top-4 w-3 h-3 bg-black border-2 border-primary rounded-full z-10 group-hover:bg-primary group-hover:shadow-[0_0_10px_rgba(255,0,0,0.8)] transition-all" />
      <div className="absolute left-2 top-5 w-8 h-px bg-primary/30 group-hover:bg-primary/80 transition-colors" />

      <div className="bg-white/[0.03] border border-white/5 p-4 hover:border-primary/20 transition-colors shadow-lg relative">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-bold text-white">{user}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 bg-white/10 text-muted-foreground rounded-sm">REP {rep}</span>
          </div>
          <span className="text-xs font-mono text-muted-foreground">{time}</span>
        </div>

        <div className="mb-4">
          <p className="text-sm text-foreground/80 leading-relaxed">{content}</p>
          {links.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {links.map((link, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 cursor-pointer hover:bg-primary/20 transition-colors" data-testid={`link-${link.target}`}>
                  <Link2 className="w-3 h-3" /> {link.text}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1 bg-black/50 rounded-full px-2 py-1 border border-white/5">
            <button className="text-muted-foreground hover:text-primary transition-colors" onClick={onUpvote} data-testid={`button-upvote-${id}`}>
              <ArrowUp className="w-3 h-3" />
            </button>
            <span className="text-white min-w-[3ch] text-center">{upvotes}</span>
            <button className="text-muted-foreground hover:text-destructive transition-colors" onClick={onDownvote} data-testid={`button-downvote-${id}`}>
              <ArrowDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}