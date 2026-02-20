import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  rabbitHoles,
  comments,
  type RabbitHole,
  type InsertRabbitHole,
  type Comment,
  type InsertComment,
} from "@shared/schema";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  getAllHoles(): Promise<RabbitHole[]>;
  getSpecialistHoles(): Promise<RabbitHole[]>;
  getCommunityHoles(): Promise<RabbitHole[]>;
  getHoleBySlug(slug: string): Promise<RabbitHole | undefined>;
  createHole(hole: InsertRabbitHole): Promise<RabbitHole>;
  getCommentsByHoleId(holeId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  upvoteComment(id: number): Promise<Comment | undefined>;
  downvoteComment(id: number): Promise<Comment | undefined>;
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
}

export const storage = new DatabaseStorage();
