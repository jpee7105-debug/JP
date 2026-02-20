import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCommentSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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

      const parsed = insertCommentSchema.parse({
        ...req.body,
        holeId: hole.id,
      });
      const comment = await storage.createComment(parsed);
      res.status(201).json(comment);
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: err.errors });
      }
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

  return httpServer;
}
