import { useState, useRef } from "react";
import { Link } from "wouter";
import type { ParsedCitation } from "@/lib/citations";

interface CitationLinkProps {
  citation: ParsedCitation;
  children: React.ReactNode;
}

export default function CitationLink({ citation, children }: CitationLinkProps) {
  const [preview, setPreview] = useState<{ text: string; reference: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cacheRef = useRef(new Map<string, { text: string; reference: string }>());

  const cacheKey = `${citation.bookSlug}:${citation.chapter}:${citation.verse}`;

  const fetchPreview = async () => {
    if (cacheRef.current.has(cacheKey)) {
      setPreview(cacheRef.current.get(cacheKey)!);
      setShowPreview(true);
      return;
    }

    setLoading(true);
    setShowPreview(true);
    try {
      const res = await fetch(
        `/api/library/verse-preview?bookSlug=${citation.bookSlug}&chapter=${citation.chapter}&verse=${citation.verse}&workSlug=bible-kjv`
      );
      if (res.ok) {
        const data = await res.json();
        cacheRef.current.set(cacheKey, data);
        setPreview(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(fetchPreview, 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowPreview(false);
  };

  return (
    <span
      className="relative inline"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={citation.url}
        className="text-primary/80 hover:text-primary underline underline-offset-2 decoration-primary/30 hover:decoration-primary/60 transition-colors cursor-pointer"
        data-testid={`citation-link-${citation.bookSlug}-${citation.chapter}-${citation.verse}`}
      >
        {children}
      </Link>
      {showPreview && (
        <span className="absolute z-50 bottom-full left-0 mb-1.5 w-72 p-3 bg-card border border-white/10 rounded-sm shadow-lg pointer-events-none">
          {loading ? (
            <span className="text-xs text-muted-foreground">Loading...</span>
          ) : preview ? (
            <>
              <span className="block text-[10px] font-mono text-primary/60 mb-1">{preview.reference}</span>
              <span className="block text-xs text-foreground/80 leading-relaxed">{preview.text}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Verse not found</span>
          )}
        </span>
      )}
    </span>
  );
}
