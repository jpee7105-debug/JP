import { beforeAll, afterAll } from "vitest";
import type { Server } from "http";

// ── TEST DATABASE ISOLATION ────────────────────────────────────────────────
// Tests must never run against the development or production database.
// Set TEST_DATABASE_URL in Replit Secrets to an isolated test PostgreSQL database.
// Run: DATABASE_URL=$TEST_DATABASE_URL npm run db:push  (initialises schema)
if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    "[test setup] TEST_DATABASE_URL environment variable is required to run tests. " +
    "Create a separate test database and add TEST_DATABASE_URL to Replit Secrets. " +
    "This prevents tests from modifying development or production data."
  );
}

// Override DATABASE_URL before any server module is imported.
// All server code (Drizzle, connect-pg-simple) reads from process.env.DATABASE_URL.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

// Required for server startup — use test-specific values so tests are deterministic
process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? "test-session-secret-minimum-32-chars-abcdef!!";
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "TestAdminPassword!123";
process.env.BILLING_ENABLED = "false";
process.env.NODE_ENV = "test";

let server: Server;

beforeAll(async () => {
  // Dynamic import happens AFTER env overrides — server reads patched DATABASE_URL
  const { createApp } = await import("../server/index");
  server = await createApp();
  (global as any).__testServer = server;
}, 30000);

afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
