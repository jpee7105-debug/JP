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
    const sourceIds = new Set(allSources.map(s => s.id));
    const nodeIds = new Set(allNodes.map(n => n.id));

    for (const claim of allClaims) {
      const hole = allHoles.find(h => h.id === claim.holeId);
      const holeTitle = hole?.title || `Unknown (ID: ${claim.holeId})`;

      if (claim.nodeId && !nodeIds.has(claim.nodeId)) {
        issues.push({
          holeId: claim.holeId,
          holeTitle,
          type: "broken_node_ref",
          message: `Claim #${claim.id} "${claim.statement.slice(0, 40)}..." references missing depth node #${claim.nodeId}`,
        });
      }

      const evidence = (claim.evidence as { sourceId: number; excerpt: string }[]) || [];
      for (const ev of evidence) {
        if (ev.sourceId && !sourceIds.has(ev.sourceId)) {
          issues.push({
            holeId: claim.holeId,
            holeTitle,
            type: "broken_source_ref",
            message: `Claim #${claim.id} evidence references missing source #${ev.sourceId}`,
          });
        }
      }

      const counterpoints = (claim.counterpoints as { sourceId: number; excerpt: string }[]) || [];
      for (const cp of counterpoints) {
        if (cp.sourceId && !sourceIds.has(cp.sourceId)) {
          issues.push({
            holeId: claim.holeId,
            holeTitle,
            type: "broken_source_ref",
            message: `Claim #${claim.id} counterpoint references missing source #${cp.sourceId}`,
          });
        }
      }
    }

    const holeSlugs = new Set(allHoles.map(h => h.slug));
    for (const hole of allHoles) {
      const connected = (hole.connectedSlugs as string[]) || [];
      for (const cs of connected) {
        if (!holeSlugs.has(cs)) {
          issues.push({
            holeId: hole.id,
            holeTitle: hole.title,
            type: "broken_connection",
            message: `Connected slug "${cs}" does not exist`,
          });
        }
      }

      const holeNodes = allNodes.filter(n => n.holeId === hole.id);
      if (hole.status === "Published" && holeNodes.length === 0) {
        issues.push({
          holeId: hole.id,
          holeTitle: hole.title,
          type: "no_depth_nodes",
          message: `Published investigation has no depth nodes`,
        });
      }
    }

    return { issues };
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
}

export const storage = new DatabaseStorage();
