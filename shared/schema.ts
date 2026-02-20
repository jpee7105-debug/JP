import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description").default("").notNull(),
  icon: text("icon").default("folder").notNull(),
});

export const rabbitHoles = pgTable("rabbit_holes", {
  id: serial("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  status: text("status").notNull(),
  completion: integer("completion").default(0).notNull(),
  isSpecialist: boolean("is_specialist").default(false).notNull(),
  connections: integer("connections").default(0).notNull(),
  sourceCount: integer("source_count").default(0).notNull(),
  categorySlug: text("category_slug").default("").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  timeline: jsonb("timeline").$type<{ year: string; event: string; type: string }[]>().default([]).notNull(),
  labels: jsonb("labels").$type<string[]>().default([]).notNull(),
  connectedSlugs: jsonb("connected_slugs").$type<string[]>().default([]).notNull(),
});

export const depthNodes = pgTable("depth_nodes", {
  id: serial("id").primaryKey(),
  holeId: integer("hole_id").references(() => rabbitHoles.id).notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  position: integer("position").default(0).notNull(),
  status: text("status").default("locked").notNull(),
  mediaUrl: text("media_url"),
  branchLinks: jsonb("branch_links").$type<{ label: string; targetSlug: string }[]>().default([]).notNull(),
});

export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  holeId: integer("hole_id").references(() => rabbitHoles.id).notNull(),
  nodeId: integer("node_id").references(() => depthNodes.id),
  statement: text("statement").notNull(),
  stance: text("stance").notNull(),
  confidence: integer("confidence").default(50).notNull(),
  evidence: jsonb("evidence").$type<{ sourceId: number; excerpt: string }[]>().default([]).notNull(),
  counterpoints: jsonb("counterpoints").$type<{ sourceId: number; excerpt: string }[]>().default([]).notNull(),
});

export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  holeId: integer("hole_id").references(() => rabbitHoles.id).notNull(),
  title: text("title").notNull(),
  author: text("author").default("").notNull(),
  origin: text("origin").default("").notNull(),
  publishedDate: text("published_date").default("").notNull(),
  url: text("url").default("").notNull(),
  summary: text("summary").default("").notNull(),
  type: text("type").notNull(),
  stanceTag: text("stance_tag").default("neutral").notNull(),
  credibility: integer("credibility").default(50).notNull(),
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

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertRabbitHoleSchema = createInsertSchema(rabbitHoles).omit({ id: true, updatedAt: true });
export const insertDepthNodeSchema = createInsertSchema(depthNodes).omit({ id: true });
export const insertClaimSchema = createInsertSchema(claims).omit({ id: true });
export const insertSourceSchema = createInsertSchema(sources).omit({ id: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true });

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type RabbitHole = typeof rabbitHoles.$inferSelect;
export type InsertRabbitHole = z.infer<typeof insertRabbitHoleSchema>;
export type DepthNode = typeof depthNodes.$inferSelect;
export type InsertDepthNode = z.infer<typeof insertDepthNodeSchema>;
export type Claim = typeof claims.$inferSelect;
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Source = typeof sources.$inferSelect;
export type InsertSource = z.infer<typeof insertSourceSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
