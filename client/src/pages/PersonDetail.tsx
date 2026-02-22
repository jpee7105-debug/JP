import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, User, Calendar, Tag, GitBranch, Users, ArrowLeft } from "lucide-react";
import type { Person, Relationship, RabbitHole } from "@shared/schema";
import { FAMILY_RELATIONSHIP_TYPES } from "@shared/schema";

function formatRelType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: person, isLoading: loadingPerson } = useQuery<Person>({
    queryKey: [`/api/people/${id}`],
    enabled: !!id,
  });

  const { data: relationships = [] } = useQuery<Relationship[]>({
    queryKey: [`/api/people/${id}/relationships`],
    enabled: !!id,
  });

  const { data: allPeople = [] } = useQuery<Person[]>({
    queryKey: ["/api/people"],
  });

  const { data: allHoles = [] } = useQuery<RabbitHole[]>({
    queryKey: ["/api/holes"],
  });

  if (loadingPerson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0E0E0E]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" data-testid="loader-person" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0E0E0E] text-center">
        <User className="w-16 h-16 text-white/10 mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">Person Not Found</h2>
        <p className="text-muted-foreground font-mono text-sm mb-6">This profile does not exist or has been removed.</p>
        <Link href="/connections" className="font-mono text-sm text-primary hover:underline flex items-center gap-2" data-testid="link-back-connections">
          <ArrowLeft className="w-4 h-4" /> Back to Connections
        </Link>
      </div>
    );
  }

  const personId = Number(id);
  const peopleMap = new Map(allPeople.map(p => [p.id, p]));
  const holesMap = new Map(allHoles.map(h => [h.id, h]));

  const caseRelationships = relationships.filter(r => {
    if (r.fromType === "hole" || r.toType === "hole") return true;
    return false;
  });

  const personRelationships = relationships.filter(r => {
    return r.fromType === "person" && r.toType === "person";
  });

  const familyRels = personRelationships.filter(r =>
    (FAMILY_RELATIONSHIP_TYPES as readonly string[]).includes(r.relationshipType)
  );

  const otherPersonRels = personRelationships.filter(r =>
    !(FAMILY_RELATIONSHIP_TYPES as readonly string[]).includes(r.relationshipType)
  );

  function getOtherPersonId(r: Relationship) {
    if (r.fromId === personId && r.fromType === "person") return r.toId;
    return r.fromId;
  }

  function getCaseId(r: Relationship) {
    if (r.fromType === "hole") return r.fromId;
    if (r.toType === "hole") return r.toId;
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E]">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Link href="/connections" className="inline-flex items-center gap-2 font-mono text-sm text-muted-foreground hover:text-primary transition-colors mb-8" data-testid="link-back-connections">
          <ArrowLeft className="w-4 h-4" /> CONNECTIONS
        </Link>

        <div className="border border-white/10 p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 border border-white/10 flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold" data-testid="text-person-name">{person.fullName}</h1>
              {person.aliases && (
                <p className="font-mono text-sm text-muted-foreground mt-1" data-testid="text-person-aliases">
                  AKA: {person.aliases}
                </p>
              )}
            </div>
          </div>

          {(person.birthDate || person.deathDate) && (
            <div className="flex items-center gap-4 mb-4 font-mono text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              {person.birthDate && <span data-testid="text-birth-date">Born: {person.birthDate}</span>}
              {person.deathDate && <span data-testid="text-death-date">Died: {person.deathDate}</span>}
            </div>
          )}

          {person.tags && person.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4" data-testid="tags-container">
              {person.tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] bg-primary/10 text-primary border border-primary/20">
                  <Tag className="w-2.5 h-2.5" /> {tag.toUpperCase()}
                </span>
              ))}
            </div>
          )}

          {person.description && (
            <div className="mt-6 border-t border-white/10 pt-6">
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap" data-testid="text-person-description">{person.description}</p>
            </div>
          )}
        </div>

        {caseRelationships.length > 0 && (
          <div className="border border-white/10 p-6 mb-6">
            <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-4" data-testid="section-related-cases">
              <GitBranch className="w-5 h-5 text-primary" /> Related Cases
            </h2>
            <div className="space-y-3">
              {caseRelationships.map(r => {
                const caseId = getCaseId(r);
                const hole = caseId ? holesMap.get(caseId) : null;
                return (
                  <div key={r.id} className="flex items-center justify-between border border-white/5 p-3 hover:border-primary/20 transition-colors" data-testid={`case-rel-${r.id}`}>
                    <div>
                      {hole ? (
                        <Link href={`/rabbithole/${hole.slug}`} className="font-display font-semibold hover:text-primary transition-colors" data-testid={`link-case-${hole.slug}`}>
                          {hole.title}
                        </Link>
                      ) : (
                        <span className="font-display font-semibold text-muted-foreground">Unknown Case</span>
                      )}
                      <span className="ml-3 font-mono text-[10px] text-primary bg-primary/10 px-2 py-0.5">
                        {formatRelType(r.relationshipType)}
                      </span>
                    </div>
                    {r.label && <span className="font-mono text-xs text-muted-foreground">{r.label}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {familyRels.length > 0 && (
          <div className="border border-white/10 p-6 mb-6">
            <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-4" data-testid="section-family">
              <Users className="w-5 h-5 text-primary" /> Family
            </h2>
            <div className="space-y-3">
              {familyRels.map(r => {
                const otherId = getOtherPersonId(r);
                const otherPerson = peopleMap.get(otherId);
                return (
                  <div key={r.id} className="flex items-center gap-3 border border-white/5 p-3 hover:border-primary/20 transition-colors" data-testid={`family-rel-${r.id}`}>
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      {otherPerson ? (
                        <Link href={`/people/${otherId}`} className="font-display font-semibold hover:text-primary transition-colors" data-testid={`link-person-${otherId}`}>
                          {otherPerson.fullName}
                        </Link>
                      ) : (
                        <span className="font-display font-semibold text-muted-foreground">Unknown Person</span>
                      )}
                      <span className="ml-3 font-mono text-[10px] text-primary bg-primary/10 px-2 py-0.5">
                        {formatRelType(r.relationshipType)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {otherPersonRels.length > 0 && (
          <div className="border border-white/10 p-6 mb-6">
            <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-4" data-testid="section-other-connections">
              <Users className="w-5 h-5 text-primary" /> Other Connections
            </h2>
            <div className="space-y-3">
              {otherPersonRels.map(r => {
                const otherId = getOtherPersonId(r);
                const otherPerson = peopleMap.get(otherId);
                return (
                  <div key={r.id} className="flex items-center gap-3 border border-white/5 p-3 hover:border-primary/20 transition-colors" data-testid={`other-rel-${r.id}`}>
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      {otherPerson ? (
                        <Link href={`/people/${otherId}`} className="font-display font-semibold hover:text-primary transition-colors" data-testid={`link-person-${otherId}`}>
                          {otherPerson.fullName}
                        </Link>
                      ) : (
                        <span className="font-display font-semibold text-muted-foreground">Unknown Person</span>
                      )}
                      <span className="ml-3 font-mono text-[10px] text-primary bg-primary/10 px-2 py-0.5">
                        {formatRelType(r.relationshipType)}
                      </span>
                      {r.label && <span className="ml-2 font-mono text-xs text-muted-foreground">{r.label}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {caseRelationships.length === 0 && familyRels.length === 0 && otherPersonRels.length === 0 && (
          <div className="border border-white/10 p-8 text-center">
            <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="font-mono text-sm text-muted-foreground">No known connections for this person.</p>
          </div>
        )}
      </div>
    </div>
  );
}