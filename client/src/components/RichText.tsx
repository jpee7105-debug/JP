import { segmentText } from "@/lib/citations";
import CitationLink from "@/components/CitationLink";

interface RichTextProps {
  text: string;
  className?: string;
}

export default function RichText({ text, className }: RichTextProps) {
  const segments = segmentText(text);

  if (segments.length === 1 && segments[0].type === "text") {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === "citation" && seg.citation) {
          return (
            <CitationLink key={i} citation={seg.citation}>
              {seg.content}
            </CitationLink>
          );
        }
        return <span key={i}>{seg.content}</span>;
      })}
    </span>
  );
}
