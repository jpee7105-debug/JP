import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

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

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  holeId: integer("hole_id").references(() => rabbitHoles.id).notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  type: text("type").default("image").notNull(),
  caption: text("caption").default("").notNull(),
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

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  holeId: integer("hole_id"),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  action: text("action").notNull(),
  editorName: text("editor_name").default("admin").notNull(),
  changes: jsonb("changes").$type<Record<string, any>>().default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  plan: text("plan").default("Free").notNull(),
  subscriptionStatus: text("subscription_status").default("none").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertRabbitHoleSchema = createInsertSchema(rabbitHoles).omit({ id: true, updatedAt: true });
export const insertDepthNodeSchema = createInsertSchema(depthNodes).omit({ id: true });
export const insertClaimSchema = createInsertSchema(claims).omit({ id: true });
export const insertSourceSchema = createInsertSchema(sources).omit({ id: true });
export const insertMediaSchema = createInsertSchema(media).omit({ id: true });
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
export type Media = typeof media.$inferSelect;
export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("Editor"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true, lastLoginAt: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true, updatedAt: true, lastLoginAt: true });
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
