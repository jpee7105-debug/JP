import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../server/index";

describe("Pagination validation — GET /api/timeline", () => {
  it("returns 400 for limit=0", async () => {
    const res = await request(app).get("/api/timeline?limit=0");
    expect(res.status).toBe(400);
  });

  it("returns 400 for limit=101 (over max)", async () => {
    const res = await request(app).get("/api/timeline?limit=101");
    expect(res.status).toBe(400);
  });

  it("returns 400 for negative offset", async () => {
    const res = await request(app).get("/api/timeline?offset=-1");
    expect(res.status).toBe(400);
  });

  it("returns 200 for valid limit and offset", async () => {
    const res = await request(app).get("/api/timeline?limit=20&offset=0");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("returns 200 with NaN limit (defaults to 20)", async () => {
    const res = await request(app).get("/api/timeline?limit=abc");
    expect(res.status).toBe(200);
  });
});

describe("Pagination validation — GET /api/library/search", () => {
  it("returns 400 for negative limit", async () => {
    const res = await request(app).get("/api/library/search?q=test&limit=-5");
    expect(res.status).toBe(400);
  });

  it("returns 400 for limit=0", async () => {
    const res = await request(app).get("/api/library/search?q=test&limit=0");
    expect(res.status).toBe(400);
  });

  it("returns 400 for limit over 100", async () => {
    const res = await request(app).get("/api/library/search?q=test&limit=101");
    expect(res.status).toBe(400);
  });
});
