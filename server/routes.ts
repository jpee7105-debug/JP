import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCommentSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/holes", async (_req, res) => {
    const holes = await storage.getRabbitHoles();
    res.json(holes);
  });

  app.get("/api/holes/:slug", async (req, res) => {
    const hole = await storage.getRabbitHoleBySlug(req.params.slug);
    if (!hole) return res.status(404).json({ message: "Rabbit hole not found" });
    res.json(hole);
  });

  app.get("/api/holes/:id/comments", async (req, res) => {
    const comments = await storage.getComments(parseInt(req.params.id));
    res.json(comments);
  });

  app.post("/api/holes/:id/comments", async (req, res) => {
    const holeId = parseInt(req.params.id);
    const parsed = insertCommentSchema.safeParse({ ...req.body, holeId });
    if (!parsed.success) return res.status(400).json(parsed.error);
    const comment = await storage.createComment(parsed.data);
    res.json(comment);
  });

  return httpServer;
}
