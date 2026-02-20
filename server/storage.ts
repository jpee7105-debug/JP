import { eq, desc, ilike, or, asc, sql, and, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  rabbitHoles,
  comments,
  depthNodes,
  claims,
  sources,
  categories,
  media,
  auditLogs,
  users,
  employees,
  podcasts,
  podcastEpisodes,
  rabbitHolePodcastEpisodes,
  sponsoredPodcastSlots,
  type RabbitHole,
  type InsertRabbitHole,
  type Comment,
  type InsertComment,
  type DepthNode,
  type InsertDepthNode,
  type Claim,
  type InsertClaim,
  type Source,
  type InsertSource,
  type Category,
  type InsertCategory,
  type Media,
  type InsertMedia,
  type AuditLog,
  type InsertAuditLog,
  type User,
  type InsertUser,
  type Employee,
  type InsertEmployee,
  type Podcast,
  type InsertPodcast,
  type PodcastEpisode,
  type InsertPodcastEpisode,
  type RabbitHolePodcastEpisode,
  type InsertRabbitHolePodcastEpisode,
  type SponsoredPodcastSlot,
  type InsertSponsoredPodcastSlot,
  creators,
  streams,
  streamReplays,
  liveChatMessages,
  chatModerationActions,
  type Creator,
  type InsertCreator,
  type Stream,
  type InsertStream,
  type StreamReplay,
  type InsertStreamReplay,
  type LiveChatMessage,
  type InsertLiveChatMessage,
  type ChatModerationAction,
  type InsertChatModerationAction,
} from "@shared/schema";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  getAllHoles(): Promise<RabbitHole[]>;
  getPublishedHoles(): Promise<RabbitHole[]>;
  getSpecialistHoles(): Promise<RabbitHole[]>;
  getPublishedSpecialistHoles(): Promise<RabbitHole[]>;
  getCommunityHoles(): Promise<RabbitHole[]>;
  getPublishedCommunityHoles(): Promise<RabbitHole[]>;
  getHoleBySlug(slug: string): Promise<RabbitHole | undefined>;
  getHoleById(id: number): Promise<RabbitHole | undefined>;
  getHolesByCategory(categorySlug: string): Promise<RabbitHole[]>;
  getPublishedHolesByCategory(categorySlug: string): Promise<RabbitHole[]>;
  createHole(hole: InsertRabbitHole): Promise<RabbitHole>;
  updateHole(id: number, data: Partial<InsertRabbitHole>): Promise<RabbitHole | undefined>;
  deleteHole(id: number): Promise<boolean>;

  getCommentsByHoleId(holeId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  upvoteComment(id: number): Promise<Comment | undefined>;
  downvoteComment(id: number): Promise<Comment | undefined>;

  getDepthNodesByHoleId(holeId: number): Promise<DepthNode[]>;
  getDepthNode(id: number): Promise<DepthNode | undefined>;
  createDepthNode(node: InsertDepthNode): Promise<DepthNode>;
  updateDepthNode(id: number, data: Partial<InsertDepthNode>): Promise<DepthNode | undefined>;
  deleteDepthNode(id: number): Promise<boolean>;

  getClaimsByHoleId(holeId: number): Promise<Claim[]>;
  getClaim(id: number): Promise<Claim | undefined>;
  createClaim(claim: InsertClaim): Promise<Claim>;
  updateClaim(id: number, data: Partial<InsertClaim>): Promise<Claim | undefined>;
  deleteClaim(id: number): Promise<boolean>;

  getSourcesByHoleId(holeId: number): Promise<Source[]>;
  getAllSources(): Promise<Source[]>;
  getSource(id: number): Promise<Source | undefined>;
  createSource(source: InsertSource): Promise<Source>;
  updateSource(id: number, data: Partial<InsertSource>): Promise<Source | undefined>;
  deleteSource(id: number): Promise<boolean>;
  searchSources(query: string): Promise<Source[]>;

  getMediaByHoleId(holeId: number): Promise<Media[]>;
  getMedia(id: number): Promise<Media | undefined>;
  createMedia(m: InsertMedia): Promise<Media>;
  updateMedia(id: number, data: Partial<InsertMedia>): Promise<Media | undefined>;
  deleteMedia(id: number): Promise<boolean>;

  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  search(query: string): Promise<{ holes: RabbitHole[]; sources: Source[]; claims: Claim[] }>;

  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogsByHoleId(holeId: number): Promise<AuditLog[]>;
  getAllAuditLogs(): Promise<AuditLog[]>;

  exportAll(): Promise<{
    rabbitHoles: RabbitHole[];
    depthNodes: DepthNode[];
    claims: Claim[];
    sources: Source[];
    media: Media[];
    comments: Comment[];
    categories: Category[];
  }>;
  importAll(data: {
    rabbitHoles?: any[];
    depthNodes?: any[];
    claims?: any[];
    sources?: any[];
    media?: any[];
    comments?: any[];
    categories?: any[];
  }): Promise<{ imported: Record<string, number> }>;

  validateIntegrity(): Promise<{
    issues: { holeId: number; holeTitle: string; type: string; message: string }[];
  }>;

  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  createEmployee(emp: InsertEmployee): Promise<Employee>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  getEmployeeById(id: string): Promise<Employee | undefined>;
  getAllEmployees(): Promise<Employee[]>;
  updateEmployee(id: string, data: Partial<Employee>): Promise<Employee | undefined>;
  getEmployeeCount(): Promise<number>;

  getAllPodcasts(): Promise<Podcast[]>;
  getPodcast(id: number): Promise<Podcast | undefined>;
  createPodcast(p: InsertPodcast): Promise<Podcast>;
  updatePodcast(id: number, data: Partial<InsertPodcast>): Promise<Podcast | undefined>;
  deletePodcast(id: number): Promise<boolean>;

  getAllPodcastEpisodes(): Promise<PodcastEpisode[]>;
  getPodcastEpisodesByPodcastId(podcastId: number): Promise<PodcastEpisode[]>;
  getPodcastEpisode(id: number): Promise<PodcastEpisode | undefined>;
  createPodcastEpisode(ep: InsertPodcastEpisode): Promise<PodcastEpisode>;
  updatePodcastEpisode(id: number, data: Partial<InsertPodcastEpisode>): Promise<PodcastEpisode | undefined>;
  deletePodcastEpisode(id: number): Promise<boolean>;

  getLinksForHole(holeId: number): Promise<RabbitHolePodcastEpisode[]>;
  createLink(link: InsertRabbitHolePodcastEpisode): Promise<RabbitHolePodcastEpisode>;
  updateLink(id: number, data: Partial<InsertRabbitHolePodcastEpisode>): Promise<RabbitHolePodcastEpisode | undefined>;
  deleteLink(id: number): Promise<boolean>;

  getSponsoredSlotsForHole(holeId: number): Promise<SponsoredPodcastSlot[]>;
  getAllSponsoredSlots(): Promise<SponsoredPodcastSlot[]>;
  getSponsoredSlot(id: number): Promise<SponsoredPodcastSlot | undefined>;
  createSponsoredSlot(slot: InsertSponsoredPodcastSlot): Promise<SponsoredPodcastSlot>;
  updateSponsoredSlot(id: number, data: Partial<InsertSponsoredPodcastSlot>): Promise<SponsoredPodcastSlot | undefined>;
  deleteSponsoredSlot(id: number): Promise<boolean>;

  getPublishChecklist(holeId: number): Promise<{ passed: boolean; checks: { check: string; passed: boolean; message: string }[] }>;

  getPublishedEpisodesForHole(holeId: number): Promise<(PodcastEpisode & { pinned: boolean; sortOrder: number; podcastTitle: string })[]>;
  getActiveSponsoredSlotForHole(holeId: number): Promise<(SponsoredPodcastSlot & { episodeTitle?: string }) | null>;
}

export class DatabaseStorage implements IStorage {
  async getAllHoles(): Promise<RabbitHole[]> {
    return db.select().from(rabbitHoles).orderBy(desc(rabbitHoles.updatedAt));
  }

  async getPublishedHoles(): Promise<RabbitHole[]> {
    return db.select().from(rabbitHoles).where(eq(rabbitHoles.status, "Published")).orderBy(desc(rabbitHoles.updatedAt));
  }

  async getSpecialistHoles(): Promise<RabbitHole[]> {
    return db.select().from(rabbitHoles).where(eq(rabbitHoles.isSpecialist, true)).orderBy(desc(rabbitHoles.updatedAt));
  }

  async getPublishedSpecialistHoles(): Promise<RabbitHole[]> {
    return db.select().from(rabbitHoles).where(and(eq(rabbitHoles.isSpecialist, true), eq(rabbitHoles.status, "Published"))).orderBy(desc(rabbitHoles.updatedAt));
  }

  async getCommunityHoles(): Promise<RabbitHole[]> {
    return db.select().from(rabbitHoles).where(eq(rabbitHoles.isSpecialist, false)).orderBy(desc(rabbitHoles.updatedAt));
  }

  async getPublishedCommunityHoles(): Promise<RabbitHole[]> {
    return db.select().from(rabbitHoles).where(and(eq(rabbitHoles.isSpecialist, false), eq(rabbitHoles.status, "Published"))).orderBy(desc(rabbitHoles.updatedAt));
  }

  async getHoleBySlug(slug: string): Promise<RabbitHole | undefined> {
    const [hole] = await db.select().from(rabbitHoles).where(eq(rabbitHoles.slug, slug));
    return hole;
  }

  async getHolesByCategory(categorySlug: string): Promise<RabbitHole[]> {
    return db.select().from(rabbitHoles).where(eq(rabbitHoles.categorySlug, categorySlug)).orderBy(desc(rabbitHoles.updatedAt));
  }

  async getPublishedHolesByCategory(categorySlug: string): Promise<RabbitHole[]> {
    return db.select().from(rabbitHoles).where(and(eq(rabbitHoles.categorySlug, categorySlug), eq(rabbitHoles.status, "Published"))).orderBy(desc(rabbitHoles.updatedAt));
  }

  async getHoleById(id: number): Promise<RabbitHole | undefined> {
    const [hole] = await db.select().from(rabbitHoles).where(eq(rabbitHoles.id, id));
    return hole;
  }

  async createHole(hole: InsertRabbitHole): Promise<RabbitHole> {
    const [created] = await db.insert(rabbitHoles).values({ ...hole, status: hole.status || "Draft" }).returning();
    return created;
  }

  async updateHole(id: number, data: Partial<InsertRabbitHole>): Promise<RabbitHole | undefined> {
    const [updated] = await db.update(rabbitHoles).set({ ...data, updatedAt: new Date() }).where(eq(rabbitHoles.id, id)).returning();
    return updated;
  }

  async deleteHole(id: number): Promise<boolean> {
    await db.delete(sponsoredPodcastSlots).where(eq(sponsoredPodcastSlots.rabbitHoleId, id));
    await db.delete(rabbitHolePodcastEpisodes).where(eq(rabbitHolePodcastEpisodes.rabbitHoleId, id));
    await db.delete(depthNodes).where(eq(depthNodes.holeId, id));
    await db.delete(claims).where(eq(claims.holeId, id));
    await db.delete(sources).where(eq(sources.holeId, id));
    await db.delete(media).where(eq(media.holeId, id));
    await db.delete(comments).where(eq(comments.holeId, id));
    await db.delete(auditLogs).where(eq(auditLogs.holeId, id));
    const result = await db.delete(rabbitHoles).where(eq(rabbitHoles.id, id)).returning();
    return result.length > 0;
  }

  async getCommentsByHoleId(holeId: number): Promise<Comment[]> {
    return db.select().from(comments).where(eq(comments.holeId, holeId)).orderBy(desc(comments.upvotes));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [created] = await db.insert(comments).values(comment).returning();
    return created;
  }

  async upvoteComment(id: number): Promise<Comment | undefined> {
    const [existing] = await db.select().from(comments).where(eq(comments.id, id));
    if (!existing) return undefined;
    const [updated] = await db.update(comments).set({ upvotes: existing.upvotes + 1 }).where(eq(comments.id, id)).returning();
    return updated;
  }

  async downvoteComment(id: number): Promise<Comment | undefined> {
    const [existing] = await db.select().from(comments).where(eq(comments.id, id));
    if (!existing) return undefined;
    const [updated] = await db.update(comments).set({ upvotes: existing.upvotes - 1 }).where(eq(comments.id, id)).returning();
    return updated;
  }

  async getDepthNodesByHoleId(holeId: number): Promise<DepthNode[]> {
    return db.select().from(depthNodes).where(eq(depthNodes.holeId, holeId)).orderBy(asc(depthNodes.position));
  }

  async getDepthNode(id: number): Promise<DepthNode | undefined> {
    const [node] = await db.select().from(depthNodes).where(eq(depthNodes.id, id));
    return node;
  }

  async createDepthNode(node: InsertDepthNode): Promise<DepthNode> {
    const [created] = await db.insert(depthNodes).values(node).returning();
    return created;
  }

  async updateDepthNode(id: number, data: Partial<InsertDepthNode>): Promise<DepthNode | undefined> {
    const [updated] = await db.update(depthNodes).set(data).where(eq(depthNodes.id, id)).returning();
    return updated;
  }

  async deleteDepthNode(id: number): Promise<boolean> {
    const result = await db.delete(depthNodes).where(eq(depthNodes.id, id)).returning();
    return result.length > 0;
  }

  async getClaimsByHoleId(holeId: number): Promise<Claim[]> {
    return db.select().from(claims).where(eq(claims.holeId, holeId)).orderBy(desc(claims.confidence));
  }

  async getClaim(id: number): Promise<Claim | undefined> {
    const [claim] = await db.select().from(claims).where(eq(claims.id, id));
    return claim;
  }

  async createClaim(claim: InsertClaim): Promise<Claim> {
    const [created] = await db.insert(claims).values(claim).returning();
    return created;
  }

  async updateClaim(id: number, data: Partial<InsertClaim>): Promise<Claim | undefined> {
    const [updated] = await db.update(claims).set(data).where(eq(claims.id, id)).returning();
    return updated;
  }

  async deleteClaim(id: number): Promise<boolean> {
    const result = await db.delete(claims).where(eq(claims.id, id)).returning();
    return result.length > 0;
  }

  async getSourcesByHoleId(holeId: number): Promise<Source[]> {
    return db.select().from(sources).where(eq(sources.holeId, holeId)).orderBy(desc(sources.credibility));
  }

  async getSource(id: number): Promise<Source | undefined> {
    const [source] = await db.select().from(sources).where(eq(sources.id, id));
    return source;
  }

  async getAllSources(): Promise<Source[]> {
    return db.select().from(sources).orderBy(desc(sources.credibility));
  }

  async createSource(source: InsertSource): Promise<Source> {
    const [created] = await db.insert(sources).values(source).returning();
    return created;
  }

  async updateSource(id: number, data: Partial<InsertSource>): Promise<Source | undefined> {
    const [updated] = await db.update(sources).set(data).where(eq(sources.id, id)).returning();
    return updated;
  }

  async deleteSource(id: number): Promise<boolean> {
    const result = await db.delete(sources).where(eq(sources.id, id)).returning();
    return result.length > 0;
  }

  async searchSources(query: string): Promise<Source[]> {
    const pattern = `%${query}%`;
    return db.select().from(sources).where(
      or(ilike(sources.title, pattern), ilike(sources.summary, pattern), ilike(sources.author, pattern))
    ).orderBy(desc(sources.credibility));
  }

  async getMediaByHoleId(holeId: number): Promise<Media[]> {
    return db.select().from(media).where(eq(media.holeId, holeId));
  }

  async getMedia(id: number): Promise<Media | undefined> {
    const [m] = await db.select().from(media).where(eq(media.id, id));
    return m;
  }

  async createMedia(m: InsertMedia): Promise<Media> {
    const [created] = await db.insert(media).values(m).returning();
    return created;
  }

  async updateMedia(id: number, data: Partial<InsertMedia>): Promise<Media | undefined> {
    const [updated] = await db.update(media).set(data).where(eq(media.id, id)).returning();
    return updated;
  }

  async deleteMedia(id: number): Promise<boolean> {
    const result = await db.delete(media).where(eq(media.id, id)).returning();
    return result.length > 0;
  }

  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(asc(categories.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async search(query: string): Promise<{ holes: RabbitHole[]; sources: Source[]; claims: Claim[] }> {
    const pattern = `%${query}%`;
    const [matchedHoles, matchedSources, matchedClaims] = await Promise.all([
      db.select().from(rabbitHoles).where(
        and(
          eq(rabbitHoles.status, "Published"),
          or(ilike(rabbitHoles.title, pattern), ilike(rabbitHoles.summary, pattern))
        )
      ).orderBy(desc(rabbitHoles.updatedAt)).limit(20),
      db.select().from(sources).where(
        or(ilike(sources.title, pattern), ilike(sources.summary, pattern), ilike(sources.author, pattern))
      ).orderBy(desc(sources.credibility)).limit(20),
      db.select().from(claims).where(
        ilike(claims.statement, pattern)
      ).orderBy(desc(claims.confidence)).limit(20),
    ]);
    return { holes: matchedHoles, sources: matchedSources, claims: matchedClaims };
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  async getAuditLogsByHoleId(holeId: number): Promise<AuditLog[]> {
    return db.select().from(auditLogs).where(eq(auditLogs.holeId, holeId)).orderBy(desc(auditLogs.createdAt)).limit(50);
  }

  async getAllAuditLogs(): Promise<AuditLog[]> {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200);
  }

  async exportAll() {
    const [allHoles, allNodes, allClaims, allSources, allMedia, allComments, allCategories] = await Promise.all([
      db.select().from(rabbitHoles),
      db.select().from(depthNodes),
      db.select().from(claims),
      db.select().from(sources),
      db.select().from(media),
      db.select().from(comments),
      db.select().from(categories),
    ]);
    return {
      rabbitHoles: allHoles,
      depthNodes: allNodes,
      claims: allClaims,
      sources: allSources,
      media: allMedia,
      comments: allComments,
      categories: allCategories,
    };
  }

  async importAll(data: {
    rabbitHoles?: any[];
    depthNodes?: any[];
    claims?: any[];
    sources?: any[];
    media?: any[];
    comments?: any[];
    categories?: any[];
  }): Promise<{ imported: Record<string, number> }> {
    const result: Record<string, number> = {};

    await db.delete(auditLogs);
    await db.delete(comments);
    await db.delete(media);
    await db.delete(claims);
    await db.delete(depthNodes);
    await db.delete(sources);
    await db.delete(rabbitHoles);
    await db.delete(categories);

    if (data.categories?.length) {
      await db.insert(categories).values(data.categories);
      result.categories = data.categories.length;
    }
    if (data.rabbitHoles?.length) {
      await db.insert(rabbitHoles).values(data.rabbitHoles);
      result.rabbitHoles = data.rabbitHoles.length;
    }
    if (data.depthNodes?.length) {
      await db.insert(depthNodes).values(data.depthNodes);
      result.depthNodes = data.depthNodes.length;
    }
    if (data.sources?.length) {
      await db.insert(sources).values(data.sources);
      result.sources = data.sources.length;
    }
    if (data.claims?.length) {
      await db.insert(claims).values(data.claims);
      result.claims = data.claims.length;
    }
    if (data.media?.length) {
      await db.insert(media).values(data.media);
      result.media = data.media.length;
    }
    if (data.comments?.length) {
      await db.insert(comments).values(data.comments);
      result.comments = data.comments.length;
    }

    return { imported: result };
  }

  async validateIntegrity(): Promise<{
    issues: { holeId: number; holeTitle: string; type: string; message: string }[];
  }> {
    const issues: { holeId: number; holeTitle: string; type: string; message: string }[] = [];
    const allHoles = await db.select().from(rabbitHoles);
    const allSources = await db.select().from(sources);
    const allClaims = await db.select().from(claims);
    const allNodes = await db.select().from(depthNodes);
    const allMedia = await db.select().from(media);
    const sourceIds = new Set(allSources.map(s => s.id));
    const nodeIds = new Set(allNodes.map(n => n.id));
    const mediaIds = new Set(allMedia.map(m => m.id));

    for (const claim of allClaims) {
      const hole = allHoles.find(h => h.id === claim.holeId);
      const holeTitle = hole?.title || `Unknown (ID: ${claim.holeId})`;

      if (claim.nodeId && !nodeIds.has(claim.nodeId)) {
        issues.push({ holeId: claim.holeId, holeTitle, type: "broken_node_ref", message: `Claim #${claim.id} "${claim.statement.slice(0, 40)}..." references missing depth node #${claim.nodeId}` });
      }

      const evidence = (claim.evidence as { sourceId: number; excerpt: string }[]) || [];
      for (const ev of evidence) {
        if (ev.sourceId && !sourceIds.has(ev.sourceId)) {
          issues.push({ holeId: claim.holeId, holeTitle, type: "broken_source_ref", message: `Claim #${claim.id} evidence references missing source #${ev.sourceId}` });
        }
      }

      const counterpoints = (claim.counterpoints as { sourceId: number; excerpt: string }[]) || [];
      for (const cp of counterpoints) {
        if (cp.sourceId && !sourceIds.has(cp.sourceId)) {
          issues.push({ holeId: claim.holeId, holeTitle, type: "broken_source_ref", message: `Claim #${claim.id} counterpoint references missing source #${cp.sourceId}` });
        }
      }
    }

    const holeSlugs = new Set(allHoles.map(h => h.slug));
    for (const hole of allHoles) {
      const connected = (hole.connectedSlugs as string[]) || [];
      for (const cs of connected) {
        if (!holeSlugs.has(cs)) {
          issues.push({ holeId: hole.id, holeTitle: hole.title, type: "broken_connection", message: `Connected slug "${cs}" does not exist` });
        }
      }

      const holeNodes = allNodes.filter(n => n.holeId === hole.id);
      if (hole.status === "Published" && holeNodes.length === 0) {
        issues.push({ holeId: hole.id, holeTitle: hole.title, type: "no_depth_nodes", message: `Published investigation has no depth nodes` });
      }
    }

    return { issues };
  }

  async getPublishChecklist(holeId: number): Promise<{ passed: boolean; checks: { check: string; passed: boolean; message: string }[] }> {
    const checks: { check: string; passed: boolean; message: string }[] = [];
    const hole = await this.getHoleById(holeId);
    if (!hole) return { passed: false, checks: [{ check: "exists", passed: false, message: "Rabbit hole not found" }] };

    checks.push({ check: "title", passed: !!hole.title?.trim(), message: hole.title?.trim() ? "Title exists" : "Title is required" });
    checks.push({ check: "summary", passed: !!hole.summary?.trim(), message: hole.summary?.trim() ? "Summary exists" : "Summary is required" });
    checks.push({ check: "slug", passed: !!hole.slug?.trim(), message: hole.slug?.trim() ? "Slug exists" : "Slug is required" });
    checks.push({ check: "category", passed: !!hole.categorySlug?.trim(), message: hole.categorySlug?.trim() ? "Category set" : "Category is required" });

    const nodes = await this.getDepthNodesByHoleId(holeId);
    checks.push({ check: "min_nodes", passed: nodes.length >= 5, message: nodes.length >= 5 ? `${nodes.length} depth nodes` : `Need at least 5 depth nodes (currently ${nodes.length})` });

    const holeClaims = await this.getClaimsByHoleId(holeId);
    const holeSources = await this.getSourcesByHoleId(holeId);
    const sourceIdSet = new Set(holeSources.map(s => s.id));
    const allSources = await this.getAllSources();
    const globalSourceIds = new Set(allSources.map(s => s.id));
    const nodeIdSet = new Set(nodes.map(n => n.id));
    let claimsOk = true;
    let claimMsg = "All claims have evidence";
    for (const claim of holeClaims) {
      const ev = (claim.evidence as { sourceId: number; excerpt: string }[]) || [];
      if (ev.length === 0) { claimsOk = false; claimMsg = `Claim #${claim.id} has no evidence sources`; break; }
      for (const e of ev) {
        if (e.sourceId && !globalSourceIds.has(e.sourceId)) { claimsOk = false; claimMsg = `Claim #${claim.id} references missing source #${e.sourceId}`; break; }
      }
      if (!claimsOk) break;
      if (claim.nodeId && !nodeIdSet.has(claim.nodeId)) { claimsOk = false; claimMsg = `Claim #${claim.id} references missing node #${claim.nodeId}`; break; }
    }
    checks.push({ check: "claims_evidence", passed: claimsOk, message: claimMsg });

    const holeSlugs = await db.select({ slug: rabbitHoles.slug }).from(rabbitHoles);
    const slugSet = new Set(holeSlugs.map(s => s.slug));
    const connected = (hole.connectedSlugs as string[]) || [];
    let connectionsOk = true;
    let connMsg = "All connections valid";
    for (const cs of connected) {
      if (!slugSet.has(cs)) { connectionsOk = false; connMsg = `Connected slug "${cs}" does not exist`; break; }
    }
    checks.push({ check: "connections", passed: connectionsOk, message: connMsg });

    return { passed: checks.every(c => c.passed), checks };
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return updated;
  }

  async createEmployee(emp: InsertEmployee): Promise<Employee> {
    const [created] = await db.insert(employees).values(emp).returning();
    return created;
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    const [emp] = await db.select().from(employees).where(eq(employees.email, email.toLowerCase()));
    return emp;
  }

  async getEmployeeById(id: string): Promise<Employee | undefined> {
    const [emp] = await db.select().from(employees).where(eq(employees.id, id));
    return emp;
  }

  async getAllEmployees(): Promise<Employee[]> {
    return db.select().from(employees).orderBy(desc(employees.createdAt));
  }

  async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee | undefined> {
    const [updated] = await db.update(employees).set({ ...data, updatedAt: new Date() }).where(eq(employees.id, id)).returning();
    return updated;
  }

  async getEmployeeCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(employees);
    return Number(result[0].count);
  }

  async getAllPodcasts(): Promise<Podcast[]> {
    return db.select().from(podcasts).orderBy(desc(podcasts.updatedAt));
  }

  async getPodcast(id: number): Promise<Podcast | undefined> {
    const [p] = await db.select().from(podcasts).where(eq(podcasts.id, id));
    return p;
  }

  async createPodcast(p: InsertPodcast): Promise<Podcast> {
    const [created] = await db.insert(podcasts).values(p).returning();
    return created;
  }

  async updatePodcast(id: number, data: Partial<InsertPodcast>): Promise<Podcast | undefined> {
    const [updated] = await db.update(podcasts).set({ ...data, updatedAt: new Date() }).where(eq(podcasts.id, id)).returning();
    return updated;
  }

  async deletePodcast(id: number): Promise<boolean> {
    const eps = await db.select({ id: podcastEpisodes.id }).from(podcastEpisodes).where(eq(podcastEpisodes.podcastId, id));
    for (const ep of eps) {
      await db.delete(rabbitHolePodcastEpisodes).where(eq(rabbitHolePodcastEpisodes.episodeId, ep.id));
      await db.delete(sponsoredPodcastSlots).where(eq(sponsoredPodcastSlots.episodeId, ep.id));
    }
    await db.delete(podcastEpisodes).where(eq(podcastEpisodes.podcastId, id));
    const result = await db.delete(podcasts).where(eq(podcasts.id, id)).returning();
    return result.length > 0;
  }

  async getAllPodcastEpisodes(): Promise<PodcastEpisode[]> {
    return db.select().from(podcastEpisodes).orderBy(desc(podcastEpisodes.updatedAt));
  }

  async getPodcastEpisodesByPodcastId(podcastId: number): Promise<PodcastEpisode[]> {
    return db.select().from(podcastEpisodes).where(eq(podcastEpisodes.podcastId, podcastId)).orderBy(desc(podcastEpisodes.updatedAt));
  }

  async getPodcastEpisode(id: number): Promise<PodcastEpisode | undefined> {
    const [ep] = await db.select().from(podcastEpisodes).where(eq(podcastEpisodes.id, id));
    return ep;
  }

  async createPodcastEpisode(ep: InsertPodcastEpisode): Promise<PodcastEpisode> {
    const [created] = await db.insert(podcastEpisodes).values({ ...ep, status: ep.status || "Draft" }).returning();
    return created;
  }

  async updatePodcastEpisode(id: number, data: Partial<InsertPodcastEpisode>): Promise<PodcastEpisode | undefined> {
    const [updated] = await db.update(podcastEpisodes).set({ ...data, updatedAt: new Date() }).where(eq(podcastEpisodes.id, id)).returning();
    return updated;
  }

  async deletePodcastEpisode(id: number): Promise<boolean> {
    await db.delete(rabbitHolePodcastEpisodes).where(eq(rabbitHolePodcastEpisodes.episodeId, id));
    await db.delete(sponsoredPodcastSlots).where(eq(sponsoredPodcastSlots.episodeId, id));
    const result = await db.delete(podcastEpisodes).where(eq(podcastEpisodes.id, id)).returning();
    return result.length > 0;
  }

  async getLinksForHole(holeId: number): Promise<RabbitHolePodcastEpisode[]> {
    return db.select().from(rabbitHolePodcastEpisodes).where(eq(rabbitHolePodcastEpisodes.rabbitHoleId, holeId)).orderBy(asc(rabbitHolePodcastEpisodes.sortOrder));
  }

  async createLink(link: InsertRabbitHolePodcastEpisode): Promise<RabbitHolePodcastEpisode> {
    const [created] = await db.insert(rabbitHolePodcastEpisodes).values(link).returning();
    return created;
  }

  async updateLink(id: number, data: Partial<InsertRabbitHolePodcastEpisode>): Promise<RabbitHolePodcastEpisode | undefined> {
    const [updated] = await db.update(rabbitHolePodcastEpisodes).set(data).where(eq(rabbitHolePodcastEpisodes.id, id)).returning();
    return updated;
  }

  async deleteLink(id: number): Promise<boolean> {
    const result = await db.delete(rabbitHolePodcastEpisodes).where(eq(rabbitHolePodcastEpisodes.id, id)).returning();
    return result.length > 0;
  }

  async getSponsoredSlotsForHole(holeId: number): Promise<SponsoredPodcastSlot[]> {
    return db.select().from(sponsoredPodcastSlots).where(eq(sponsoredPodcastSlots.rabbitHoleId, holeId)).orderBy(desc(sponsoredPodcastSlots.createdAt));
  }

  async getAllSponsoredSlots(): Promise<SponsoredPodcastSlot[]> {
    return db.select().from(sponsoredPodcastSlots).orderBy(desc(sponsoredPodcastSlots.createdAt));
  }

  async getSponsoredSlot(id: number): Promise<SponsoredPodcastSlot | undefined> {
    const [slot] = await db.select().from(sponsoredPodcastSlots).where(eq(sponsoredPodcastSlots.id, id));
    return slot;
  }

  async createSponsoredSlot(slot: InsertSponsoredPodcastSlot): Promise<SponsoredPodcastSlot> {
    const [created] = await db.insert(sponsoredPodcastSlots).values(slot).returning();
    return created;
  }

  async updateSponsoredSlot(id: number, data: Partial<InsertSponsoredPodcastSlot>): Promise<SponsoredPodcastSlot | undefined> {
    const [updated] = await db.update(sponsoredPodcastSlots).set({ ...data, updatedAt: new Date() }).where(eq(sponsoredPodcastSlots.id, id)).returning();
    return updated;
  }

  async deleteSponsoredSlot(id: number): Promise<boolean> {
    const result = await db.delete(sponsoredPodcastSlots).where(eq(sponsoredPodcastSlots.id, id)).returning();
    return result.length > 0;
  }

  async getPublishedEpisodesForHole(holeId: number): Promise<(PodcastEpisode & { pinned: boolean; sortOrder: number; podcastTitle: string })[]> {
    const links = await db.select().from(rabbitHolePodcastEpisodes).where(eq(rabbitHolePodcastEpisodes.rabbitHoleId, holeId)).orderBy(asc(rabbitHolePodcastEpisodes.sortOrder));
    const results: (PodcastEpisode & { pinned: boolean; sortOrder: number; podcastTitle: string })[] = [];
    for (const link of links) {
      const [ep] = await db.select().from(podcastEpisodes).where(and(eq(podcastEpisodes.id, link.episodeId), eq(podcastEpisodes.status, "Published")));
      if (ep) {
        const [pod] = await db.select().from(podcasts).where(eq(podcasts.id, ep.podcastId));
        results.push({ ...ep, pinned: link.pinned, sortOrder: link.sortOrder, podcastTitle: pod?.title || "" });
      }
    }
    results.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return a.sortOrder - b.sortOrder;
    });
    return results;
  }

  async getActiveSponsoredSlotForHole(holeId: number): Promise<(SponsoredPodcastSlot & { episodeTitle?: string }) | null> {
    const slots = await db.select().from(sponsoredPodcastSlots).where(and(eq(sponsoredPodcastSlots.rabbitHoleId, holeId), eq(sponsoredPodcastSlots.active, true))).orderBy(desc(sponsoredPodcastSlots.createdAt));
    const now = new Date().toISOString().split("T")[0];
    for (const slot of slots) {
      const start = slot.startDate || "";
      const end = slot.endDate || "";
      if (start && now < start) continue;
      if (end && now > end) continue;
      let episodeTitle: string | undefined;
      if (slot.episodeId) {
        const [ep] = await db.select().from(podcastEpisodes).where(eq(podcastEpisodes.id, slot.episodeId));
        episodeTitle = ep?.title;
      }
      return { ...slot, episodeTitle };
    }
    return null;
  }
  // ---- Creators ----
  async getAllCreators(): Promise<Creator[]> {
    return db.select().from(creators).orderBy(desc(creators.createdAt));
  }
  async getCreatorById(id: number): Promise<Creator | undefined> {
    const [c] = await db.select().from(creators).where(eq(creators.id, id));
    return c;
  }
  async getCreatorByHandle(handle: string): Promise<Creator | undefined> {
    const [c] = await db.select().from(creators).where(eq(creators.handle, handle));
    return c;
  }
  async getCreatorByEmployeeId(employeeId: string): Promise<Creator | undefined> {
    const [c] = await db.select().from(creators).where(eq(creators.employeeId, employeeId));
    return c;
  }
  async createCreator(data: InsertCreator): Promise<Creator> {
    const [c] = await db.insert(creators).values(data).returning();
    return c;
  }
  async updateCreator(id: number, data: Partial<InsertCreator>): Promise<Creator | undefined> {
    const [c] = await db.update(creators).set({ ...data, updatedAt: new Date() }).where(eq(creators.id, id)).returning();
    return c;
  }
  async deleteCreator(id: number): Promise<void> {
    await db.delete(creators).where(eq(creators.id, id));
  }

  // ---- Streams ----
  async getAllStreams(): Promise<Stream[]> {
    return db.select().from(streams).orderBy(desc(streams.createdAt));
  }
  async getStreamById(id: number): Promise<Stream | undefined> {
    const [s] = await db.select().from(streams).where(eq(streams.id, id));
    return s;
  }
  async getStreamsByCreator(creatorId: number): Promise<Stream[]> {
    return db.select().from(streams).where(eq(streams.creatorId, creatorId)).orderBy(desc(streams.createdAt));
  }
  async getPublishedStreams(): Promise<Stream[]> {
    return db.select().from(streams).where(eq(streams.status, "Published")).orderBy(desc(streams.createdAt));
  }
  async getLiveStreams(): Promise<Stream[]> {
    return db.select().from(streams).where(and(eq(streams.status, "Published"), eq(streams.streamState, "live"))).orderBy(desc(streams.startedAt));
  }
  async getUpcomingStreams(): Promise<Stream[]> {
    return db.select().from(streams).where(and(eq(streams.status, "Published"), eq(streams.streamState, "upcoming"))).orderBy(asc(streams.scheduledStart));
  }
  async getEndedStreams(): Promise<Stream[]> {
    return db.select().from(streams).where(and(eq(streams.status, "Published"), eq(streams.streamState, "ended"))).orderBy(desc(streams.endedAt));
  }
  async createStream(data: InsertStream): Promise<Stream> {
    const [s] = await db.insert(streams).values(data).returning();
    return s;
  }
  async updateStream(id: number, data: Partial<InsertStream>): Promise<Stream | undefined> {
    const [s] = await db.update(streams).set({ ...data, updatedAt: new Date() }).where(eq(streams.id, id)).returning();
    return s;
  }
  async deleteStream(id: number): Promise<void> {
    await db.delete(liveChatMessages).where(eq(liveChatMessages.streamId, id));
    await db.delete(chatModerationActions).where(eq(chatModerationActions.streamId, id));
    await db.delete(streamReplays).where(eq(streamReplays.streamId, id));
    await db.delete(streams).where(eq(streams.id, id));
  }

  // ---- Stream Replays ----
  async getReplaysByStream(streamId: number): Promise<StreamReplay[]> {
    return db.select().from(streamReplays).where(eq(streamReplays.streamId, streamId));
  }
  async createReplay(data: InsertStreamReplay): Promise<StreamReplay> {
    const [r] = await db.insert(streamReplays).values(data).returning();
    return r;
  }
  async updateReplay(id: number, data: Partial<InsertStreamReplay>): Promise<StreamReplay | undefined> {
    const [r] = await db.update(streamReplays).set(data).where(eq(streamReplays.id, id)).returning();
    return r;
  }
  async deleteReplay(id: number): Promise<void> {
    await db.delete(streamReplays).where(eq(streamReplays.id, id));
  }

  // ---- Live Chat Messages ----
  async getChatMessages(streamId: number, limit = 100): Promise<LiveChatMessage[]> {
    return db.select().from(liveChatMessages).where(and(eq(liveChatMessages.streamId, streamId), eq(liveChatMessages.isDeleted, false))).orderBy(desc(liveChatMessages.createdAt)).limit(limit);
  }
  async getAllChatMessages(streamId: number, limit = 200): Promise<LiveChatMessage[]> {
    return db.select().from(liveChatMessages).where(eq(liveChatMessages.streamId, streamId)).orderBy(desc(liveChatMessages.createdAt)).limit(limit);
  }
  async createChatMessage(data: InsertLiveChatMessage): Promise<LiveChatMessage> {
    const [m] = await db.insert(liveChatMessages).values(data).returning();
    return m;
  }
  async deleteChatMessage(id: number, employeeId: string): Promise<void> {
    await db.update(liveChatMessages).set({ isDeleted: true, deletedByEmployeeId: employeeId }).where(eq(liveChatMessages.id, id));
  }

  // ---- Chat Moderation ----
  async getModerationActions(streamId: number): Promise<ChatModerationAction[]> {
    return db.select().from(chatModerationActions).where(eq(chatModerationActions.streamId, streamId)).orderBy(desc(chatModerationActions.createdAt));
  }
  async createModerationAction(data: InsertChatModerationAction): Promise<ChatModerationAction> {
    const [a] = await db.insert(chatModerationActions).values(data).returning();
    return a;
  }
}

export const storage = new DatabaseStorage();
