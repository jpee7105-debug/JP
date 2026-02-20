import { eq, desc, ilike, or, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  rabbitHoles,
  comments,
  depthNodes,
  claims,
  sources,
  categories,
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
} from "@shared/schema";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  getAllHoles(): Promise<RabbitHole[]>;
  getSpecialistHoles(): Promise<RabbitHole[]>;
  getCommunityHoles(): Promise<RabbitHole[]>;
  getHoleBySlug(slug: string): Promise<RabbitHole | undefined>;
  getHolesByCategory(categorySlug: string): Promise<RabbitHole[]>;
  createHole(hole: InsertRabbitHole): Promise<RabbitHole>;

  getCommentsByHoleId(holeId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  upvoteComment(id: number): Promise<Comment | undefined>;
  downvoteComment(id: number): Promise<Comment | undefined>;

  getDepthNodesByHoleId(holeId: number): Promise<DepthNode[]>;
  getDepthNode(id: number): Promise<DepthNode | undefined>;
  createDepthNode(node: InsertDepthNode): Promise<DepthNode>;

  getClaimsByHoleId(holeId: number): Promise<Claim[]>;
  createClaim(claim: InsertClaim): Promise<Claim>;

  getSourcesByHoleId(holeId: number): Promise<Source[]>;
  getSource(id: number): Promise<Source | undefined>;
  createSource(source: InsertSource): Promise<Source>;
  searchSources(query: string): Promise<Source[]>;

  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  search(query: string): Promise<{ holes: RabbitHole[]; sources: Source[]; claims: Claim[] }>;
}

export class DatabaseStorage implements IStorage {
  async getAllHoles(): Promise<RabbitHole[]> {
    return db.select().from(rabbitHoles).orderBy(desc(rabbitHoles.updatedAt));
  }

  async getSpecialistHoles(): Promise<RabbitHole[]> {
    return db.select().from(rabbitHoles).where(eq(rabbitHoles.isSpecialist, true)).orderBy(desc(rabbitHoles.updatedAt));
  }

  async getCommunityHoles(): Promise<RabbitHole[]> {
    return db.select().from(rabbitHoles).where(eq(rabbitHoles.isSpecialist, false)).orderBy(desc(rabbitHoles.updatedAt));
  }

  async getHoleBySlug(slug: string): Promise<RabbitHole | undefined> {
    const [hole] = await db.select().from(rabbitHoles).where(eq(rabbitHoles.slug, slug));
    return hole;
  }

  async getHolesByCategory(categorySlug: string): Promise<RabbitHole[]> {
    return db.select().from(rabbitHoles).where(eq(rabbitHoles.categorySlug, categorySlug)).orderBy(desc(rabbitHoles.updatedAt));
  }

  async createHole(hole: InsertRabbitHole): Promise<RabbitHole> {
    const [created] = await db.insert(rabbitHoles).values(hole).returning();
    return created;
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

  async getClaimsByHoleId(holeId: number): Promise<Claim[]> {
    return db.select().from(claims).where(eq(claims.holeId, holeId)).orderBy(desc(claims.confidence));
  }

  async createClaim(claim: InsertClaim): Promise<Claim> {
    const [created] = await db.insert(claims).values(claim).returning();
    return created;
  }

  async getSourcesByHoleId(holeId: number): Promise<Source[]> {
    return db.select().from(sources).where(eq(sources.holeId, holeId)).orderBy(desc(sources.credibility));
  }

  async getSource(id: number): Promise<Source | undefined> {
    const [source] = await db.select().from(sources).where(eq(sources.id, id));
    return source;
  }

  async createSource(source: InsertSource): Promise<Source> {
    const [created] = await db.insert(sources).values(source).returning();
    return created;
  }

  async searchSources(query: string): Promise<Source[]> {
    const pattern = `%${query}%`;
    return db.select().from(sources).where(
      or(ilike(sources.title, pattern), ilike(sources.summary, pattern), ilike(sources.author, pattern))
    ).orderBy(desc(sources.credibility));
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
        or(ilike(rabbitHoles.title, pattern), ilike(rabbitHoles.summary, pattern))
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
}

export const storage = new DatabaseStorage();
