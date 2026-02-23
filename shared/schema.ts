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
  lastEditedBy: text("last_edited_by"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  timeline: jsonb("timeline").$type<{ year: string; event: string; type: string }[]>().default([]).notNull(),
  labels: jsonb("labels").$type<string[]>().default([]).notNull(),
  connectedSlugs: jsonb("connected_slugs").$type<string[]>().default([]).notNull(),
  graphX: integer("graph_x"),
  graphY: integer("graph_y"),
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
  timeline: jsonb("timeline").$type<{ year: string; event: string; type: string }[]>().default([]).notNull(),
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
  nodeId: integer("node_id").references(() => depthNodes.id),
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
  nodeId: integer("node_id").references(() => depthNodes.id),
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

export const podcasts = pgTable("podcasts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").default("").notNull(),
  platform: text("platform").default("").notNull(),
  showUrl: text("show_url").default("").notNull(),
  coverImageUrl: text("cover_image_url").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const podcastEpisodes = pgTable("podcast_episodes", {
  id: serial("id").primaryKey(),
  podcastId: integer("podcast_id").references(() => podcasts.id).notNull(),
  title: text("title").notNull(),
  description: text("description").default("").notNull(),
  publishedDate: text("published_date").default("").notNull(),
  durationSeconds: integer("duration_seconds").default(0).notNull(),
  episodeUrl: text("episode_url").default("").notNull(),
  embedType: text("embed_type").default("iframe").notNull(),
  embedUrl: text("embed_url").default("").notNull(),
  status: text("status").default("Draft").notNull(),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rabbitHolePodcastEpisodes = pgTable("rabbit_hole_podcast_episodes", {
  id: serial("id").primaryKey(),
  rabbitHoleId: integer("rabbit_hole_id").references(() => rabbitHoles.id).notNull(),
  episodeId: integer("episode_id").references(() => podcastEpisodes.id).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  pinned: boolean("pinned").default(false).notNull(),
});

export const sponsoredPodcastSlots = pgTable("sponsored_podcast_slots", {
  id: serial("id").primaryKey(),
  rabbitHoleId: integer("rabbit_hole_id").references(() => rabbitHoles.id).notNull(),
  sponsorName: text("sponsor_name").notNull(),
  sponsorUrl: text("sponsor_url").default("").notNull(),
  disclosureText: text("disclosure_text").notNull(),
  episodeId: integer("episode_id").references(() => podcastEpisodes.id),
  startDate: text("start_date").default("").notNull(),
  endDate: text("end_date").default("").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const creators = pgTable("creators", {
  id: serial("id").primaryKey(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  handle: text("handle").unique().notNull(),
  displayName: text("display_name").notNull(),
  bio: text("bio").default("").notNull(),
  avatarUrl: text("avatar_url").default("").notNull(),
  bannerUrl: text("banner_url").default("").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const streams = pgTable("streams", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").references(() => creators.id).notNull(),
  title: text("title").notNull(),
  description: text("description").default("").notNull(),
  status: text("status").default("Draft").notNull(),
  streamState: text("stream_state").default("upcoming").notNull(),
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  thumbnailUrl: text("thumbnail_url").default("").notNull(),
  provider: text("provider").default("custom_iframe").notNull(),
  embedUrl: text("embed_url").notNull(),
  visibility: text("visibility").default("premium").notNull(),
  chatEnabled: boolean("chat_enabled").default(true).notNull(),
  createdByEmployeeId: uuid("created_by_employee_id"),
  updatedByEmployeeId: uuid("updated_by_employee_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const streamReplays = pgTable("stream_replays", {
  id: serial("id").primaryKey(),
  streamId: integer("stream_id").references(() => streams.id).notNull(),
  embedUrl: text("embed_url").notNull(),
  durationSeconds: integer("duration_seconds").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const liveChatMessages = pgTable("live_chat_messages", {
  id: serial("id").primaryKey(),
  streamId: integer("stream_id").references(() => streams.id).notNull(),
  userId: uuid("user_id"),
  usernameDisplay: text("username_display").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedByEmployeeId: uuid("deleted_by_employee_id"),
});

export const chatModerationActions = pgTable("chat_moderation_actions", {
  id: serial("id").primaryKey(),
  streamId: integer("stream_id").references(() => streams.id).notNull(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  actionType: text("action_type").notNull(),
  targetUserId: uuid("target_user_id"),
  targetUsername: text("target_username"),
  reason: text("reason").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCreatorSchema = createInsertSchema(creators).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStreamSchema = createInsertSchema(streams).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStreamReplaySchema = createInsertSchema(streamReplays).omit({ id: true, createdAt: true });
export const insertLiveChatMessageSchema = createInsertSchema(liveChatMessages).omit({ id: true, createdAt: true });
export const insertChatModerationActionSchema = createInsertSchema(chatModerationActions).omit({ id: true, createdAt: true });

export type Creator = typeof creators.$inferSelect;
export type InsertCreator = z.infer<typeof insertCreatorSchema>;
export type Stream = typeof streams.$inferSelect;
export type InsertStream = z.infer<typeof insertStreamSchema>;
export type StreamReplay = typeof streamReplays.$inferSelect;
export type InsertStreamReplay = z.infer<typeof insertStreamReplaySchema>;
export type LiveChatMessage = typeof liveChatMessages.$inferSelect;
export type InsertLiveChatMessage = z.infer<typeof insertLiveChatMessageSchema>;
export type ChatModerationAction = typeof chatModerationActions.$inferSelect;
export type InsertChatModerationAction = z.infer<typeof insertChatModerationActionSchema>;

export const people = pgTable("people", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  handle: text("handle").unique(),
  aliases: text("aliases").default("").notNull(),
  birthDate: text("birth_date").default("").notNull(),
  deathDate: text("death_date").default("").notNull(),
  description: text("description").default("").notNull(),
  nationality: text("nationality").default("").notNull(),
  avatarUrl: text("avatar_url").default("").notNull(),
  bannerUrl: text("banner_url").default("").notNull(),
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  status: text("status").default("Draft").notNull(),
  graphX: integer("graph_x"),
  graphY: integer("graph_y"),
  createdByEmployeeId: uuid("created_by_employee_id"),
  updatedByEmployeeId: uuid("updated_by_employee_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const relationships = pgTable("relationships", {
  id: serial("id").primaryKey(),
  fromType: text("from_type").notNull(),
  fromId: integer("from_id").notNull(),
  toType: text("to_type").notNull(),
  toId: integer("to_id").notNull(),
  relationshipType: text("relationship_type").notNull(),
  label: text("label").default("").notNull(),
  confidence: integer("confidence").default(100).notNull(),
  sourceIds: jsonb("source_ids").$type<number[]>().default([]).notNull(),
  status: text("status").default("Draft").notNull(),
  createdByEmployeeId: uuid("created_by_employee_id"),
  updatedByEmployeeId: uuid("updated_by_employee_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPersonSchema = createInsertSchema(people).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRelationshipSchema = createInsertSchema(relationships).omit({ id: true, createdAt: true, updatedAt: true });

export type Person = typeof people.$inferSelect;
export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type Relationship = typeof relationships.$inferSelect;
export type InsertRelationship = z.infer<typeof insertRelationshipSchema>;

export const RELATIONSHIP_TYPES = [
  "parent_of", "child_of", "spouse_of", "sibling_of",
  "involved_in", "mentioned_in", "witness_in", "suspect_in", "victim_in", "associate_of",
  "connected_to",
] as const;

export const FAMILY_RELATIONSHIP_TYPES = ["parent_of", "child_of", "spouse_of", "sibling_of"] as const;

export const insertPodcastSchema = createInsertSchema(podcasts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPodcastEpisodeSchema = createInsertSchema(podcastEpisodes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRabbitHolePodcastEpisodeSchema = createInsertSchema(rabbitHolePodcastEpisodes).omit({ id: true });
export const insertSponsoredPodcastSlotSchema = createInsertSchema(sponsoredPodcastSlots).omit({ id: true, createdAt: true, updatedAt: true });

export type Podcast = typeof podcasts.$inferSelect;
export type InsertPodcast = z.infer<typeof insertPodcastSchema>;
export type PodcastEpisode = typeof podcastEpisodes.$inferSelect;
export type InsertPodcastEpisode = z.infer<typeof insertPodcastEpisodeSchema>;
export type RabbitHolePodcastEpisode = typeof rabbitHolePodcastEpisodes.$inferSelect;
export type InsertRabbitHolePodcastEpisode = z.infer<typeof insertRabbitHolePodcastEpisodeSchema>;
export type SponsoredPodcastSlot = typeof sponsoredPodcastSlots.$inferSelect;
export type InsertSponsoredPodcastSlot = z.infer<typeof insertSponsoredPodcastSlotSchema>;
