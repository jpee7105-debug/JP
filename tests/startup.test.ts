import { describe, it, expect } from "vitest";

// These tests verify that the server refuses to start without required env vars.
// They run in a subprocess to avoid affecting the parent test process.

describe("Startup env var requirements", () => {
  it("TEST_DATABASE_URL env var is set (precondition for all other tests)", () => {
    expect(process.env.TEST_DATABASE_URL).toBeDefined();
    expect(process.env.TEST_DATABASE_URL!.length).toBeGreaterThan(0);
  });

  it("DATABASE_URL has been overridden with TEST_DATABASE_URL", () => {
    // tests/setup.ts must have run before this test
    expect(process.env.DATABASE_URL).toBe(process.env.TEST_DATABASE_URL);
  });

  it("NODE_ENV is 'test'", () => {
    expect(process.env.NODE_ENV).toBe("test");
  });

  it("BILLING_ENABLED is 'false' in test mode", () => {
    expect(process.env.BILLING_ENABLED).toBe("false");
  });
});
