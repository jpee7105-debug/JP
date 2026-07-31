import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const PgSession = connectPgSimple(session);
const sessionPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

declare module "express-session" {
  interface SessionData {
    userId: string;
    employeeId: string;
  }
}

const isDev = process.env.NODE_ENV !== "production";

// ── Helmet security headers (Item 10) ──────────────────────────────────────
// Applied as the very first middleware so all responses carry security headers.
// CSP is pre-configured for Leaflet tiles, Vite HMR, Tailwind inline styles.
// crossOriginEmbedderPolicy disabled — Leaflet requires cross-origin resources.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          // unsafe-eval required by Vite in development only
          ...(isDev ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        // unsafe-inline required by Tailwind CSS and shadcn/ui component styles
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://*.basemaps.cartocdn.com",  // Leaflet CartoDB dark tiles
          "https://*.tile.openstreetmap.org", // Fallback OSM tiles
        ],
        connectSrc: [
          "'self'",
          ...(isDev ? ["ws:", "wss:"] : []),  // Vite HMR WebSocket
        ],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        ...(isDev ? {} : { upgradeInsecureRequests: [] }),
      },
    },
    strictTransportSecurity: isDev
      ? false
      : { maxAge: 63072000, includeSubDomains: true, preload: true },
    crossOriginEmbedderPolicy: false,
  })
);

// ── Rate limiters (Item 9) ──────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 20,                   // 20 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // successful logins don't count toward limit
  message: { message: "Too many attempts. Please try again in 15 minutes." },
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1-hour window
  max: 10,                   // 10 signups per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many registrations from this address. Please try again later." },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", signupLimiter);
app.use("/api/admin/login", authLimiter);

// ── Trusted-origin CSRF protection (Item 5) ────────────────────────────────
// For all state-changing methods, verifies the Origin (or Referer) header
// matches the application's own domain. Stateless — no token management.
// Safe methods (GET, HEAD, OPTIONS) are exempt.
// In development, requests with no Origin header are allowed (curl / API clients).
// In production, an Origin header is required on all state-changing requests.
function trustedOriginMiddleware(req: Request, res: Response, next: NextFunction) {
  const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
  if (SAFE_METHODS.includes(req.method)) return next();

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.headers.host;

  // Build the set of allowed origins from the runtime environment
  const allowedOrigins = new Set<string>();
  if (host) {
    allowedOrigins.add(`http://${host}`);
    allowedOrigins.add(`https://${host}`);
  }
  const replitDomains = process.env.REPLIT_DOMAINS;
  if (replitDomains) {
    for (const domain of replitDomains.split(",")) {
      allowedOrigins.add(`https://${domain.trim()}`);
    }
  }

  // Allow requests with no origin header only in development
  if (!origin && !referer) {
    if (isDev) return next();
    return res.status(403).json({ message: "Origin header required" });
  }

  let requestOrigin: string;
  try {
    requestOrigin = origin || new URL(referer!).origin;
  } catch {
    return res.status(403).json({ message: "Forbidden: invalid origin" });
  }

  const isAllowed = Array.from(allowedOrigins).some((allowed) =>
    requestOrigin === allowed || requestOrigin.startsWith(allowed)
  );

  if (!isAllowed) {
    console.warn(`[csrf] Rejected request from origin: ${requestOrigin}`);
    return res.status(403).json({ message: "Forbidden: untrusted origin" });
  }

  next();
}

app.use(trustedOriginMiddleware);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

const isProduction = process.env.NODE_ENV === "production";
// Always trust the first proxy — Replit routes all traffic through a proxy
// in both development and production, setting X-Forwarded-For on every request.
// Without this, express-rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set("trust proxy", 1);
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error(
    "[startup] SESSION_SECRET environment variable is required in all environments. " +
    "Set it via Replit Secrets. Minimum 32 random characters."
  );
}

app.use(
  session({
    store: new PgSession({
      pool: sessionPool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

/**
 * Create and configure the application.
 * Exported so the test suite can import it without starting an HTTP server.
 * In test mode (NODE_ENV=test), Vite static middleware is not attached.
 */
export async function createApp() {
  app.get("/__repl", (_req, res) => {
    res.sendStatus(200);
  });

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else if (process.env.NODE_ENV !== "test") {
    // Skip Vite in test mode — it requires a browser environment
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  return httpServer;
}

export { app };

// Auto-start when not in test mode
if (process.env.NODE_ENV !== "test") {
  createApp().then((server) => {
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen(
      { port, host: "0.0.0.0", reusePort: true },
      () => { log(`serving on port ${port}`); },
    );
  });
}
