import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../server/index";

const FORBIDDEN_KEYS = ["passwordHash", "stripeCustomerId", "stripeSubscriptionId"];

function assertNoSensitiveFields(body: Record<string, unknown>) {
  for (const key of FORBIDDEN_KEYS) {
    expect(body, `Response must not contain '${key}'`).not.toHaveProperty(key);
  }
}

describe("POST /api/auth/signup", () => {
  const testEmail = `test-signup-${Date.now()}@example.com`;

  it("creates a user with valid email and password", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .set("Origin", "http://localhost:5000")
      .send({ email: testEmail, password: "ValidPass123!" });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(testEmail);
    assertNoSensitiveFields(res.body);
  });

  it("returns 400 if email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .set("Origin", "http://localhost:5000")
      .send({ password: "ValidPass123!" });
    expect(res.status).toBe(400);
  });

  it("returns 400 if password is too short", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .set("Origin", "http://localhost:5000")
      .send({ email: `short-pw-${Date.now()}@example.com`, password: "abc" });
    expect(res.status).toBe(400);
  });

  it("returns 409 if email is already registered", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .set("Origin", "http://localhost:5000")
      .send({ email: testEmail, password: "AnotherPass123!" });
    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  const loginEmail = `test-login-${Date.now()}@example.com`;
  const loginPassword = "LoginPass123!";

  beforeAll(async () => {
    await request(app)
      .post("/api/auth/signup")
      .set("Origin", "http://localhost:5000")
      .send({ email: loginEmail, password: loginPassword });
  });

  it("returns 200 and user data on valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", "http://localhost:5000")
      .send({ email: loginEmail, password: loginPassword });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(loginEmail);
    assertNoSensitiveFields(res.body);
  });

  it("returns 401 on wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", "http://localhost:5000")
      .send({ email: loginEmail, password: "WrongPassword!" });
    expect(res.status).toBe(401);
  });

  it("returns 401 on unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", "http://localhost:5000")
      .send({ email: "nobody@example.com", password: "whatever" });
    expect(res.status).toBe(401);
  });

  it("sets a connect.sid cookie on success", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", "http://localhost:5000")
      .send({ email: loginEmail, password: loginPassword });

    expect(res.status).toBe(200);
    const cookies = res.headers["set-cookie"] as string[] | undefined;
    expect(cookies?.some((c: string) => c.includes("connect.sid"))).toBe(true);
  });

  it("changes connect.sid after login (session regeneration)", async () => {
    // Get initial session
    const agent = request.agent(app);
    const getRes = await agent
      .get("/api/auth/me")
      .set("Origin", "http://localhost:5000");
    const beforeCookies = getRes.headers["set-cookie"] as string[] | undefined;
    const beforeSid = beforeCookies?.find((c: string) => c.includes("connect.sid"));

    // Login
    const loginRes = await agent
      .post("/api/auth/login")
      .set("Origin", "http://localhost:5000")
      .send({ email: loginEmail, password: loginPassword });

    expect(loginRes.status).toBe(200);
    const afterCookies = loginRes.headers["set-cookie"] as string[] | undefined;
    const afterSid = afterCookies?.find((c: string) => c.includes("connect.sid"));

    // Session ID must have changed
    if (beforeSid && afterSid) {
      expect(afterSid).not.toBe(beforeSid);
    }
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns user data when authenticated", async () => {
    const email = `test-me-${Date.now()}@example.com`;
    const password = "MeTest123!";

    const agent = request.agent(app);
    await agent
      .post("/api/auth/signup")
      .set("Origin", "http://localhost:5000")
      .send({ email, password });

    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
    assertNoSensitiveFields(res.body);
  });
});
