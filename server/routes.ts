import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCommentSchema, insertDepthNodeSchema, insertClaimSchema, insertSourceSchema, insertCategorySchema, insertRabbitHoleSchema, insertMediaSchema, insertPodcastSchema, insertPodcastEpisodeSchema, insertRabbitHolePodcastEpisodeSchema, insertSponsoredPodcastSlotSchema, insertCreatorSchema, insertStreamSchema, insertStreamReplaySchema, insertLiveChatMessageSchema, insertChatModerationActionSchema, insertPersonSchema, insertRelationshipSchema, insertGlobalTimelineItemSchema, insertTimelineEntrySchema } from "@shared/schema";
import { ZodError, z } from "zod";
import bcrypt from "bcryptjs";
import type { Employee, Person, Relationship } from "@shared/schema";
import { toUserDTO, toEmployeeDTO } from "./dtos";
import { timelineEntries } from "@shared/schema";
import { autoSeedIfEmpty } from "./auto-seed";
import { db } from "./storage";
import { sql, eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      employee?: Employee;
    }
  }
}

const FREE_NODE_LIMIT = 2;

type EmployeeRole = "Admin" | "Editor" | "Moderator";

async function requireEmployee(req: any, res: any, next: any) {
  if (!req.session.employeeId) {
    return res.status(401).json({ message: "Employee authentication required" });
  }
  try {
    const emp = await storage.getEmployeeById(req.session.employeeId);
    if (!emp || !emp.isActive) {
      return res.status(401).json({ message: "Employee account not found or deactivated" });
    }
    req.employee = emp;
    next();
  } catch {
    return res.status(500).json({ message: "Authentication check failed" });
  }
}

function requireRole(...roles: EmployeeRole[]) {
  return (req: any, res: any, next: any) => {
    if (!req.employee) {
      return res.status(401).json({ message: "Employee authentication required" });
    }
    if (!roles.includes(req.employee.role as EmployeeRole)) {
      return res.status(403).json({ message: `Requires one of: ${roles.join(", ")}` });
    }
    next();
  };
}

function getEditorName(req: any): string {
  return req.employee?.name || "admin";
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      "[startup] ADMIN_PASSWORD environment variable is required in all environments. " +
      "Set it via Replit Secrets (development and production). " +
      "Choose a strong password — it is never logged."
    );
  }

  const empCount = await storage.getEmployeeCount();
  if (empCount === 0) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await storage.createEmployee({
      email: "admin@rabbithole.io",
      passwordHash,
      name: "Admin",
      role: "Admin",
      isActive: true,
    });
    // Never log the password value — not even in development.
    console.log("[startup] Default admin account created. Log in at /admin with the configured ADMIN_PASSWORD.");
  }

  try {
    await autoSeedIfEmpty();
  } catch (err) {
    console.error("[auto-seed] Error during auto-seed:", err);
  }

  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      const emp = await storage.getEmployeeByEmail(email.toLowerCase());
      if (!emp) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      if (!emp.isActive) {
        return res.status(401).json({ message: "Account has been deactivated" });
      }
      const valid = await bcrypt.compare(password, emp.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      await storage.updateEmployee(emp.id, { lastLoginAt: new Date() });
      req.session.regenerate((regenErr) => {
        if (regenErr) return res.status(500).json({ message: "Session error. Please try again." });
        req.session.employeeId = emp.id;
        res.json(toEmployeeDTO(emp));
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to log in" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/admin/me", async (req, res) => {
    if (!req.session.employeeId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const emp = await storage.getEmployeeById(req.session.employeeId);
    if (!emp || !emp.isActive) {
      return res.status(401).json({ message: "Employee not found or deactivated" });
    }
    res.json(toEmployeeDTO(emp));
  });

  // ===== USER AUTH ROUTES =====

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const existing = await storage.getUserByEmail(email.toLowerCase());
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await storage.createUser({
        email: email.toLowerCase(),
        passwordHash,
        name: name || null,
        plan: "Free",
        subscriptionStatus: "none",
      });
      req.session.regenerate((regenErr) => {
        if (regenErr) return res.status(500).json({ message: "Session error. Please try again." });
        req.session.userId = user.id;
        res.status(201).json(toUserDTO(user));
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      await storage.updateUser(user.id, { lastLoginAt: new Date() });
      req.session.regenerate((regenErr) => {
        if (regenErr) return res.status(500).json({ message: "Session error. Please try again." });
        req.session.userId = user.id;
        res.json(toUserDTO(user));
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to log in" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Failed to log out" });
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    res.json(toUserDTO(user));
  });

  app.get("/api/holes", async (req, res) => {
    try {
      const isEmployeeSession = !!req.session.employeeId;
      const admin = req.query.admin === "true" && isEmployeeSession;
      const holes = admin ? await storage.getAllHoles() : await storage.getPublishedHoles();
      res.json(holes);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch rabbit holes" });
    }
  });

  app.get("/api/holes/specialist", async (req, res) => {
    try {
      const isEmployeeSession = !!req.session.employeeId;
      const admin = req.query.admin === "true" && isEmployeeSession;
      const holes = admin ? await storage.getSpecialistHoles() : await storage.getPublishedSpecialistHoles();
      res.json(holes);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch specialist holes" });
    }
  });

  app.get("/api/holes/community", async (req, res) => {
    try {
      const isEmployeeSession = !!req.session.employeeId;
      const admin = req.query.admin === "true" && isEmployeeSession;
      const holes = admin ? await storage.getCommunityHoles() : await storage.getPublishedCommunityHoles();
      res.json(holes);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch community holes" });
    }
  });

  app.get("/api/holes/category/:slug", async (req, res) => {
    try {
      const isEmployeeSession = !!req.session.employeeId;
      const admin = req.query.admin === "true" && isEmployeeSession;
      const holes = admin ? await storage.getHolesByCategory(req.params.slug) : await storage.getPublishedHolesByCategory(req.params.slug);
      res.json(holes);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch holes by category" });
    }
  });

  app.get("/api/holes/:slug", async (req, res) => {
    try {
      const isEmployeeSession = !!req.session.employeeId;
      const admin = req.query.admin === "true" && isEmployeeSession;
      const hole = await storage.getHoleBySlug(req.params.slug);
      if (!hole) return res.status(404).json({ message: "Rabbit hole not found" });
      if (!admin && hole.status !== "Published") return res.status(404).json({ message: "Rabbit hole not found" });
      res.json(hole);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch rabbit hole" });
    }
  });

  app.get("/api/holes/:slug/comments", async (req, res) => {
    try {
      const hole = await storage.getHoleBySlug(req.params.slug);
      if (!hole || hole.status !== "Published") return res.status(404).json({ message: "Rabbit hole not found" });
      const holeComments = await storage.getCommentsByHoleId(hole.id);
      res.json(holeComments);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/holes/:slug/comments", async (req, res) => {
    try {
      const hole = await storage.getHoleBySlug(req.params.slug);
      if (!hole || hole.status !== "Published") return res.status(404).json({ message: "Rabbit hole not found" });
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
      if (hole.status !== "Published" && !req.session.employeeId) return res.status(404).json({ message: "Rabbit hole not found" });
      const nodes = await storage.getDepthNodesByHoleId(hole.id);

      if (req.session.employeeId) {
        return res.json(nodes.map(n => ({ ...n, locked: false })));
      }

      let userPlan = "Free";
      let subscriptionStatus = "none";
      if (req.session.userId) {
        const user = await storage.getUserById(req.session.userId);
        if (user) {
          userPlan = user.plan;
          subscriptionStatus = user.subscriptionStatus;
        }
      }
      const hasFullAccess = userPlan === "Pro" && subscriptionStatus === "active";

      if (hasFullAccess) {
        res.json(nodes.map(n => ({ ...n, locked: false })));
      } else {
        const gated = nodes.map((n, i) => {
          if (i < FREE_NODE_LIMIT) {
            return { ...n, locked: false };
          }
          return {
            ...n,
            content: "",
            locked: true,
          };
        });
        res.json(gated);
      }
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch depth nodes" });
    }
  });

  app.get("/api/holes/:slug/access", async (req, res) => {
    try {
      const hole = await storage.getHoleBySlug(req.params.slug);
      if (!hole || hole.status !== "Published") return res.status(404).json({ message: "Rabbit hole not found" });
      const nodes = await storage.getDepthNodesByHoleId(hole.id);
      const totalNodes = nodes.length;

      if (req.session.employeeId) {
        return res.json({
          totalNodes,
          previewLimit: totalNodes,
          hasFullAccess: true,
          loggedIn: true,
          plan: "Employee",
        });
      }

      let userPlan = "Free";
      let subscriptionStatus = "none";
      let loggedIn = false;
      if (req.session.userId) {
        const user = await storage.getUserById(req.session.userId);
        if (user) {
          userPlan = user.plan;
          subscriptionStatus = user.subscriptionStatus;
          loggedIn = true;
        }
      }
      const hasFullAccess = userPlan === "Pro" && subscriptionStatus === "active";

      res.json({
        totalNodes,
        previewLimit: hasFullAccess ? totalNodes : FREE_NODE_LIMIT,
        hasFullAccess,
        loggedIn,
        plan: userPlan,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to check access" });
    }
  });

  app.get("/api/holes/:slug/claims", async (req, res) => {
    try {
      const hole = await storage.getHoleBySlug(req.params.slug);
      if (!hole) return res.status(404).json({ message: "Rabbit hole not found" });
      if (hole.status !== "Published" && !req.session.employeeId) return res.status(404).json({ message: "Rabbit hole not found" });
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
      if (hole.status !== "Published" && !req.session.employeeId) return res.status(404).json({ message: "Rabbit hole not found" });
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
      if (!q.trim()) return res.json({ holes: [], sources: [], claims: [], people: [] });
      const results = await storage.search(q.trim());
      const matchedPeople = await storage.searchPeople(q.trim());
      const filteredPeople = req.session.employeeId ? matchedPeople : matchedPeople.filter(p => p.status === "Published");
      res.json({ ...results, people: filteredPeople });
    } catch (err) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  app.get("/api/holes/:slug/media", async (req, res) => {
    try {
      const hole = await storage.getHoleBySlug(req.params.slug);
      if (!hole) return res.status(404).json({ message: "Rabbit hole not found" });
      if (hole.status !== "Published" && !req.session.employeeId) return res.status(404).json({ message: "Rabbit hole not found" });
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

  // ===== ADMIN ROUTES =====

  app.post("/api/admin/holes", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const parsed = insertRabbitHoleSchema.parse({ ...req.body, status: req.body.status || "Draft", lastEditedBy: getEditorName(req) });
      const hole = await storage.createHole(parsed);
      await storage.createAuditLog({
        holeId: hole.id, entityType: "rabbit_hole", entityId: hole.id,
        action: "create", editorName: getEditorName(req), changes: { title: hole.title, slug: hole.slug },
      });
      res.status(201).json(hole);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      res.status(500).json({ message: "Failed to create rabbit hole" });
    }
  });

  app.put("/api/admin/holes/:id", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const before = await storage.getHoleById(id);
      if (!before) return res.status(404).json({ message: "Not found" });

      if (req.body.status === "Published") {
        if (req.employee?.role !== "Admin") {
          return res.status(403).json({ message: "Only Admin can publish investigations" });
        }
        const checklist = await storage.getPublishChecklist(id);
        if (!checklist.passed) {
          const failedChecks = checklist.checks.filter(c => !c.passed);
          return res.status(400).json({
            message: "Cannot publish: checklist requirements not met",
            checks: checklist.checks,
            failedChecks,
          });
        }
      }

      if (req.body.status === "Review" && before.status === "Draft") {
        // Editor can move Draft -> Review (or Admin)
      } else if (req.body.status && req.body.status !== before.status) {
        if (req.body.status === "Published" && req.employee?.role !== "Admin") {
          return res.status(403).json({ message: "Only Admin can publish investigations" });
        }
      }

      const hole = await storage.updateHole(id, { ...req.body, lastEditedBy: getEditorName(req) });
      if (!hole) return res.status(404).json({ message: "Not found" });
      await storage.createAuditLog({
        holeId: hole.id, entityType: "rabbit_hole", entityId: hole.id,
        action: "update", editorName: getEditorName(req),
        changes: { before: { status: before.status, title: before.title }, after: { status: hole.status, title: hole.title } },
      });
      res.json(hole);
    } catch (err) {
      res.status(500).json({ message: "Failed to update rabbit hole" });
    }
  });

  app.delete("/api/admin/holes/:id", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const before = await storage.getHoleById(id);
      const ok = await storage.deleteHole(id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      if (before) {
        await storage.createAuditLog({
          holeId: null as any, entityType: "rabbit_hole", entityId: id,
          action: "delete", editorName: getEditorName(req),
          changes: { deleted: { title: before.title, slug: before.slug } },
        });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete rabbit hole" });
    }
  });

  app.post("/api/admin/depth-nodes", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const parsed = insertDepthNodeSchema.parse(req.body);
      const node = await storage.createDepthNode(parsed);
      await storage.createAuditLog({
        holeId: node.holeId, entityType: "depth_node", entityId: node.id,
        action: "create", editorName: getEditorName(req), changes: { title: node.title },
      });
      res.status(201).json(node);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      res.status(500).json({ message: "Failed to create depth node" });
    }
  });

  app.put("/api/admin/depth-nodes/:id", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const before = await storage.getDepthNode(id);
      const node = await storage.updateDepthNode(id, req.body);
      if (!node) return res.status(404).json({ message: "Not found" });
      await storage.createAuditLog({
        holeId: node.holeId, entityType: "depth_node", entityId: node.id,
        action: "update", editorName: getEditorName(req), changes: { before: { title: before?.title }, after: { title: node.title } },
      });
      res.json(node);
    } catch (err) {
      res.status(500).json({ message: "Failed to update depth node" });
    }
  });

  app.delete("/api/admin/depth-nodes/:id", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const before = await storage.getDepthNode(id);
      const ok = await storage.deleteDepthNode(id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      await storage.createAuditLog({
        holeId: before?.holeId || null as any, entityType: "depth_node", entityId: id,
        action: "delete", editorName: getEditorName(req), changes: { deleted: { title: before?.title } },
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete depth node" });
    }
  });

  app.post("/api/admin/claims", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const parsed = insertClaimSchema.parse(req.body);
      const claim = await storage.createClaim(parsed);
      await storage.createAuditLog({
        holeId: claim.holeId, entityType: "claim", entityId: claim.id,
        action: "create", editorName: getEditorName(req), changes: { statement: claim.statement.slice(0, 60) },
      });
      res.status(201).json(claim);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      res.status(500).json({ message: "Failed to create claim" });
    }
  });

  app.put("/api/admin/claims/:id", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const claim = await storage.updateClaim(id, req.body);
      if (!claim) return res.status(404).json({ message: "Not found" });
      await storage.createAuditLog({
        holeId: claim.holeId, entityType: "claim", entityId: claim.id,
        action: "update", editorName: getEditorName(req), changes: { statement: claim.statement.slice(0, 60) },
      });
      res.json(claim);
    } catch (err) {
      res.status(500).json({ message: "Failed to update claim" });
    }
  });

  app.delete("/api/admin/claims/:id", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const before = await storage.getClaim(id);
      const ok = await storage.deleteClaim(id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      await storage.createAuditLog({
        holeId: before?.holeId || null as any, entityType: "claim", entityId: id,
        action: "delete", editorName: getEditorName(req), changes: { deleted: true },
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete claim" });
    }
  });

  app.post("/api/admin/sources", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const parsed = insertSourceSchema.parse(req.body);
      const source = await storage.createSource(parsed);
      await storage.createAuditLog({
        holeId: source.holeId, entityType: "source", entityId: source.id,
        action: "create", editorName: getEditorName(req), changes: { title: source.title },
      });
      res.status(201).json(source);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      res.status(500).json({ message: "Failed to create source" });
    }
  });

  app.put("/api/admin/sources/:id", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const source = await storage.updateSource(id, req.body);
      if (!source) return res.status(404).json({ message: "Not found" });
      await storage.createAuditLog({
        holeId: source.holeId, entityType: "source", entityId: source.id,
        action: "update", editorName: getEditorName(req), changes: { title: source.title },
      });
      res.json(source);
    } catch (err) {
      res.status(500).json({ message: "Failed to update source" });
    }
  });

  app.delete("/api/admin/sources/:id", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const before = await storage.getSource(id);
      const ok = await storage.deleteSource(id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      await storage.createAuditLog({
        holeId: before?.holeId || null as any, entityType: "source", entityId: id,
        action: "delete", editorName: getEditorName(req), changes: { deleted: { title: before?.title } },
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete source" });
    }
  });

  app.post("/api/admin/media", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const parsed = insertMediaSchema.parse(req.body);
      const m = await storage.createMedia(parsed);
      await storage.createAuditLog({
        holeId: m.holeId, entityType: "media", entityId: m.id,
        action: "create", editorName: getEditorName(req), changes: { title: m.title },
      });
      res.status(201).json(m);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      res.status(500).json({ message: "Failed to create media" });
    }
  });

  app.put("/api/admin/media/:id", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const m = await storage.updateMedia(id, req.body);
      if (!m) return res.status(404).json({ message: "Not found" });
      await storage.createAuditLog({
        holeId: m.holeId, entityType: "media", entityId: m.id,
        action: "update", editorName: getEditorName(req), changes: { title: m.title },
      });
      res.json(m);
    } catch (err) {
      res.status(500).json({ message: "Failed to update media" });
    }
  });

  app.delete("/api/admin/media/:id", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const before = await storage.getMedia(id);
      const ok = await storage.deleteMedia(id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      await storage.createAuditLog({
        holeId: before?.holeId || null as any, entityType: "media", entityId: id,
        action: "delete", editorName: getEditorName(req), changes: { deleted: { title: before?.title } },
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete media" });
    }
  });

  // ===== NODE-SCOPED QUERIES =====

  app.get("/api/admin/nodes/:nodeId/claims", requireEmployee, async (req, res) => {
    try {
      const nodeId = parseInt(req.params.nodeId);
      const nodeClaims = await storage.getClaimsByNodeId(nodeId);
      res.json(nodeClaims);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch claims for node" });
    }
  });

  app.get("/api/admin/nodes/:nodeId/sources", requireEmployee, async (req, res) => {
    try {
      const nodeId = parseInt(req.params.nodeId);
      const nodeSources = await storage.getSourcesByNodeId(nodeId);
      res.json(nodeSources);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch sources for node" });
    }
  });

  app.get("/api/admin/nodes/:nodeId/media", requireEmployee, async (req, res) => {
    try {
      const nodeId = parseInt(req.params.nodeId);
      const nodeMedia = await storage.getMediaByNodeId(nodeId);
      res.json(nodeMedia);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch media for node" });
    }
  });

  // ===== ADMIN TOOLS =====

  app.get("/api/admin/audit-logs", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const holeId = req.query.holeId ? parseInt(req.query.holeId as string) : null;
      const logs = holeId ? await storage.getAuditLogsByHoleId(holeId) : await storage.getAllAuditLogs();
      res.json(logs);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/admin/export", requireEmployee, requireRole("Admin"), async (_req, res) => {
    try {
      const data = await storage.exportAll();
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  app.post("/api/admin/import", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      const data = req.body;
      if (!data || typeof data !== "object") {
        return res.status(400).json({ message: "Invalid import data" });
      }
      const result = await storage.importAll(data);
      await storage.createAuditLog({
        holeId: null as any, entityType: "system", entityId: null as any,
        action: "import", editorName: getEditorName(req),
        changes: { imported: result.imported },
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Failed to import data: " + (err as Error).message });
    }
  });

  app.get("/api/admin/validate", requireEmployee, requireRole("Admin"), async (_req, res) => {
    try {
      const result = await storage.validateIntegrity();
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Failed to validate" });
    }
  });

  // ===== EMPLOYEE MANAGEMENT (Admin only) =====

  app.get("/api/admin/employees", requireEmployee, requireRole("Admin"), async (_req, res) => {
    try {
      const emps = await storage.getAllEmployees();
      res.json(emps.map(toEmployeeDTO));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/admin/employees", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      const { email, name, role, password } = req.body;
      if (!email || !name || !role || !password) {
        return res.status(400).json({ message: "Email, name, role, and password are required" });
      }
      if (!["Admin", "Editor", "Moderator"].includes(role)) {
        return res.status(400).json({ message: "Role must be Admin, Editor, or Moderator" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const existing = await storage.getEmployeeByEmail(email.toLowerCase());
      if (existing) {
        return res.status(409).json({ message: "An employee with this email already exists" });
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const emp = await storage.createEmployee({
        email: email.toLowerCase(),
        passwordHash,
        name,
        role,
        isActive: true,
      });
      await storage.createAuditLog({
        holeId: null as any, entityType: "employee", entityId: null as any,
        action: "create", editorName: getEditorName(req),
        changes: { email: emp.email, name: emp.name, role: emp.role },
      });
      res.status(201).json(toEmployeeDTO(emp));
    } catch (err) {
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.put("/api/admin/employees/:id", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, role, isActive } = req.body;
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (role !== undefined) {
        if (!["Admin", "Editor", "Moderator"].includes(role)) {
          return res.status(400).json({ message: "Role must be Admin, Editor, or Moderator" });
        }
        updateData.role = role;
      }
      if (isActive !== undefined) updateData.isActive = isActive;
      const emp = await storage.updateEmployee(id, updateData);
      if (!emp) return res.status(404).json({ message: "Employee not found" });
      await storage.createAuditLog({
        holeId: null as any, entityType: "employee", entityId: null as any,
        action: "update", editorName: getEditorName(req),
        changes: { employeeEmail: emp.email, ...updateData },
      });
      res.json(toEmployeeDTO(emp));
    } catch (err) {
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.post("/api/admin/employees/:id/reset-password", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const emp = await storage.updateEmployee(id, { passwordHash });
      if (!emp) return res.status(404).json({ message: "Employee not found" });
      await storage.createAuditLog({
        holeId: null as any, entityType: "employee", entityId: null as any,
        action: "password_reset", editorName: getEditorName(req),
        changes: { employeeEmail: emp.email },
      });
      res.json({ message: "Password reset successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // ===== EDITORIAL DASHBOARD =====

  app.get("/api/admin/dashboard", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const allHoles = await storage.getAllHoles();
      const editorName = getEditorName(req);
      const myDrafts = allHoles.filter(h => h.status === "Draft" && h.lastEditedBy === editorName);
      const inReview = allHoles.filter(h => h.status === "Review");
      const published = allHoles.filter(h => h.status === "Published");
      const recentlyEdited = [...allHoles].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 20);

      const needsFixesIds = new Set<number>();
      const integrity = await storage.validateIntegrity();
      for (const issue of integrity.issues) {
        needsFixesIds.add(issue.holeId);
      }
      const needsFixes = allHoles.filter(h => needsFixesIds.has(h.id));

      res.json({ myDrafts, inReview, needsFixes, published, recentlyEdited });
    } catch (err) {
      res.status(500).json({ message: "Failed to load dashboard" });
    }
  });

  app.get("/api/admin/publish-checklist/:id", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const checklist = await storage.getPublishChecklist(id);
      res.json(checklist);
    } catch (err) {
      res.status(500).json({ message: "Failed to check publish readiness" });
    }
  });

  // ===== PODCAST ROUTES =====

  app.get("/api/admin/podcasts", requireEmployee, requireRole("Admin", "Editor"), async (_req, res) => {
    try {
      const all = await storage.getAllPodcasts();
      res.json(all);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch podcasts" });
    }
  });

  app.post("/api/admin/podcasts", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const parsed = insertPodcastSchema.parse(req.body);
      const podcast = await storage.createPodcast(parsed);
      await storage.createAuditLog({
        holeId: null as any, entityType: "podcast", entityId: podcast.id,
        action: "create", editorName: getEditorName(req), changes: { title: podcast.title },
      });
      res.status(201).json(podcast);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      res.status(500).json({ message: "Failed to create podcast" });
    }
  });

  app.put("/api/admin/podcasts/:id", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const podcast = await storage.updatePodcast(id, req.body);
      if (!podcast) return res.status(404).json({ message: "Not found" });
      await storage.createAuditLog({
        holeId: null as any, entityType: "podcast", entityId: podcast.id,
        action: "update", editorName: getEditorName(req), changes: { title: podcast.title },
      });
      res.json(podcast);
    } catch (err) {
      res.status(500).json({ message: "Failed to update podcast" });
    }
  });

  app.delete("/api/admin/podcasts/:id", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ok = await storage.deletePodcast(id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete podcast" });
    }
  });

  // Podcast Episodes
  app.get("/api/admin/podcast-episodes", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const podcastId = req.query.podcastId ? parseInt(req.query.podcastId as string) : null;
      const episodes = podcastId ? await storage.getPodcastEpisodesByPodcastId(podcastId) : await storage.getAllPodcastEpisodes();
      res.json(episodes);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch episodes" });
    }
  });

  app.post("/api/admin/podcast-episodes", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const parsed = insertPodcastEpisodeSchema.parse({ ...req.body, status: req.body.status || "Draft", createdBy: getEditorName(req), updatedBy: getEditorName(req) });
      const episode = await storage.createPodcastEpisode(parsed);
      await storage.createAuditLog({
        holeId: null as any, entityType: "podcast_episode", entityId: episode.id,
        action: "create", editorName: getEditorName(req), changes: { title: episode.title },
      });
      res.status(201).json(episode);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      res.status(500).json({ message: "Failed to create episode" });
    }
  });

  app.put("/api/admin/podcast-episodes/:id", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const before = await storage.getPodcastEpisode(id);
      if (!before) return res.status(404).json({ message: "Not found" });

      if (req.body.status === "Published" && req.employee?.role !== "Admin") {
        return res.status(403).json({ message: "Only Admin can publish episodes" });
      }
      if (req.body.status === "Review" && before.status !== "Draft" && req.employee?.role !== "Admin") {
        return res.status(403).json({ message: "Can only move Draft to Review" });
      }

      const episode = await storage.updatePodcastEpisode(id, { ...req.body, updatedBy: getEditorName(req) });
      if (!episode) return res.status(404).json({ message: "Not found" });
      await storage.createAuditLog({
        holeId: null as any, entityType: "podcast_episode", entityId: episode.id,
        action: "update", editorName: getEditorName(req), changes: { title: episode.title, status: episode.status },
      });
      res.json(episode);
    } catch (err) {
      res.status(500).json({ message: "Failed to update episode" });
    }
  });

  app.delete("/api/admin/podcast-episodes/:id", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ok = await storage.deletePodcastEpisode(id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete episode" });
    }
  });

  // Rabbit Hole <-> Episode Links
  app.get("/api/admin/hole-episodes/:holeId", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const holeId = parseInt(req.params.holeId);
      const links = await storage.getLinksForHole(holeId);
      res.json(links);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch episode links" });
    }
  });

  app.post("/api/admin/hole-episodes", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const parsed = insertRabbitHolePodcastEpisodeSchema.parse(req.body);
      const link = await storage.createLink(parsed);
      res.status(201).json(link);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      res.status(500).json({ message: "Failed to link episode" });
    }
  });

  app.put("/api/admin/hole-episodes/:id", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const link = await storage.updateLink(id, req.body);
      if (!link) return res.status(404).json({ message: "Not found" });
      res.json(link);
    } catch (err) {
      res.status(500).json({ message: "Failed to update link" });
    }
  });

  app.delete("/api/admin/hole-episodes/:id", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ok = await storage.deleteLink(id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to remove link" });
    }
  });

  // Sponsored Podcast Slots (Admin only)
  app.get("/api/admin/sponsored-slots", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      const holeId = req.query.holeId ? parseInt(req.query.holeId as string) : null;
      const slots = holeId ? await storage.getSponsoredSlotsForHole(holeId) : await storage.getAllSponsoredSlots();
      res.json(slots);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch sponsored slots" });
    }
  });

  app.post("/api/admin/sponsored-slots", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      const parsed = insertSponsoredPodcastSlotSchema.parse(req.body);
      const slot = await storage.createSponsoredSlot(parsed);
      await storage.createAuditLog({
        holeId: slot.rabbitHoleId, entityType: "sponsored_slot", entityId: slot.id,
        action: "create", editorName: getEditorName(req), changes: { sponsorName: slot.sponsorName },
      });
      res.status(201).json(slot);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      res.status(500).json({ message: "Failed to create sponsored slot" });
    }
  });

  app.put("/api/admin/sponsored-slots/:id", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const slot = await storage.updateSponsoredSlot(id, req.body);
      if (!slot) return res.status(404).json({ message: "Not found" });
      res.json(slot);
    } catch (err) {
      res.status(500).json({ message: "Failed to update sponsored slot" });
    }
  });

  app.delete("/api/admin/sponsored-slots/:id", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ok = await storage.deleteSponsoredSlot(id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete sponsored slot" });
    }
  });

  // ===== ADMIN PEOPLE ENDPOINTS =====

  app.get("/api/admin/people", requireEmployee, async (req, res) => {
    try {
      const allPeople = await storage.getAllPeople();
      res.json(allPeople);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch people" });
    }
  });

  app.get("/api/admin/people/:id", requireEmployee, async (req, res) => {
    try {
      const person = await storage.getPerson(parseInt(req.params.id));
      if (!person) return res.status(404).json({ message: "Person not found" });
      res.json(person);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch person" });
    }
  });

  app.post("/api/admin/people", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const data = insertPersonSchema.parse({ ...req.body, createdByEmployeeId: req.session.employeeId, updatedByEmployeeId: req.session.employeeId });
      const person = await storage.createPerson(data);
      res.status(201).json(person);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: "Validation failed", errors: err.errors });
      res.status(500).json({ message: "Failed to create person" });
    }
  });

  app.put("/api/admin/people/:id", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const updated = await storage.updatePerson(parseInt(req.params.id), { ...req.body, updatedByEmployeeId: req.session.employeeId });
      if (!updated) return res.status(404).json({ message: "Person not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update person" });
    }
  });

  app.delete("/api/admin/people/:id", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      const deleted = await storage.deletePerson(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ message: "Person not found" });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete person" });
    }
  });

  // ===== ADMIN RELATIONSHIPS ENDPOINTS =====

  app.get("/api/admin/relationships", requireEmployee, async (req, res) => {
    try {
      const allRels = await storage.getAllRelationships();
      res.json(allRels);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch relationships" });
    }
  });

  app.post("/api/admin/relationships", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const data = insertRelationshipSchema.parse({ ...req.body, createdByEmployeeId: req.session.employeeId, updatedByEmployeeId: req.session.employeeId });
      const symmetricTypes = ["spouse_of", "sibling_of"];
      if (symmetricTypes.includes(data.relationshipType)) {
        const isDuplicate = await storage.checkDuplicateRelationship(data.fromType, data.fromId, data.toType, data.toId, data.relationshipType);
        if (isDuplicate) return res.status(409).json({ message: `Duplicate ${data.relationshipType.replace(/_/g, " ")} relationship already exists` });
      }
      if (data.fromType === data.toType && data.fromId === data.toId) {
        return res.status(400).json({ message: "Cannot create a relationship from an entity to itself" });
      }
      const rel = await storage.createRelationship(data);
      res.status(201).json(rel);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: "Validation failed", errors: err.errors });
      res.status(500).json({ message: "Failed to create relationship" });
    }
  });

  app.put("/api/admin/relationships/:id", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const updated = await storage.updateRelationship(parseInt(req.params.id), { ...req.body, updatedByEmployeeId: req.session.employeeId });
      if (!updated) return res.status(404).json({ message: "Relationship not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update relationship" });
    }
  });

  app.delete("/api/admin/relationships/:id", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      const deleted = await storage.deleteRelationship(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ message: "Relationship not found" });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete relationship" });
    }
  });

  // ===== GRAPH POSITION ENDPOINTS =====

  app.patch("/api/admin/graph-positions", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const { positions } = req.body as { positions: { type: string; id: number; x: number; y: number }[] };
      if (!Array.isArray(positions) || positions.length === 0) {
        return res.status(400).json({ message: "positions array required" });
      }

      for (const p of positions) {
        if (!p.type || !p.id || typeof p.x !== "number" || typeof p.y !== "number") continue;
        if (p.type !== "case" && p.type !== "person") continue;

        if (p.type === "case") {
          await storage.updateHole(p.id, { graphX: Math.round(p.x), graphY: Math.round(p.y) } as any);
        } else {
          await storage.updatePerson(p.id, { graphX: Math.round(p.x), graphY: Math.round(p.y) });
        }
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to update positions" });
    }
  });

  // ===== PUBLIC PEOPLE ENDPOINTS =====

  app.get("/api/people", async (req, res) => {
    try {
      const publishedPeople = await storage.getPublishedPeople();
      res.json(publishedPeople);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch people" });
    }
  });

  app.get("/api/people/handle/:handle", async (req, res) => {
    try {
      const person = await storage.getPersonByHandle(req.params.handle);
      if (!person) return res.status(404).json({ message: "Person not found" });
      if (person.status !== "Published" && !req.session.employeeId) return res.status(404).json({ message: "Person not found" });
      res.json(person);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch person" });
    }
  });

  app.get("/api/people/:id", async (req, res) => {
    try {
      const person = await storage.getPerson(parseInt(req.params.id));
      if (!person) return res.status(404).json({ message: "Person not found" });
      if (person.status !== "Published" && !req.session.employeeId) return res.status(404).json({ message: "Person not found" });
      res.json(person);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch person" });
    }
  });

  app.get("/api/people/:id/relationships", async (req, res) => {
    try {
      const person = await storage.getPerson(parseInt(req.params.id));
      if (!person) return res.status(404).json({ message: "Person not found" });
      if (person.status !== "Published" && !req.session.employeeId) return res.status(404).json({ message: "Person not found" });
      const rels = await storage.getRelationshipsForEntity("person", person.id);
      const filtered = req.session.employeeId ? rels : rels.filter(r => r.status === "Published");
      res.json(filtered);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch relationships" });
    }
  });

  app.get("/api/people/:id/family-tree", async (req, res) => {
    try {
      const person = await storage.getPerson(parseInt(req.params.id));
      if (!person) return res.status(404).json({ message: "Person not found" });
      if (person.status !== "Published" && !req.session.employeeId) return res.status(404).json({ message: "Person not found" });
      const depth = Math.min(parseInt(req.query.depth as string) || 2, 5);
      const familyTypes = ["parent_of", "child_of", "spouse_of", "sibling_of"];
      const visited = new Set<number>([person.id]);
      const peopleResult: Person[] = [person];
      const relsResult: Relationship[] = [];
      let frontier = [person.id];
      for (let d = 0; d < depth && frontier.length > 0; d++) {
        const nextFrontier: number[] = [];
        for (const pid of frontier) {
          const rels = await storage.getRelationshipsForEntity("person", pid);
          const familyRels = rels.filter(r =>
            familyTypes.includes(r.relationshipType) && r.fromType === "person" && r.toType === "person" &&
            (req.session.employeeId || r.status === "Published")
          );
          for (const rel of familyRels) {
            const alreadyAdded = relsResult.some(er => er.id === rel.id);
            if (!alreadyAdded) relsResult.push(rel);
            const otherId = rel.fromId === pid ? rel.toId : rel.fromId;
            if (!visited.has(otherId)) {
              visited.add(otherId);
              const otherPerson = await storage.getPerson(otherId);
              if (otherPerson && (req.session.employeeId || otherPerson.status === "Published")) {
                peopleResult.push(otherPerson);
                nextFrontier.push(otherId);
              }
            }
          }
        }
        frontier = nextFrontier;
      }
      res.json({ people: peopleResult, relationships: relsResult });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch family tree" });
    }
  });

  app.get("/api/relationships", async (req, res) => {
    try {
      if (req.session.employeeId) {
        res.json(await storage.getAllRelationships());
      } else {
        res.json(await storage.getPublishedRelationships());
      }
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch relationships" });
    }
  });

  // ===== PUBLIC PODCAST ENDPOINTS =====

  app.get("/api/holes/:slug/podcasts", async (req, res) => {
    try {
      const hole = await storage.getHoleBySlug(req.params.slug);
      if (!hole || hole.status !== "Published") return res.status(404).json({ message: "Rabbit hole not found" });
      const episodes = await storage.getPublishedEpisodesForHole(hole.id);
      const sponsoredSlot = await storage.getActiveSponsoredSlotForHole(hole.id);
      res.json({ episodes, sponsoredSlot });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch podcasts" });
    }
  });

  // =========================================
  // LIVE MODULE - Admin Routes
  // =========================================

  // -- Creators Admin --
  app.get("/api/admin/creators", requireEmployee, requireRole("Admin", "Editor"), async (_req, res) => {
    try { res.json(await storage.getAllCreators()); }
    catch { res.status(500).json({ message: "Failed to fetch creators" }); }
  });

  app.post("/api/admin/creators", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const parsed = insertCreatorSchema.parse(req.body);
      const creator = await storage.createCreator(parsed);
      res.status(201).json(creator);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: err.errors.map(e => e.message).join(", ") });
      res.status(500).json({ message: "Failed to create creator" });
    }
  });

  app.put("/api/admin/creators/:id", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const creator = await storage.updateCreator(id, req.body);
      if (!creator) return res.status(404).json({ message: "Creator not found" });
      res.json(creator);
    } catch { res.status(500).json({ message: "Failed to update creator" }); }
  });

  app.delete("/api/admin/creators/:id", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      await storage.deleteCreator(parseInt(req.params.id));
      res.json({ success: true });
    } catch { res.status(500).json({ message: "Failed to delete creator" }); }
  });

  // -- Streams Admin --
  app.get("/api/admin/streams", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const creatorId = req.query.creatorId ? parseInt(req.query.creatorId as string) : null;
      const all = creatorId ? await storage.getStreamsByCreator(creatorId) : await storage.getAllStreams();
      res.json(all);
    } catch { res.status(500).json({ message: "Failed to fetch streams" }); }
  });

  app.post("/api/admin/streams", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const parsed = insertStreamSchema.parse({ ...req.body, createdByEmployeeId: req.employee!.id, updatedByEmployeeId: req.employee!.id });
      const stream = await storage.createStream(parsed);
      res.status(201).json(stream);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: err.errors.map(e => e.message).join(", ") });
      res.status(500).json({ message: "Failed to create stream" });
    }
  });

  app.put("/api/admin/streams/:id", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getStreamById(id);
      if (!existing) return res.status(404).json({ message: "Stream not found" });
      const role = req.employee!.role;
      if (req.body.status === "Published" && role !== "Admin") {
        return res.status(403).json({ message: "Only Admin can publish streams" });
      }
      if (req.body.status === "Review" && existing.status !== "Draft" && role !== "Admin") {
        return res.status(403).json({ message: "Can only submit Draft streams for Review" });
      }
      const stream = await storage.updateStream(id, { ...req.body, updatedByEmployeeId: req.employee!.id });
      res.json(stream);
    } catch { res.status(500).json({ message: "Failed to update stream" }); }
  });

  app.delete("/api/admin/streams/:id", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      await storage.deleteStream(parseInt(req.params.id));
      res.json({ success: true });
    } catch { res.status(500).json({ message: "Failed to delete stream" }); }
  });

  // -- Stream Replays Admin --
  app.get("/api/admin/replays/:streamId", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try { res.json(await storage.getReplaysByStream(parseInt(req.params.streamId))); }
    catch { res.status(500).json({ message: "Failed to fetch replays" }); }
  });

  app.post("/api/admin/replays", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const parsed = insertStreamReplaySchema.parse(req.body);
      const replay = await storage.createReplay(parsed);
      res.status(201).json(replay);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: err.errors.map(e => e.message).join(", ") });
      res.status(500).json({ message: "Failed to create replay" });
    }
  });

  app.delete("/api/admin/replays/:id", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      await storage.deleteReplay(parseInt(req.params.id));
      res.json({ success: true });
    } catch { res.status(500).json({ message: "Failed to delete replay" }); }
  });

  // -- Chat Moderation Admin --
  app.get("/api/admin/chat/:streamId", requireEmployee, requireRole("Admin", "Editor", "Moderator"), async (req, res) => {
    try { res.json(await storage.getAllChatMessages(parseInt(req.params.streamId))); }
    catch { res.status(500).json({ message: "Failed to fetch chat messages" }); }
  });

  app.post("/api/admin/chat/:messageId/delete", requireEmployee, requireRole("Admin", "Editor", "Moderator"), async (req, res) => {
    try {
      await storage.deleteChatMessage(parseInt(req.params.messageId), req.employee!.id);
      await storage.createModerationAction({
        streamId: parseInt(req.body.streamId),
        employeeId: req.employee!.id,
        actionType: "delete_message",
        targetUsername: req.body.targetUsername || null,
        targetUserId: req.body.targetUserId || null,
        reason: req.body.reason || "",
      });
      res.json({ success: true });
    } catch { res.status(500).json({ message: "Failed to delete message" }); }
  });

  app.post("/api/admin/chat/moderate", requireEmployee, requireRole("Admin", "Editor", "Moderator"), async (req, res) => {
    try {
      const action = await storage.createModerationAction({
        streamId: req.body.streamId,
        employeeId: req.employee!.id,
        actionType: req.body.actionType,
        targetUsername: req.body.targetUsername || null,
        targetUserId: req.body.targetUserId || null,
        reason: req.body.reason || "",
      });
      res.json(action);
    } catch { res.status(500).json({ message: "Failed to create moderation action" }); }
  });

  app.get("/api/admin/chat/moderation/:streamId", requireEmployee, requireRole("Admin", "Editor", "Moderator"), async (req, res) => {
    try { res.json(await storage.getModerationActions(parseInt(req.params.streamId))); }
    catch { res.status(500).json({ message: "Failed to fetch moderation actions" }); }
  });

  // =========================================
  // LIVE MODULE - Public Routes
  // =========================================

  app.get("/api/live", async (_req, res) => {
    try {
      const live = await storage.getLiveStreams();
      const upcoming = await storage.getUpcomingStreams();
      const ended = await storage.getEndedStreams();
      const allCreators = await storage.getAllCreators();
      const creatorMap = Object.fromEntries(allCreators.filter(c => c.isActive).map(c => [c.id, c]));
      const enrich = (s: any) => ({ ...s, creator: creatorMap[s.creatorId] || null });
      res.json({
        live: live.map(enrich),
        upcoming: upcoming.map(enrich),
        replays: ended.map(enrich),
        featured: live.length > 0 ? live.slice(0, 1).map(enrich) : upcoming.slice(0, 1).map(enrich),
      });
    } catch { res.status(500).json({ message: "Failed to fetch live data" }); }
  });

  app.get("/api/channels/:handle", async (req, res) => {
    try {
      const creator = await storage.getCreatorByHandle(req.params.handle);
      if (!creator || !creator.isActive) return res.status(404).json({ message: "Channel not found" });
      const allStreams = await storage.getStreamsByCreator(creator.id);
      const published = allStreams.filter(s => s.status === "Published");
      res.json({
        creator,
        live: published.filter(s => s.streamState === "live"),
        upcoming: published.filter(s => s.streamState === "upcoming"),
        replays: published.filter(s => s.streamState === "ended"),
      });
    } catch { res.status(500).json({ message: "Failed to fetch channel" }); }
  });

  app.get("/api/streams/:id", async (req, res) => {
    try {
      const stream = await storage.getStreamById(parseInt(req.params.id));
      if (!stream || stream.status !== "Published") return res.status(404).json({ message: "Stream not found" });
      const creator = await storage.getCreatorById(stream.creatorId);
      if (stream.visibility === "premium") {
        const userId = (req.session as any).userId;
        if (!userId) return res.json({ stream: { ...stream, embedUrl: "" }, creator, premium: true, hasAccess: false });
        const user = await storage.getUserById(userId);
        if (!user || user.plan !== "Pro" || user.subscriptionStatus !== "active") {
          return res.json({ stream: { ...stream, embedUrl: "" }, creator, premium: true, hasAccess: false });
        }
      }
      res.json({ stream, creator, premium: stream.visibility === "premium", hasAccess: true });
    } catch { res.status(500).json({ message: "Failed to fetch stream" }); }
  });

  app.get("/api/replays/:streamId", async (req, res) => {
    try {
      const stream = await storage.getStreamById(parseInt(req.params.streamId));
      if (!stream || stream.status !== "Published" || stream.streamState !== "ended") return res.status(404).json({ message: "Replay not found" });
      const creator = await storage.getCreatorById(stream.creatorId);
      const replays = await storage.getReplaysByStream(stream.id);
      if (stream.visibility === "premium") {
        const userId = (req.session as any).userId;
        if (!userId) return res.json({ stream: { ...stream, embedUrl: "" }, creator, replays: [], premium: true, hasAccess: false });
        const user = await storage.getUserById(userId);
        if (!user || user.plan !== "Pro" || user.subscriptionStatus !== "active") {
          return res.json({ stream: { ...stream, embedUrl: "" }, creator, replays: [], premium: true, hasAccess: false });
        }
      }
      res.json({ stream, creator, replays, premium: stream.visibility === "premium", hasAccess: true });
    } catch { res.status(500).json({ message: "Failed to fetch replay" }); }
  });

  // -- Chat Public Routes --
  app.get("/api/chat/:streamId", async (req, res) => {
    try {
      const stream = await storage.getStreamById(parseInt(req.params.streamId));
      if (!stream || stream.status !== "Published" || !stream.chatEnabled) return res.json([]);
      const messages = await storage.getChatMessages(stream.id, 100);
      res.json(messages.reverse());
    } catch { res.status(500).json({ message: "Failed to fetch chat" }); }
  });

  app.post("/api/chat/:streamId", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) return res.status(401).json({ message: "Login required to chat" });
      const user = await storage.getUserById(userId);
      if (!user) return res.status(401).json({ message: "User not found" });
      const stream = await storage.getStreamById(parseInt(req.params.streamId));
      if (!stream || stream.status !== "Published" || !stream.chatEnabled) return res.status(400).json({ message: "Chat not available" });
      if (stream.visibility === "premium" && (user.plan !== "Pro" || user.subscriptionStatus !== "active")) {
        return res.status(403).json({ message: "Premium subscription required to chat in this stream" });
      }
      if (!req.body.message || req.body.message.trim().length === 0) return res.status(400).json({ message: "Message required" });
      const msg = await storage.createChatMessage({
        streamId: stream.id,
        userId: user.id,
        usernameDisplay: user.name || user.email.split("@")[0],
        message: req.body.message.trim().slice(0, 500),
      });
      res.status(201).json(msg);
    } catch { res.status(500).json({ message: "Failed to send message" }); }
  });

  // ===== LIBRARY ROUTES =====

  app.get("/api/library/works", async (_req: Request, res: Response) => {
    try {
      const works = await storage.getLibraryWorks();
      res.json(works);
    } catch { res.status(500).json({ message: "Failed to fetch library works" }); }
  });

  app.get("/api/library/works/:workSlug/books", async (req: Request, res: Response) => {
    try {
      const books = await storage.getLibraryBooksByWorkSlug(req.params.workSlug as string);
      res.json(books);
    } catch { res.status(500).json({ message: "Failed to fetch books" }); }
  });

  app.get("/api/library/works/:workSlug/books/:bookSlug/chapters/:chapterNumber", async (req: Request, res: Response) => {
    try {
      const book = await storage.getLibraryBookBySlug(req.params.workSlug as string, req.params.bookSlug as string);
      if (!book) return res.status(404).json({ message: "Book not found" });
      const chapterNumber = parseInt(req.params.chapterNumber as string);
      if (isNaN(chapterNumber)) return res.status(400).json({ message: "Invalid chapter number" });
      const chapter = await storage.getLibraryChapter(book.id, chapterNumber);
      if (!chapter) return res.status(404).json({ message: "Chapter not found" });
      const verses = await storage.getLibraryVersesByChapterId(chapter.id);
      res.json({ book, chapter, verses });
    } catch { res.status(500).json({ message: "Failed to fetch chapter" }); }
  });

  app.get("/api/library/search", async (req: Request, res: Response) => {
    try {
      const workSlug = (req.query.workSlug as string) || "bible-kjv";
      const q = (req.query.q as string) || "";
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      if (!q || q.length < 2) return res.json([]);
      const results = await storage.searchLibrary(workSlug, q, limit);
      res.json(results);
    } catch { res.status(500).json({ message: "Search failed" }); }
  });

  app.get("/api/library/verse-preview", async (req: Request, res: Response) => {
    try {
      const bookSlug = req.query.bookSlug as string;
      const chapterNumber = parseInt(req.query.chapter as string);
      const verseNumber = parseInt(req.query.verse as string);
      const workSlug = (req.query.workSlug as string) || "bible-kjv";
      if (!bookSlug || isNaN(chapterNumber) || isNaN(verseNumber)) {
        return res.status(400).json({ message: "bookSlug, chapter, verse required" });
      }
      const preview = await storage.getVersePreview(bookSlug, chapterNumber, verseNumber, workSlug);
      if (!preview) return res.status(404).json({ message: "Verse not found" });
      res.json(preview);
    } catch { res.status(500).json({ message: "Preview failed" }); }
  });

  // ===== PUBLIC TIMELINE ENDPOINTS =====

  app.get("/api/timeline", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const tag = req.query.tag as string | undefined;
      const investigationId = req.query.investigationId ? parseInt(req.query.investigationId as string) : undefined;
      const items = await storage.getGlobalTimelineItems("Published", limit, offset, tag, investigationId);
      res.json(items);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch timeline" });
    }
  });

  app.get("/api/timeline/tags", async (_req, res) => {
    try {
      const items = await storage.getGlobalTimelineItems("Published");
      const tagSet = new Set<string>();
      for (const item of items) {
        const tags = item.tags as string[];
        if (tags) tags.forEach(t => tagSet.add(t));
      }
      res.json(Array.from(tagSet).sort());
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  // ===== ADMIN TIMELINE ENDPOINTS =====

  app.get("/api/admin/timeline", requireEmployee, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const tag = req.query.tag as string | undefined;
      const investigationId = req.query.investigationId ? parseInt(req.query.investigationId as string) : undefined;
      const items = await storage.getGlobalTimelineItems(status, limit, offset, tag, investigationId);
      res.json(items);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch timeline items" });
    }
  });

  app.post("/api/admin/timeline", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const parsed = insertGlobalTimelineItemSchema.parse({ ...req.body, createdBy: getEditorName(req), updatedBy: getEditorName(req) });
      const item = await storage.createGlobalTimelineItem(parsed);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      res.status(500).json({ message: "Failed to create timeline item" });
    }
  });

  app.put("/api/admin/timeline/:id", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.updateGlobalTimelineItem(id, { ...req.body, updatedBy: getEditorName(req) });
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    } catch (err) {
      res.status(500).json({ message: "Failed to update timeline item" });
    }
  });

  app.delete("/api/admin/timeline/:id", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ok = await storage.deleteGlobalTimelineItem(id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete timeline item" });
    }
  });

  app.post("/api/admin/timeline/promote", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const { entryId } = req.body;
      if (!entryId) return res.status(400).json({ message: "entryId is required" });
      const allItems = await db.select().from(timelineEntries).where(eq(timelineEntries.id, parseInt(entryId)));
      if (allItems.length === 0) return res.status(404).json({ message: "Timeline entry not found" });
      const entry = allItems[0];

      const globalItem = await storage.createGlobalTimelineItem({
        date: entry.date,
        title: entry.title,
        summary: entry.description || "",
        linkType: "timeline_entry",
        linkId: String(entry.id),
        relatedInvestigationId: entry.investigationId,
        tags: [],
        status: "Draft",
        sortPriority: 0,
        createdBy: getEditorName(req),
        updatedBy: getEditorName(req),
      });
      res.status(201).json(globalItem);
    } catch (err) {
      res.status(500).json({ message: "Failed to promote timeline entry" });
    }
  });

  app.get("/api/admin/timeline-entries/:investigationId", requireEmployee, async (req, res) => {
    try {
      const investigationId = parseInt(req.params.investigationId);
      const entries = await storage.getTimelineEntries(investigationId);
      res.json(entries);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch timeline entries" });
    }
  });

  app.post("/api/admin/timeline-entries", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const parsed = insertTimelineEntrySchema.parse({ ...req.body, createdBy: getEditorName(req), updatedBy: getEditorName(req) });
      const entry = await storage.createTimelineEntry(parsed);
      res.status(201).json(entry);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      res.status(500).json({ message: "Failed to create timeline entry" });
    }
  });

  app.put("/api/admin/timeline-entries/:id", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const entry = await storage.updateTimelineEntry(id, { ...req.body, updatedBy: getEditorName(req) });
      if (!entry) return res.status(404).json({ message: "Not found" });
      res.json(entry);
    } catch (err) {
      res.status(500).json({ message: "Failed to update timeline entry" });
    }
  });

  app.delete("/api/admin/timeline-entries/:id", requireEmployee, requireRole("Admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ok = await storage.deleteTimelineEntry(id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete timeline entry" });
    }
  });

  // ===== MAP ITEMS (PUBLIC) =====

  const mapQuerySchema = z.object({
    minLat: z.coerce.number().min(-90).max(90),
    maxLat: z.coerce.number().min(-90).max(90),
    minLng: z.coerce.number().min(-180).max(180),
    maxLng: z.coerce.number().min(-180).max(180),
    type: z.enum(["investigation", "person", "timeline"]).optional(),
    tag: z.string().optional(),
  });

  app.get("/api/map/items", async (req, res) => {
    try {
      const parsed = mapQuerySchema.parse(req.query);
      const items = await storage.getMapItems(parsed.minLat, parsed.maxLat, parsed.minLng, parsed.maxLng, {
        type: parsed.type,
        tag: parsed.tag,
      });
      res.json(items);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: "Invalid query parameters", errors: err.errors });
      res.status(500).json({ message: "Failed to fetch map items" });
    }
  });

  return httpServer;
}
