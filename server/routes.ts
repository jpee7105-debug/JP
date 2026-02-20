import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCommentSchema, insertDepthNodeSchema, insertClaimSchema, insertSourceSchema, insertCategorySchema, insertRabbitHoleSchema, insertMediaSchema } from "@shared/schema";
import { ZodError } from "zod";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "rabbithole2024";

function requireAdmin(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      res.json({ token: ADMIN_PASSWORD });
    } else {
      res.status(401).json({ message: "Invalid password" });
    }
  });

  app.get("/api/holes", async (_req, res) => {
    try {
      const holes = await storage.getAllHoles();
      res.json(holes);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch rabbit holes" });
    }
  });

  app.get("/api/holes/specialist", async (_req, res) => {
    try {
      const holes = await storage.getSpecialistHoles();
      res.json(holes);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch specialist holes" });
    }
  });

  app.get("/api/holes/community", async (_req, res) => {
    try {
      const holes = await storage.getCommunityHoles();
      res.json(holes);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch community holes" });
    }
  });

  app.get("/api/holes/category/:slug", async (req, res) => {
    try {
      const holes = await storage.getHolesByCategory(req.params.slug);
      res.json(holes);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch holes by category" });
    }
  });

  app.get("/api/holes/:slug", async (req, res) => {
    try {
      const hole = await storage.getHoleBySlug(req.params.slug);
      if (!hole) return res.status(404).json({ message: "Rabbit hole not found" });
      res.json(hole);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch rabbit hole" });
    }
  });

  app.get("/api/holes/:slug/comments", async (req, res) => {
    try {
      const hole = await storage.getHoleBySlug(req.params.slug);
      if (!hole) return res.status(404).json({ message: "Rabbit hole not found" });
      const holeComments = await storage.getCommentsByHoleId(hole.id);
      res.json(holeComments);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/holes/:slug/comments", async (req, res) => {
    try {
      const hole = await storage.getHoleBySlug(req.params.slug);
      if (!hole) return res.status(404).json({ message: "Rabbit hole not found" });
      const parsed = insertCommentSchema.parse({ ...req.body, holeId: hole.id });
      const comment = await storage.createComment(parsed);
      res.status(201).json(comment);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: "Invalid comment data", errors: err.errors });
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.post("/api/comments/:id/upvote", async (req, res) => {
    try {
      const comment = await storage.upvoteComment(parseInt(req.params.id));
      if (!comment) return res.status(404).json({ message: "Comment not found" });
      res.json(comment);
    } catch (err) {
      res.status(500).json({ message: "Failed to upvote comment" });
    }
  });

  app.post("/api/comments/:id/downvote", async (req, res) => {
    try {
      const comment = await storage.downvoteComment(parseInt(req.params.id));
      if (!comment) return res.status(404).json({ message: "Comment not found" });
      res.json(comment);
    } catch (err) {
      res.status(500).json({ message: "Failed to downvote comment" });
    }
  });

  app.get("/api/holes/:slug/depth-nodes", async (req, res) => {
    try {
      const hole = await storage.getHoleBySlug(req.params.slug);
      if (!hole) return res.status(404).json({ message: "Rabbit hole not found" });
      const nodes = await storage.getDepthNodesByHoleId(hole.id);
      res.json(nodes);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch depth nodes" });
    }
  });

  app.get("/api/holes/:slug/claims", async (req, res) => {
    try {
      const hole = await storage.getHoleBySlug(req.params.slug);
      if (!hole) return res.status(404).json({ message: "Rabbit hole not found" });
      const holeClaims = await storage.getClaimsByHoleId(hole.id);
      res.json(holeClaims);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  app.get("/api/holes/:slug/sources", async (req, res) => {
    try {
      const hole = await storage.getHoleBySlug(req.params.slug);
      if (!hole) return res.status(404).json({ message: "Rabbit hole not found" });
      const holeSources = await storage.getSourcesByHoleId(hole.id);
      res.json(holeSources);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch sources" });
    }
  });

  app.get("/api/categories", async (_req, res) => {
    try {
      const cats = await storage.getAllCategories();
      res.json(cats);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/search", async (req, res) => {
    try {
      const q = (req.query.q as string) || "";
      if (!q.trim()) return res.json({ holes: [], sources: [], claims: [] });
      const results = await storage.search(q.trim());
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  app.get("/api/holes/:slug/media", async (req, res) => {
    try {
      const hole = await storage.getHoleBySlug(req.params.slug);
      if (!hole) return res.status(404).json({ message: "Rabbit hole not found" });
      const holeMedia = await storage.getMediaByHoleId(hole.id);
      res.json(holeMedia);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch media" });
    }
  });

  app.get("/api/sources", async (_req, res) => {
    try {
      const allSources = await storage.getAllSources();
      res.json(allSources);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch sources" });
    }
  });

  app.post("/api/admin/holes", requireAdmin, async (req, res) => {
    try {
      const parsed = insertRabbitHoleSchema.parse(req.body);
      const hole = await storage.createHole(parsed);
      res.status(201).json(hole);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      res.status(500).json({ message: "Failed to create rabbit hole" });
    }
  });

  app.put("/api/admin/holes/:id", requireAdmin, async (req, res) => {
    try {
      const hole = await storage.updateHole(parseInt(req.params.id), req.body);
      if (!hole) return res.status(404).json({ message: "Not found" });
      res.json(hole);
    } catch (err) {
      res.status(500).json({ message: "Failed to update rabbit hole" });
    }
  });

  app.delete("/api/admin/holes/:id", requireAdmin, async (req, res) => {
    try {
      const ok = await storage.deleteHole(parseInt(req.params.id));
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete rabbit hole" });
    }
  });

  app.post("/api/admin/depth-nodes", requireAdmin, async (req, res) => {
    try {
      const parsed = insertDepthNodeSchema.parse(req.body);
      const node = await storage.createDepthNode(parsed);
      res.status(201).json(node);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      res.status(500).json({ message: "Failed to create depth node" });
    }
  });

  app.put("/api/admin/depth-nodes/:id", requireAdmin, async (req, res) => {
    try {
      const node = await storage.updateDepthNode(parseInt(req.params.id), req.body);
      if (!node) return res.status(404).json({ message: "Not found" });
      res.json(node);
    } catch (err) {
      res.status(500).json({ message: "Failed to update depth node" });
    }
  });

  app.delete("/api/admin/depth-nodes/:id", requireAdmin, async (req, res) => {
    try {
      const ok = await storage.deleteDepthNode(parseInt(req.params.id));
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete depth node" });
    }
  });

  app.post("/api/admin/claims", requireAdmin, async (req, res) => {
    try {
      const parsed = insertClaimSchema.parse(req.body);
      const claim = await storage.createClaim(parsed);
      res.status(201).json(claim);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      res.status(500).json({ message: "Failed to create claim" });
    }
  });

  app.put("/api/admin/claims/:id", requireAdmin, async (req, res) => {
    try {
      const claim = await storage.updateClaim(parseInt(req.params.id), req.body);
      if (!claim) return res.status(404).json({ message: "Not found" });
      res.json(claim);
    } catch (err) {
      res.status(500).json({ message: "Failed to update claim" });
    }
  });

  app.delete("/api/admin/claims/:id", requireAdmin, async (req, res) => {
    try {
      const ok = await storage.deleteClaim(parseInt(req.params.id));
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete claim" });
    }
  });

  app.post("/api/admin/sources", requireAdmin, async (req, res) => {
    try {
      const parsed = insertSourceSchema.parse(req.body);
      const source = await storage.createSource(parsed);
      res.status(201).json(source);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      res.status(500).json({ message: "Failed to create source" });
    }
  });

  app.put("/api/admin/sources/:id", requireAdmin, async (req, res) => {
    try {
      const source = await storage.updateSource(parseInt(req.params.id), req.body);
      if (!source) return res.status(404).json({ message: "Not found" });
      res.json(source);
    } catch (err) {
      res.status(500).json({ message: "Failed to update source" });
    }
  });

  app.delete("/api/admin/sources/:id", requireAdmin, async (req, res) => {
    try {
      const ok = await storage.deleteSource(parseInt(req.params.id));
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete source" });
    }
  });

  app.post("/api/admin/media", requireAdmin, async (req, res) => {
    try {
      const parsed = insertMediaSchema.parse(req.body);
      const m = await storage.createMedia(parsed);
      res.status(201).json(m);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      res.status(500).json({ message: "Failed to create media" });
    }
  });

  app.put("/api/admin/media/:id", requireAdmin, async (req, res) => {
    try {
      const m = await storage.updateMedia(parseInt(req.params.id), req.body);
      if (!m) return res.status(404).json({ message: "Not found" });
      res.json(m);
    } catch (err) {
      res.status(500).json({ message: "Failed to update media" });
    }
  });

  app.delete("/api/admin/media/:id", requireAdmin, async (req, res) => {
    try {
      const ok = await storage.deleteMedia(parseInt(req.params.id));
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete media" });
    }
  });

  return httpServer;
}
