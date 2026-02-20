import { rabbitHoles, comments, type RabbitHole, type InsertRabbitHole, type Comment, type InsertComment } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getRabbitHoles(): Promise<RabbitHole[]>;
  getRabbitHole(id: number): Promise<RabbitHole | undefined>;
  getRabbitHoleBySlug(slug: string): Promise<RabbitHole | undefined>;
  getComments(holeId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  seedData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getRabbitHoles(): Promise<RabbitHole[]> {
    return await db.select().from(rabbitHoles);
  }

  async getRabbitHole(id: number): Promise<RabbitHole | undefined> {
    const [hole] = await db.select().from(rabbitHoles).where(eq(rabbitHoles.id, id));
    return hole;
  }

  async getRabbitHoleBySlug(slug: string): Promise<RabbitHole | undefined> {
    const [hole] = await db.select().from(rabbitHoles).where(eq(rabbitHoles.slug, slug));
    return hole;
  }

  async getComments(holeId: number): Promise<Comment[]> {
    return await db.select().from(comments).where(eq(comments.holeId, holeId));
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(insertComment).returning();
    return comment;
  }

  async seedData(): Promise<void> {
    const existing = await this.getRabbitHoles();
    if (existing.length > 0) return;

    await db.insert(rabbitHoles).values([
      {
        slug: "mk-ultra",
        title: "Project MKUltra",
        status: "Verified",
        completion: 35,
        isSpecialist: false,
        summary: "CIA mind control research program exploring behavioral engineering and interrogation techniques.",
        timeline: [
          { year: "1953", event: "Project officially sanctioned.", type: "verified" },
          { year: "1977", event: "FOIA request uncovers 20,000 surviving documents.", type: "verified" }
        ],
        sources: [
          { id: 1, title: "CIA Declassified Archives", type: "document", credibility: 98, img: null }
        ]
      },
      {
        slug: "vatican-archives",
        title: "The Apostolic Archive",
        status: "Specialist",
        completion: 12,
        isSpecialist: true,
        summary: "Deep dive into the restricted layers of the Vatican Secret Archives.",
        timeline: [
          { year: "1612", event: "Archives separated from the Vatican Library.", type: "verified" }
        ],
        sources: [
          { id: 1, title: "Secret Archive Index", type: "document", credibility: 95, img: null }
        ]
      }
    ]);
  }
}

export const storage = new DatabaseStorage();
storage.seedData();
