import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../server/index";

describe("Trusted-origin CSRF protection", () => {
  it("POST with correct Origin header is allowed", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", "http://localhost:5000")
      .send({ email: "nobody@example.com", password: "whatever" });
    // 401 (wrong credentials) means the request reached the handler — CSRF passed
    expect(res.status).toBe(401);
  });

  it("POST with mismatched Origin returns 403", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", "https://evil.example.com")
      .send({ email: "nobody@example.com", password: "whatever" });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain("untrusted origin");
  });

  it("POST with no Origin header is allowed in test (non-production) mode", async () => {
    // NODE_ENV=test counts as non-production, so no-origin requests pass
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "whatever" });
    // 401 means request reached the handler
    expect(res.status).toBe(401);
  });

  it("GET with no Origin header is always allowed (safe method)", async () => {
    const res = await request(app).get("/api/holes");
    // 200 or 500, but NOT 403
    expect(res.status).not.toBe(403);
  });

  it("PUT with mismatched Origin returns 403", async () => {
    const res = await request(app)
      .put("/api/admin/holes/1")
      .set("Origin", "https://attacker.io")
      .send({ title: "hacked" });
    expect(res.status).toBe(403);
  });
});
