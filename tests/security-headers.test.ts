import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../server/index";

describe("Helmet security headers", () => {
  it("includes X-Content-Type-Options: nosniff", async () => {
    const res = await request(app).get("/api/holes");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("does not include X-Powered-By header", async () => {
    const res = await request(app).get("/api/holes");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("includes Content-Security-Policy header", async () => {
    const res = await request(app).get("/api/holes");
    expect(res.headers["content-security-policy"]).toBeDefined();
  });

  it("includes X-Frame-Options header", async () => {
    const res = await request(app).get("/api/holes");
    expect(res.headers["x-frame-options"]).toBeDefined();
  });
});
