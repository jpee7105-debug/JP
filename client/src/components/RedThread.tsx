import { ArrowUp, ArrowDown, Link2 } from "lucide-react";

interface LinkObj {
  text: string;
  target: string;
}

interface ThreadCommentProps {
  user: string;
  rep: number;
  time: string;
  content: string;
  upvotes: number;
  links?: LinkObj[];
}

export default function ThreadComment({ user, rep, time, content, upvotes, links = [] }: ThreadCommentProps) {
  
  // Function to highlight linked text
  const renderContent = () => {
    if (!links || links.length === 0) return <p className="text-sm text-foreground/80 leading-relaxed">{content}</p>;

    let result = content;
    links.forEach(link => {
      // Very basic string replacement for mockup purposes
      const parts = result.split(link.text);
      if (parts.length > 1) {
        return (
          <p className="text-sm text-foreground/80 leading-relaxed">
            {parts[0]}
            <span className="relative group inline-block cursor-pointer" data-testid={`link-${link.target}`}>
              <span className="text-primary font-medium border-b border-primary/30 hover:border-primary transition-colors">{link.text}</span>
              {/* Tooltip simulating the connection */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-black border border-primary/50 text-xs font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Connects to: {link.target}
              </span>
            </span>
            {parts[1]}
          </p>
        );
      }
    });

    return <p className="text-sm text-foreground/80 leading-relaxed">{content}</p>;
  };

  return (
    <div className="relative pl-10 group" data-testid={`comment-${user}`}>
      {/* Pin / Node on the thread */}
      <div className="absolute left-[-5px] top-4 w-3 h-3 bg-black border-2 border-primary rounded-full z-10 group-hover:bg-primary group-hover:shadow-[0_0_10px_rgba(255,0,0,0.8)] transition-all" />
      
      {/* Connector line from node to card */}
      <div className="absolute left-2 top-5 w-8 h-px bg-primary/30 group-hover:bg-primary/80 transition-colors" />

      {/* Comment Card */}
      <div className="bg-white/[0.03] border border-white/5 p-4 hover:border-primary/20 transition-colors shadow-lg relative">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-bold text-white">{user}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 bg-white/10 text-muted-foreground rounded-sm">REP {rep}</span>
          </div>
          <span className="text-xs font-mono text-muted-foreground">{time}</span>
        </div>

        {/* Body */}
        <div className="mb-4">
          {renderContent()}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1 bg-black/50 rounded-full px-2 py-1 border border-white/5">
            <button className="text-muted-foreground hover:text-primary transition-colors" data-testid="button-upvote">
              <ArrowUp className="w-3 h-3" />
            </button>
            <span className="text-white min-w-[3ch] text-center">{upvotes}</span>
            <button className="text-muted-foreground hover:text-destructive transition-colors" data-testid="button-downvote">
              <ArrowDown className="w-3 h-3" />
            </button>
          </div>
          
          <button className="text-muted-foreground hover:text-white transition-colors flex items-center gap-1" data-testid="button-reply">
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}