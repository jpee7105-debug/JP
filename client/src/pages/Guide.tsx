import { useState } from "react";
import { Link } from "wouter";
import {
  BookOpen, Layers, Scale, Network, Users, Clock,
  ChevronDown, ChevronRight, HelpCircle, ArrowRight
} from "lucide-react";

interface GuideSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

const sections: GuideSection[] = [
  {
    id: "investigations",
    title: "How to Read an Investigation",
    icon: Layers,
    content: (
      <div className="space-y-4">
        <p>
          Every investigation on Rabbit Hole follows a structured format designed to help you build understanding gradually.
          Rather than presenting all information at once, investigations are organized into <strong>Depth Nodes</strong> — sequential layers that start with an overview and progressively reveal more detail.
        </p>
        <h4 className="font-display font-semibold text-sm mt-6">Depth Nodes</h4>
        <p>
          Each depth node is a self-contained section with a title, summary, and full narrative. Nodes are ordered by position,
          creating a natural reading path from surface-level context to deep analysis. Some nodes may be locked for free users —
          upgrading to Pro unlocks the complete investigation.
        </p>
        <h4 className="font-display font-semibold text-sm mt-6">The Depth Reader</h4>
        <p>
          For a focused reading experience, use the Depth Reader (click "Read" on any investigation). It presents nodes one at a time
          in a sequential view with keyboard navigation. Use the left/right arrow keys or on-screen controls to move between nodes.
          Your progress is tracked visually at the top of the reader.
        </p>
        <h4 className="font-display font-semibold text-sm mt-6">Branch Links</h4>
        <p>
          Some depth nodes include branch links — connections to related investigations. These appear at the bottom of a node
          and let you follow threads across topics without losing your place in the current investigation.
        </p>
      </div>
    ),
  },
  {
    id: "claims",
    title: "What Do Labels Mean",
    icon: Scale,
    content: (
      <div className="space-y-4">
        <p>
          Investigations contain <strong>claims</strong> — specific assertions about events, people, or circumstances.
          Each claim is evaluated with two key indicators: stance and confidence.
        </p>
        <h4 className="font-display font-semibold text-sm mt-6">Stance</h4>
        <div className="space-y-2 ml-1">
          <div className="flex items-start gap-3">
            <span className="font-mono text-xs px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 mt-0.5">SUPPORTED</span>
            <span className="text-sm">The claim has strong evidence backing it. Multiple credible sources corroborate the assertion.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-mono text-xs px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 mt-0.5">DISPUTED</span>
            <span className="text-sm">The claim has conflicting evidence. Credible sources disagree, or the evidence is open to interpretation.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-mono text-xs px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 mt-0.5">SPECULATIVE</span>
            <span className="text-sm">The claim is based on inference or limited evidence. It represents a plausible interpretation but lacks definitive proof.</span>
          </div>
        </div>
        <h4 className="font-display font-semibold text-sm mt-6">Confidence Score</h4>
        <p>
          Each claim carries a confidence percentage from 0–100. This reflects how strongly the available evidence supports
          the claim as stated. A high confidence score combined with a "Supported" stance indicates a well-evidenced assertion.
          A low score with a "Speculative" stance means the claim should be treated as tentative.
        </p>
        <h4 className="font-display font-semibold text-sm mt-6">Sources</h4>
        <p>
          Every claim links to one or more sources — documents, articles, databases, or primary texts that provide
          the evidentiary basis. You can review sources to form your own assessment. Sources are normalized across
          investigations, so the same document referenced in multiple claims appears consistently.
        </p>
      </div>
    ),
  },
  {
    id: "connections",
    title: "How to Use the Connections View",
    icon: Network,
    content: (
      <div className="space-y-4">
        <p>
          The <Link href="/connections" className="text-primary hover:underline">Connections</Link> page shows a visual graph
          of relationships between investigations and people. It provides a bird's-eye view of how topics relate to each other.
        </p>
        <h4 className="font-display font-semibold text-sm mt-6">Graph Navigation</h4>
        <ul className="space-y-1.5 text-sm ml-1">
          <li className="flex items-start gap-2"><span className="text-muted-foreground/60 mt-0.5">—</span> Scroll to zoom in and out (0.2x to 2.5x range)</li>
          <li className="flex items-start gap-2"><span className="text-muted-foreground/60 mt-0.5">—</span> Click and drag the background to pan across the graph</li>
          <li className="flex items-start gap-2"><span className="text-muted-foreground/60 mt-0.5">—</span> Click and drag a node to reposition it (positions are saved)</li>
          <li className="flex items-start gap-2"><span className="text-muted-foreground/60 mt-0.5">—</span> Click a node to view its details or navigate to the full page</li>
        </ul>
        <h4 className="font-display font-semibold text-sm mt-6">Node Types</h4>
        <div className="space-y-2 ml-1">
          <div className="flex items-start gap-3">
            <span className="font-mono text-xs text-muted-foreground">Diamond</span>
            <span className="text-sm">Investigations (cases). The diamond shape helps distinguish them from people at a glance.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-mono text-xs text-muted-foreground">Circle</span>
            <span className="text-sm">People. Shown at 60% the size of investigation nodes.</span>
          </div>
        </div>
        <h4 className="font-display font-semibold text-sm mt-6">Edges & Filters</h4>
        <p>
          Lines between nodes represent relationships. Family relationships are shown with dashed lines.
          Hover over an edge to see the relationship type. Use the toggle filters to show or hide people nodes
          and family relationships.
        </p>
        <h4 className="font-display font-semibold text-sm mt-6">MiniMap</h4>
        <p>
          The minimap in the bottom-right corner shows your current viewport within the full graph.
          Use it for orientation when zoomed in on a specific area.
        </p>
      </div>
    ),
  },
  {
    id: "people",
    title: "People Profiles & Family Trees",
    icon: Users,
    content: (
      <div className="space-y-4">
        <p>
          People who appear across investigations have dedicated profile pages. You can access them from
          investigation detail pages, the Connections graph, or by navigating directly to their handle URL.
        </p>
        <h4 className="font-display font-semibold text-sm mt-6">Profile Layout</h4>
        <p>
          Each profile has two panels. The left panel shows the person's dossier — their name, aliases,
          dates, nationality, biography, and a list of case connections grouped by relationship type
          (e.g., "involved in," "witness in"). The right panel displays an interactive family tree.
        </p>
        <h4 className="font-display font-semibold text-sm mt-6">Family Tree</h4>
        <p>
          The family tree panel uses breadth-first loading to progressively reveal family connections up
          to 5 levels deep. Click on any family member to navigate to their profile. Use the fit-to-screen
          and recenter controls to adjust the view.
        </p>
      </div>
    ),
  },
  {
    id: "library",
    title: "Using the Library",
    icon: BookOpen,
    content: (
      <div className="space-y-4">
        <p>
          The <Link href="/library" className="text-primary hover:underline">Library</Link> contains primary
          source texts referenced throughout investigations. The first available work is the King James Version
          of the Bible (31,100 verses across 66 books).
        </p>
        <h4 className="font-display font-semibold text-sm mt-6">Navigation</h4>
        <p>
          Browse by work, then book, then chapter. Each chapter displays all verses with clickable verse
          numbers that create shareable anchor links (e.g., <code className="text-xs font-mono bg-white/5 px-1.5 py-0.5 rounded">#v4</code> for
          verse 4). Use the previous/next controls to move between chapters.
        </p>
        <h4 className="font-display font-semibold text-sm mt-6">Search</h4>
        <p>
          Use the search bar on any work page to find specific text across all verses. Results link directly
          to the matching verse with the anchor highlighted.
        </p>
        <h4 className="font-display font-semibold text-sm mt-6">Citation Links</h4>
        <p>
          When investigation text mentions a Bible reference (like "Genesis 6:4" or "1 Corinthians 13:4-7"),
          it's automatically detected and turned into a clickable link. Hovering over a citation shows a
          preview of the verse text without leaving the page.
        </p>
      </div>
    ),
  },
  {
    id: "timeline",
    title: "Timeline Events",
    icon: Clock,
    content: (
      <div className="space-y-4">
        <p>
          Investigations and depth nodes can include timeline events — key moments that help place
          the narrative in chronological context. Timelines appear in the overview tab of investigation
          detail pages.
        </p>
        <h4 className="font-display font-semibold text-sm mt-6">Reading Timelines</h4>
        <p>
          Each event shows a year or date, a description of what happened, and a type indicator
          (e.g., historical event, discovery, publication). Events are displayed in chronological order,
          giving you a structured overview of how the investigation's subject unfolded over time.
        </p>
      </div>
    ),
  },
];

export default function Guide() {
  const [openSection, setOpenSection] = useState<string | null>("investigations");

  return (
    <div className="min-h-screen bg-background" data-testid="page-guide">
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <HelpCircle className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl font-bold tracking-wide" data-testid="text-guide-title">GUIDE</h1>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-prose">
            Learn how Rabbit Hole works. Each section below explains a core part of the platform —
            how investigations are structured, what the labels mean, and how to navigate the research tools.
          </p>
        </div>

        <div className="space-y-2">
          {sections.map((section) => {
            const isOpen = openSection === section.id;
            const Icon = section.icon;
            return (
              <div key={section.id} className="border border-white/5 bg-card/30 rounded-sm overflow-hidden" data-testid={`guide-section-${section.id}`}>
                <button
                  onClick={() => setOpenSection(isOpen ? null : section.id)}
                  className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-white/[0.02] transition-colors"
                  data-testid={`button-guide-${section.id}`}
                >
                  <Icon className="w-4 h-4 text-primary/70 flex-shrink-0" />
                  <span className="font-display font-semibold text-sm flex-1">{section.title}</span>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground/50" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-foreground/80 leading-relaxed border-t border-white/5 pt-4">
                    {section.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-muted-foreground/40 font-mono">
            Rabbit Hole — Investigative Research Platform
          </p>
        </div>
      </div>
    </div>
  );
}
