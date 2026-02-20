import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const rabbitHoles = pgTable("rabbit_holes", {
  id: serial("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  status: text("status").notNull(), // 'Verified', 'Specialist', 'Unsolved', 'Active'
  completion: integer("completion").default(0).notNull(),
  isSpecialist: boolean("is_specialist").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  timeline: jsonb("timeline").$type<{ year: string; event: string; type: string }[]>().notNull(),
  sources: jsonb("sources").$type<{ id: number; title: string; type: string; credibility: number; img: string | null }[]>().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  holeId: integer("hole_id").references(() => rabbitHoles.id).notNull(),
  username: text("username").notNull(),
  reputation: integer("reputation").default(0).notNull(),
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  links: jsonb("links").$type<{ text: string; target: string }[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRabbitHoleSchema = createInsertSchema(rabbitHoles).omit({ id: true, updatedAt: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true });

export type RabbitHole = typeof rabbitHoles.$inferSelect;
export type InsertRabbitHole = z.infer<typeof insertRabbitHoleSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
