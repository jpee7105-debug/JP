import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCommentSchema, insertDepthNodeSchema, insertClaimSchema, insertSourceSchema, insertCategorySchema, insertRabbitHoleSchema, insertMediaSchema, insertPodcastSchema, insertPodcastEpisodeSchema, insertRabbitHolePodcastEpisodeSchema, insertSponsoredPodcastSlotSchema, insertCreatorSchema, insertStreamSchema, insertStreamReplaySchema, insertLiveChatMessageSchema, insertChatModerationActionSchema } from "@shared/schema";
import { ZodError } from "zod";
import bcrypt from "bcryptjs";
import type { Employee } from "@shared/schema";
import { autoSeedIfEmpty } from "./auto-seed";

declare global {
  namespace Express {
    interface Request {
      employee?: Employee;
    }
  }
}

type EmployeeRole = "Admin" | "Editor" | "Moderator";

async function requireEmployee(req: any, res: any, next: any) {
  if (!req.session.employeeId) {
    return res.status(401).json({ message: "Employee authentication required" });
  }
  const emp = await storage.getEmployeeById(req.session.employeeId);
  if (!emp || !emp.isActive) {
    return res.status(401).json({ message: "Employee account not found or deactivated" });
  }
  req.employee = emp;
  next();
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

  const empCount = await storage.getEmployeeCount();
  if (empCount === 0) {
    const defaultPassword = process.env.ADMIN_PASSWORD || "rabbithole2024";
    const passwordHash = await bcrypt.hash(defaultPassword, 12);
    await storage.createEmployee({
      email: "admin@rabbithole.io",
      passwordHash,
      name: "Admin",
      role: "Admin",
      isActive: true,
    });
    console.log(`[seed] Created default admin employee: admin@rabbithole.io (password: ${defaultPassword})`);
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
      req.session.employeeId = emp.id;
      const { passwordHash: _, ...safeEmp } = emp;
      res.json(safeEmp);
    } catch (err) {
      res.status(500).json({ message: "Failed to log in" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.employeeId = undefined;
    res.json({ message: "Logged out" });
  });

  app.get("/api/admin/me", async (req, res) => {
    if (!req.session.employeeId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const emp = await storage.getEmployeeById(req.session.employeeId);
    if (!emp || !emp.isActive) {
      return res.status(401).json({ message: "Employee not found or deactivated" });
    }
    const { passwordHash: _, ...safeEmp } = emp;
    res.json(safeEmp);
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
      req.session.userId = user.id;
      const { passwordHash: _, ...safeUser } = user;
      res.status(201).json(safeUser);
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
      req.session.userId = user.id;
      const { passwordHash: _, ...safeUser } = user;
      res.json(safeUser);
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
    const { passwordHash: _, ...safeUser } = user;
    res.json(safeUser);
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

      const FREE_PREVIEW_LIMIT = 2;
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
        res.json(nodes);
      } else {
        const preview = nodes.slice(0, FREE_PREVIEW_LIMIT);
        res.json(preview);
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
        previewLimit: hasFullAccess ? totalNodes : 2,
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
      const safe = emps.map(({ passwordHash, ...rest }) => rest);
      res.json(safe);
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
      const { passwordHash: _, ...safeEmp } = emp;
      await storage.createAuditLog({
        holeId: null as any, entityType: "employee", entityId: null as any,
        action: "create", editorName: getEditorName(req),
        changes: { email: emp.email, name: emp.name, role: emp.role },
      });
      res.status(201).json(safeEmp);
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
      const { passwordHash: _, ...safeEmp } = emp;
      await storage.createAuditLog({
        holeId: null as any, entityType: "employee", entityId: null as any,
        action: "update", editorName: getEditorName(req),
        changes: { employeeEmail: emp.email, ...updateData },
      });
      res.json(safeEmp);
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

  return httpServer;
}
