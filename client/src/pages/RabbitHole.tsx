import { useState } from "react";
import { Link } from "wouter";
import { GitBranch, Database, ShieldAlert, ChevronLeft, CheckCircle2, AlertTriangle, FileText, Link as LinkIcon, Lock } from "lucide-react";
import doc1 from "@/assets/images/doc-1.png";
import doc2 from "@/assets/images/doc-2.png";
import ThreadComment from "@/components/RedThread";

// Mock Data
const HOLE_DATA = {
  title: "Project MKUltra",
  status: "Verified",
  completion: 35,
  summary: "A decades-long clandestine program by the Central Intelligence Agency (CIA) intended to develop procedures and identify drugs such as LSD that could be used in interrogations to weaken the individual and force confessions through mind control.",
  timeline: [
    { year: "1953", event: "Project officially sanctioned.", type: "verified" },
    { year: "1964", event: "Project renamed MKSEARCH.", type: "verified" },
    { year: "1973", event: "CIA Director Richard Helms orders all MKUltra files destroyed.", type: "verified" },
    { year: "1975", event: "Church Committee investigation begins.", type: "verified" },
    { year: "1977", event: "Freedom of Information Act request uncovers 20,000 surviving documents.", type: "verified" }
  ],
  sources: [
    { id: 1, title: "CIA Declassified Archives: Behavior Modification", type: "document", credibility: 98, img: doc1 },
    { id: 2, title: "Church Committee Report Book 1", type: "document", credibility: 95, img: doc2 },
    { id: 3, title: "Speculative: Operation Midnight Climax Extensions", type: "theory", credibility: 40, img: null }
  ]
};

export default function RabbitHole() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative z-10 border-r border-white/5 bg-background">
        
        {/* Navigation Bar */}
        <nav className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-white/5 z-50 p-4 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors font-mono text-sm uppercase">
              <ChevronLeft className="w-4 h-4" /> Back to Archive
            </a>
          </Link>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-green-500 border border-green-500/30 px-2 py-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> VERIFIED
            </span>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-6 py-12">
          
          {/* Header */}
          <header className="mb-12">
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 tracking-tighter">
              {HOLE_DATA.title}
            </h1>
            
            <div className="flex flex-col gap-4 bg-white/[0.02] border border-white/10 p-6">
              <div className="flex items-center justify-between font-mono text-sm">
                <span className="text-muted-foreground">EXPLORATION DEPTH</span>
                <span className="text-primary">{HOLE_DATA.completion}%</span>
              </div>
              <div className="h-1 bg-black w-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000 ease-out glow-effect"
                  style={{ width: `${HOLE_DATA.completion}%` }}
                />
              </div>
            </div>
          </header>

          {/* AI Summary */}
          <section className="mb-16">
            <h2 className="font-display text-xl uppercase tracking-widest text-muted-foreground mb-4 border-l-2 border-primary pl-4">AI Consensus Overview</h2>
            <p className="text-lg leading-relaxed text-foreground/90 font-light">
              {HOLE_DATA.summary}
            </p>
          </section>

          {/* Content Tabs */}
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
            <button 
              className={`pb-4 px-2 whitespace-nowrap transition-colors border-b-2 ${activeTab === 'connections' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-white'}`}
              onClick={() => setActiveTab('connections')}
              data-testid="tab-connections"
            >
              Network Graph
            </button>
          </div>

          {/* Timeline View */}
          {activeTab === 'overview' && (
            <div className="relative pl-8 border-l border-white/10 space-y-12 mb-20">
              {HOLE_DATA.timeline.map((item, i) => (
                <div key={i} className="relative group">
                  <div className="absolute -left-[37px] top-1 w-4 h-4 bg-background border-2 border-green-500 rounded-full group-hover:bg-green-500 transition-colors z-10" />
                  <div className="font-mono text-green-500 mb-2">{item.year}</div>
                  <p className="text-foreground/80 leading-relaxed">{item.event}</p>
                </div>
              ))}
            </div>
          )}

          {/* Sources View */}
          {activeTab === 'sources' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
              {HOLE_DATA.sources.map((source) => (
                <div key={source.id} className="border border-white/10 bg-white/[0.01] p-4 flex flex-col gap-4 group hover:border-primary/30 transition-colors">
                  {source.img ? (
                    <div className="aspect-[4/3] bg-black relative overflow-hidden border border-white/5">
                      <img src={source.img} alt={source.title} className="object-cover w-full h-full opacity-60 group-hover:opacity-100 transition-opacity filter grayscale group-hover:grayscale-0" />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-black/50 border border-white/5 flex items-center justify-center text-muted-foreground">
                      <FileText className="w-12 h-12 opacity-20" />
                    </div>
                  )}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-xs font-mono px-2 py-0.5 ${source.type === 'document' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
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

      {/* Side Panel - Red Thread Comments */}
      <aside className="w-full md:w-96 bg-[#0a0a0a] border-l border-white/5 flex flex-col relative z-20">
        <div className="p-4 border-b border-white/5 bg-background/50 backdrop-blur-md z-10">
          <h3 className="font-display font-bold flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" /> 
            LIVE ANALYSIS
          </h3>
          <p className="text-xs font-mono text-muted-foreground mt-1">Anon Reputation Required to Post</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 relative">
          {/* The physical red thread graphic background */}
          <div className="absolute left-10 top-0 bottom-0 w-px bg-primary/30" />
          
          <div className="space-y-6">
            <ThreadComment 
              user="Watcher_99" 
              rep={1402} 
              time="2h ago"
              content="If you look at the declassified budget for 1963, there is a massive unaccounted discrepancy that aligns perfectly with the expansion of the Subproject 68 facilities in San Francisco."
              upvotes={342}
              links={[{ text: "Subproject 68 facilities", target: "Midnight Climax" }]}
            />
            
            <ThreadComment 
              user="Null_State" 
              rep={890} 
              time="4h ago"
              content="The timeline presented here misses the preliminary research done at Edgewood Arsenal before the project was officially sanctioned."
              upvotes={128}
            />

            <ThreadComment 
              user="TruthSeeker" 
              rep={42} 
              time="1d ago"
              content="Has anyone cross-referenced the doctors involved with the earlier Operation Paperclip personnel?"
              upvotes={89}
              links={[{ text: "Operation Paperclip", target: "Op_Paperclip" }]}
            />
          </div>
        </div>

        {/* Comment Input */}
        <div className="p-4 border-t border-white/5 bg-black/50">
          <div className="bg-white/5 border border-white/10 p-3 text-sm text-muted-foreground flex items-start gap-3">
            <Lock className="w-4 h-4 mt-0.5 text-primary" />
            <p className="font-mono text-xs">Connecting evidence requires Rep Level 2. Your current Rep: <span className="text-white">12</span></p>
          </div>
        </div>
      </aside>

    </div>
  );
}