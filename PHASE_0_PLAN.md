# Rabbit Hole — Phase 0 Implementation Plan
**Goal:** Safely stabilise the existing codebase for V2 development.  
**Constraint:** No new features. Security fixes, broken-flow repairs, and cleanup only.  
**Source:** Based on findings in `PROJECT_AUDIT.md`.  
**Status:** Plan only — no code changed yet.

---

## Prerequisites Checklist

Run these before starting any item to capture a clean baseline:

```bash
npm run check          # TypeScript must pass before changes
npm run build          # Full production build must succeed
```

If either fails before changes begin, that failure is pre-existing and must be noted in the git commit for each item so it is not attributed to Phase 0 work.

---

## Item 1 — Remove Default Admin Password from Console Output

### Problem
`server/routes.ts:64–73`

```ts
// CURRENT — DANGEROUS
const defaultPassword = process.env.ADMIN_PASSWORD || "rabbithole2024";
// ...
console.log(`[seed] Created default admin employee: admin@rabbithole.io (password: ${defaultPassword})`);
```

Two issues:
1. The hardcoded fallback `"rabbithole2024"` is a publicly known credential. If `ADMIN_PASSWORD` is not set in production, attackers can log in immediately.
2. The password value (whether from env var or fallback) is logged to stdout. Server logs are often stored and accessible to many parties.

### Files Affected
| File | Lines | Change |
|---|---|---|
| `server/routes.ts` | 64–73 | Replace password seeding logic |

### Risk Level
**LOW** — Logic change only. No schema change. The admin account still gets created; it just no longer leaks credentials and now requires the env var in production.

### Proposed Implementation

Replace lines 64–73 with this logic:

```ts
const isProduction = process.env.NODE_ENV === "production";
const defaultPassword = process.env.ADMIN_PASSWORD;

if (!defaultPassword && isProduction) {
  // Hard fail in production — do not create an account with a known password
  throw new Error(
    "[startup] ADMIN_PASSWORD environment variable is required in production. " +
    "Set it via Replit Secrets before deploying."
  );
}

const adminPassword = defaultPassword || "rabbithole2024";
const passwordHash = await bcrypt.hash(adminPassword, 12);

await storage.createEmployee({
  email: "admin@rabbithole.io",
  passwordHash,
  name: "Admin",
  role: "Admin",
  isActive: true,
});

if (isProduction) {
  // In production, never log credentials. Just confirm creation.
  console.log("[seed] Default admin account created. Use the configured ADMIN_PASSWORD to log in.");
} else {
  // In development, warn loudly but do not print the value
  console.warn("[seed] ⚠️  Admin account created with ADMIN_PASSWORD (or dev fallback). Check your .env or Replit Secrets.");
}
```

### How to Test
1. **Development (no env var set):** Start with `npm run dev`. Confirm console shows the warning WITHOUT printing a password value. Confirm login to `/admin` works with `rabbithole2024`.
2. **Production simulation:** Set `NODE_ENV=production` without `ADMIN_PASSWORD`. Confirm server throws startup error and refuses to start.
3. **Production simulation (correct):** Set `NODE_ENV=production` and `ADMIN_PASSWORD=MyStrongPassword123`. Confirm server starts, console shows creation message without the password, and login works.
4. **Idempotency:** Run twice with employees already existing — confirm the seeding block is skipped entirely (it is gated on `empCount === 0`).

### Database Migration Required
**No.** This changes startup behaviour only.

---

## Item 2 — Regenerate Sessions After Successful Login

### Problem
Three login handlers assign a user/employee ID to the **existing** session object without first regenerating the session ID. This creates a session fixation vulnerability: an attacker who can set or observe a victim's pre-login session cookie retains access to that session after the victim authenticates.

**Affected handlers in `server/routes.ts`:**

| Handler | Line | Session field set |
|---|---|---|
| `POST /api/admin/login` | 100 | `req.session.employeeId = emp.id` |
| `POST /api/auth/signup` | 151 | `req.session.userId = user.id` |
| `POST /api/auth/login` | 174 | `req.session.userId = user.id` |

### Files Affected
| File | Lines | Change |
|---|---|---|
| `server/routes.ts` | ~96–102, ~148–153, ~172–176 | Wrap each session assignment in `req.session.regenerate()` |

### Risk Level
**LOW-MEDIUM.** The fix is well-established and straightforward. The only risk is forgetting to migrate session data inside the callback — the new session starts empty, so `employeeId`/`userId` must be set inside the regenerate callback, not before it.

### Proposed Implementation

The pattern to apply identically to all three handlers:

```ts
// BEFORE (vulnerable)
req.session.userId = user.id;
const { passwordHash: _, ...safeUser } = user;
res.json(safeUser);

// AFTER (safe)
req.session.regenerate((err) => {
  if (err) {
    return res.status(500).json({ message: "Failed to establish session" });
  }
  req.session.userId = user.id;
  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});
```

Apply the same pattern to the admin login (`req.session.employeeId = emp.id`) and the signup handler (`req.session.userId = user.id`).

**Important:** `express-session` `regenerate()` creates a brand-new session ID and an empty session object. Any session data that needs to survive (e.g. a pre-login redirect URL) must be manually copied inside the callback before assigning the new ID fields.

### How to Test
1. **Manual flow:** Log in as a user. Observe the `connect.sid` cookie value before and after login — it should change on successful login.
2. **Admin flow:** Log in to `/admin`. Observe the `connect.sid` cookie changes.
3. **Existing sessions:** Confirm that logout still works and that concurrent sessions from different browsers are not affected.
4. **Negative case:** Confirm that failed logins (wrong password) do NOT regenerate the session (no benefit to regenerating on failure).

### Database Migration Required
**No.** Session store table (`user_sessions`) is unaffected — `connect-pg-simple` creates the new session entry automatically on regenerate.

---

## Item 3 — Add Rate Limiting to Authentication Routes

### Problem
All three authentication endpoints (`POST /api/auth/login`, `POST /api/auth/signup`, `POST /api/admin/login`) have no rate limiting. This allows:
- Brute-force password attacks (unlimited login attempts)
- Account enumeration via timing differences
- Signup spam / throwaway account creation
- Admin credential stuffing

`express-rate-limit` is already listed in `script/build.ts`'s bundler allowlist (line 27) — it was anticipated but never installed.

### Files Affected
| File | Change |
|---|---|
| `package.json` | Add `express-rate-limit` dependency |
| `server/index.ts` | Import and apply rate limiters before route registration |

### Risk Level
**LOW.** Well-maintained, widely used Express middleware. The only operational risk is misconfiguring limits too aggressively and locking out legitimate users — addressed by setting generous but finite limits.

### Proposed Implementation

**Install:**
```bash
npm install express-rate-limit
```

**In `server/index.ts`**, add before `registerRoutes(...)`:

```ts
import rateLimit from "express-rate-limit";

// Auth rate limiters — applied before route registration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15-minute window
  max: 20,                    // 20 attempts per window per IP
  standardHeaders: true,      // Return RateLimit-* headers
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
  skipSuccessfulRequests: true, // Only count failed attempts
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1-hour window
  max: 10,                    // 10 signups per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many accounts created. Please try again later." },
});

// Apply before registerRoutes
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", signupLimiter);
app.use("/api/admin/login", authLimiter);
```

**Limits rationale:**
- 20 login attempts / 15 min per IP is enough for a legitimate user who misremembers their password; low enough to prevent brute-force at scale.
- `skipSuccessfulRequests: true` means successful logins don't count toward the limit — a user who logs in successfully is not blocked.
- The admin limiter uses the same profile as user login. Admin IPs are predictable (office/VPN), so 20 attempts / 15 min is still generous.

### How to Test
1. Send 21 consecutive failed `POST /api/auth/login` requests with the same IP. The 21st should return HTTP 429 with the rate-limit message.
2. Confirm the response includes `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` headers.
3. Successful login should reset the counter (due to `skipSuccessfulRequests: true`).
4. Confirm `POST /api/admin/login` also returns 429 after 20 bad attempts.
5. After the 15-minute window passes (or in tests, mock the clock), confirm requests succeed again.

### Database Migration Required
**No.**

---

## Item 4 — Add Helmet Security Headers

### Problem
Express does not set security headers by default and actively exposes `X-Powered-By: Express`. The following headers are missing:
- `Content-Security-Policy` — XSS protection
- `X-Frame-Options` — clickjacking protection
- `X-Content-Type-Options` — MIME sniffing protection
- `Strict-Transport-Security` — HTTPS enforcement
- `Referrer-Policy` — referrer leakage control
- `Permissions-Policy` — browser feature restrictions

`helmet` is not in `package.json` and is not in `script/build.ts`'s allowlist (must be added there too).

### Files Affected
| File | Change |
|---|---|
| `package.json` | Add `helmet` dependency |
| `server/index.ts` | Apply `helmet()` as first middleware |
| `script/build.ts` | Add `"helmet"` to the esbuild allowlist (line ~27) |

### Risk Level
**LOW-MEDIUM.** The main risk is `helmet`'s default Content Security Policy (CSP) blocking legitimate resources:
- Vite's HMR (WebSocket) in development
- Leaflet tile images from CartoDB (`*.basemaps.cartocdn.com`)
- Any inline styles or scripts used by shadcn/ui or framer-motion

These must be explicitly allowed in the CSP directive.

### Proposed Implementation

**Install:**
```bash
npm install helmet
```

**In `server/index.ts`**, add as the very first `app.use()`:

```ts
import helmet from "helmet";

const isDevelopment = process.env.NODE_ENV !== "production";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          // Vite injects inline scripts in development
          ...(isDevelopment ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Tailwind + shadcn require inline styles
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://*.basemaps.cartocdn.com", // Leaflet map tiles
          "https://*.tile.openstreetmap.org",
        ],
        connectSrc: [
          "'self'",
          // Vite HMR WebSocket in development
          ...(isDevelopment ? ["ws://localhost:*", "wss://localhost:*"] : []),
        ],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    // HSTS — only meaningful in production (enforce HTTPS)
    strictTransportSecurity: isDevelopment
      ? false
      : { maxAge: 31536000, includeSubDomains: true },
  })
);
```

**In `script/build.ts`**, add `"helmet"` to the allowlist array alongside other server deps.

### How to Test
1. Start the app and inspect response headers for any API or page request.
2. Confirm `X-Powered-By` header is absent.
3. Confirm `X-Content-Type-Options: nosniff` is present.
4. Confirm `X-Frame-Options` or `frame-ancestors` CSP directive is present.
5. Open the browser console after loading the app — confirm no CSP violations are reported.
6. Navigate to the Connections page → Map view. Confirm Leaflet tiles load (CartoDB images must pass CSP).
7. Confirm HMR still works in development (Vite's WebSocket reconnects without CSP errors).

### Database Migration Required
**No.**

---

## Item 5 — Remove or Disable Broken Pro Restrictions and Upgrade Prompts

### Problem
With Stripe removed, the `plan` field is permanently `"Free"` for all users and can never be changed to `"Pro"`. This means:

**Server-side gating (all users permanently locked out):**
- `server/routes.ts:21` — `const FREE_NODE_LIMIT = 2` — depth nodes 3+ are permanently inaccessible
- `server/routes.ts:323, 373` — `hasFullAccess = userPlan === "Pro" && subscriptionStatus === "active"` — always `false`
- `server/routes.ts:1563, 1581` — premium stream embeds permanently hidden
- `server/routes.ts:1607` — premium replay access permanently denied

**Client-side prompts (all point to a dead upgrade path):**
- `client/src/pages/RabbitHole.tsx:401, 439–449` — "Pro Content" lock with `/pricing` link
- `client/src/pages/DepthReader.tsx:271, 354–377` — "Upgrade to Pro" end-of-content wall
- `client/src/pages/Watch.tsx:149–164, 286` — "Premium Content" stream wall
- `client/src/pages/Replay.tsx:79–94` — "Premium Content" replay wall

**Strategy for Phase 0:**  
Do **not** delete the gating infrastructure — it is well-designed and will be re-activated when billing is restored in Phase 4. Instead:
1. **Server:** Change `hasFullAccess` to always return `true` so all content is accessible (treat all users as Pro until billing is live).
2. **Client:** Replace "Upgrade to Pro" UI with a neutral placeholder ("Full access while in early access" or simply hide the paywall UI).
3. **Do not remove** `plan`/`subscriptionStatus` fields — they remain in schema and will be used again.

### Files Affected
| File | Lines | Change |
|---|---|---|
| `server/routes.ts` | 21 | Raise `FREE_NODE_LIMIT` or make access unconditional |
| `server/routes.ts` | 313–330, 360–380 | Make `hasFullAccess` unconditionally `true` |
| `server/routes.ts` | 1560–1566, 1578–1584, 1603–1610 | Remove premium stream/replay checks temporarily |
| `client/src/pages/RabbitHole.tsx` | 399–450 | Replace upgrade lock UI with accessible content |
| `client/src/pages/DepthReader.tsx` | 268–380 | Remove upgrade wall; show all nodes |
| `client/src/pages/Watch.tsx` | 149–164, 286–290 | Remove premium wall |
| `client/src/pages/Replay.tsx` | 79–94 | Remove premium wall |
| `client/src/pages/Pricing.tsx` | Whole file | Already updated to "Coming Soon" — verify messaging is clear |
| `client/src/pages/Account.tsx` | Upgrade section | Already updated — verify no broken links remain |

### Risk Level
**LOW.** Opening access to content is the safe direction — no data is lost, no users are locked out, and the gating code is preserved in comments for re-activation in Phase 4.

### Proposed Implementation

**Server — `server/routes.ts`:**

```ts
// CHANGE 1: Make hasFullAccess unconditionally true until billing is live
// Old:
const hasFullAccess = userPlan === "Pro" && subscriptionStatus === "active";
// New:
const hasFullAccess = true; // Billing gating disabled — Phase 4 will restore this

// CHANGE 2: For depth-node access endpoint (the /api/holes/:slug/access route):
// Return hasFullAccess: true for all users
return res.json({
  hasFullAccess: true,
  totalNodes,
  previewLimit: totalNodes,
  plan: userPlan || "Free",
  // TODO Phase 4: restore Pro gating here
});

// CHANGE 3: Stream premium embed — always return the premium embed URL if it exists
// Remove the Pro plan check at lines 1563 and 1581

// CHANGE 4: Replay premium access — remove plan check at line 1607
```

**Client pages:**

For `RabbitHole.tsx` and `DepthReader.tsx`: Remove the `Lock` icon paywall overlay and upgrade CTA entirely. The server will now return `hasFullAccess: true`, so the depth nodes will render — but add a defensive client-side fallback: if `hasFullAccess` is somehow `false`, show a neutral "Content coming soon" message instead of an upgrade prompt.

For `Watch.tsx` and `Replay.tsx`: Remove the premium wall `<div>` blocks. If `premium` is `true` and `hasAccess` is `false`, show a simple "Content unavailable" message without referencing Pro subscriptions.

**Exact comment to add above each changed block:**
```ts
// TODO Phase 4 (Billing): Restore Pro/subscription checks here.
// See PHASE_0_PLAN.md Item 5 and PROJECT_AUDIT.md Section 10.
```

### How to Test
1. Create a new user account (plan will be `"Free"`).
2. Navigate to an investigation with more than 2 depth nodes. Confirm all nodes are visible without any paywall.
3. Open the Depth Reader (`/rabbithole/:slug/read`). Confirm no upgrade wall appears at any depth node.
4. If a premium stream exists, confirm the embed URL is returned and displayed.
5. Call `GET /api/holes/:slug/access` directly — confirm `hasFullAccess: true` is returned for all users.
6. Confirm the Pricing page displays "Coming Soon" and no "Upgrade Now" buttons trigger any action.

### Database Migration Required
**No.** `plan` and `subscriptionStatus` columns remain. Only query logic changes.

---

## Item 6 — Remove Remaining Stripe Dead Code (Without Schema Migration)

### Problem
After the Stripe removal, the following dead code remains:

**Dead code to remove (no migration needed):**

| Location | What | Action |
|---|---|---|
| `server/storage.ts:171` | `getUserByStripeCustomerId()` interface declaration | Remove |
| `server/storage.ts:712–714` | `getUserByStripeCustomerId()` implementation | Remove |
| `server/index.ts:28–29` | `// Stripe webhook disabled` + commented-out route | Remove comment lines |
| `server/index.ts:106` | `// Stripe disabled — re-enable...` comment | Remove comment line |
| `script/build.ts:27` | `"stripe"` in esbuild allowlist | Remove the string |

**Schema columns to KEEP (removing requires a database migration — defer to V2):**

| Column | Table | Reason to keep |
|---|---|---|
| `plan` | `users` | Actively used by auth and access-control logic |
| `subscriptionStatus` | `users` | Actively used by auth and access-control logic |
| `stripeCustomerId` | `users` | Harmless; will be repopulated when billing returns |
| `stripeSubscriptionId` | `users` | Harmless; will be repopulated when billing returns |

**Client references to keep (they are billing-model, not Stripe-specific):**
- `useAuth.ts` — `plan` and `subscriptionStatus` in `AuthUser` type → **keep** (useful)
- `Account.tsx` — plan badge display → **keep** (correct UX)
- `Pricing.tsx` — "Coming Soon" page → **keep** (already updated)

### Files Affected
| File | Lines | Change |
|---|---|---|
| `server/storage.ts` | 171, 712–714 | Remove `getUserByStripeCustomerId` entirely |
| `server/index.ts` | 28–29, 106 | Remove 3 dead comment lines |
| `script/build.ts` | 27 | Remove `"stripe"` from allowlist array |

### Risk Level
**VERY LOW.** `getUserByStripeCustomerId` is called nowhere in the codebase (confirmed by audit — the only callers were in the removed `webhookHandlers.ts`). Removing dead code cannot break live functionality.

### How to Test
1. Run `npm run check` — TypeScript must still pass.
2. Grep the codebase for `getUserByStripeCustomerId` — should return zero results.
3. Grep for `stripe-replit-sync` — should return zero results.
4. Run `npm run build` — confirm the production bundle builds without errors.
5. Start the server with `npm run dev` — confirm no import errors on startup.

### Database Migration Required
**No** — schema columns are preserved intentionally. A V2 migration can clean them up if a different billing provider is chosen.

---

## Item 7 — Add Basic Automated Test Setup

### Problem
There is **zero test coverage** of any kind. No test runner, no test files, no test script. This means:
- Regressions from Phase 0 changes cannot be caught automatically
- There is no safety net for future V2 development
- The `npm test` script does not exist

### Files Affected
| File | Change |
|---|---|
| `package.json` | Add `test` script and test dev dependencies |
| `tests/setup.ts` | New — test environment setup |
| `tests/auth.test.ts` | New — auth route tests |
| `tests/admin-auth.test.ts` | New — admin route protection tests |
| `tests/rate-limit.test.ts` | New — rate limiter tests |
| `tests/public-api.test.ts` | New — smoke tests for key public endpoints |
| `vitest.config.ts` | New — vitest configuration |

### Risk Level
**LOW.** Adding tests does not change application code. The only risk is that a flawed test incorrectly marks a passing behaviour as failing — which would be caught in review before merging.

### Proposed Implementation

**Install:**
```bash
npm install --save-dev vitest @vitest/coverage-v8 supertest @types/supertest
```

**`vitest.config.ts` (new file):**
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 15000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["server/**/*.ts"],
      exclude: ["server/vite.ts", "server/static.ts"],
    },
  },
});
```

**`package.json` scripts addition:**
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

**`tests/setup.ts`:**
```ts
import { beforeAll, afterAll } from "vitest";
// Sets up a test Express app instance connected to the test database
// Uses DATABASE_URL or a test-specific connection string
// Ensures clean state before each test suite
```

**`tests/auth.test.ts` — key test cases:**
```
POST /api/auth/signup
  ✓ creates a new user with valid email + password
  ✓ returns 400 if email is missing
  ✓ returns 400 if password is shorter than 6 characters
  ✓ returns 409 if email is already registered
  ✓ does not return passwordHash in the response

POST /api/auth/login
  ✓ returns 200 and user data on valid credentials
  ✓ returns 401 on wrong password
  ✓ returns 401 on unknown email
  ✓ session cookie is set on successful login
  ✓ session ID changes after login (regenerate check)

POST /api/auth/logout
  ✓ returns 200 and clears connect.sid cookie

GET /api/auth/me
  ✓ returns 401 when not authenticated
  ✓ returns user data when authenticated
  ✓ does not return passwordHash
```

**`tests/admin-auth.test.ts` — key test cases:**
```
Admin route protection
  ✓ GET /api/admin/holes returns 401 without employee session
  ✓ POST /api/admin/holes returns 401 without employee session
  ✓ DELETE /api/admin/holes/:id returns 401 without employee session
  ✓ GET /api/admin/employees returns 401 without employee session
  ✓ POST /api/admin/employees returns 403 for Editor role (Admin only)
  ✓ POST /api/admin/login returns 401 for wrong credentials
  ✓ POST /api/admin/login succeeds and sets employeeId session
```

**`tests/public-api.test.ts` — smoke tests:**
```
Public API
  ✓ GET /api/holes returns 200 with an array
  ✓ GET /api/categories returns 200 with an array
  ✓ GET /api/timeline returns 200 with paginated items
  ✓ GET /api/map/items returns 200 with geo items
  ✓ GET /api/holes/:nonexistent-slug returns 404
```

**`tests/rate-limit.test.ts`:**
```
Rate limiting
  ✓ POST /api/auth/login returns 429 after 20 consecutive failed attempts
  ✓ POST /api/admin/login returns 429 after 20 consecutive failed attempts
  ✓ Response on 429 includes RateLimit-* headers
```

### How to Test
```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode during development
npm run test:coverage # Generate coverage report
```

All tests should pass on a clean database. Tests that require database state should use a dedicated test database or run against seeded development data with explicit teardown.

**Minimum passing bar for Phase 0 completion:** All auth, admin-auth, and public-api tests green. Rate-limit tests may require mock timers and are lower priority.

### Database Migration Required
**No.** Tests run against the existing development database (or a dedicated test DB configured via `TEST_DATABASE_URL`).

---

## Item 8 — Verify Admin Route Authorization

### Problem
The audit identified that all 113 routes were written by a single author over many iterations. Authorization middleware could have been accidentally omitted on sensitive routes. A full audit of all `app.*()` registrations must be done and documented.

### Findings from Audit (current state — verified)

**Authorization model:**
- All `/api/admin/*` routes (except explicitly public: `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/me`) have `requireEmployee` middleware confirmed.
- Mutating admin operations (POST/PUT/DELETE) additionally have `requireRole("Admin", "Editor")` or `requireRole("Admin")`.
- Read-only admin endpoints (GET) sometimes have only `requireEmployee` — this is intentional (any employee can read unpublished content for review purposes).

**Verified role assignments:**

| Operation Category | Middleware |
|---|---|
| Create/edit investigations, nodes, claims, sources, media | `requireEmployee + requireRole("Admin", "Editor")` |
| Delete investigations, nodes, claims, sources, media | `requireEmployee + requireRole("Admin")` |
| Employee management (list, create, update, reset password) | `requireEmployee + requireRole("Admin")` |
| Timeline publish/promote | `requireEmployee + requireRole("Admin")` |
| Timeline CRUD | `requireEmployee + requireRole("Admin", "Editor")` |
| Podcast/episode CRUD | `requireEmployee + requireRole("Admin", "Editor")` |
| Stream/creator management | `requireEmployee` (missing role check — see gap below) |
| Audit log read | `requireEmployee + requireRole("Admin", "Editor")` |
| Export/import | `requireEmployee + requireRole("Admin")` |
| Validation | `requireEmployee + requireRole("Admin")` |
| Dashboard stats | `requireEmployee + requireRole("Admin", "Editor")` |

**Gap identified:**

`GET /api/admin/streams`, `POST /api/admin/streams`, `PUT /api/admin/streams/:id`, `DELETE /api/admin/streams/:id`, `POST /api/admin/replays`, `DELETE /api/admin/replays/:id`, `POST /api/admin/chat/:messageId/delete`, `POST /api/admin/chat/moderate` — these routes have `requireEmployee` but **no `requireRole` check**. This means a `Moderator`-role employee can create or delete streams and replays, which may exceed intended Moderator permissions.

**Employee self-escalation check (line 845):**
`PUT /api/admin/employees/:id` validates that `role` must be one of `["Admin", "Editor", "Moderator"]` but does **not** prevent an Admin from updating their own role to a lower one, nor does it prevent one Admin from demoting another. This is an operational concern but not a security vulnerability (requires Admin auth already).

### Files Affected
| File | Lines | Change |
|---|---|---|
| `server/routes.ts` | Live/streams admin routes (~1385–1520) | Add `requireRole("Admin", "Editor")` to mutating stream/creator endpoints; confirm Moderator retains only chat moderation access |

### Risk Level
**LOW.** Adding `requireRole` to streams routes restricts over-permissioned Moderators. If Moderators currently manage streams in production, coordinate before deploying. If no Moderators exist yet, the risk is zero.

### Proposed Fix

```ts
// Currently:
app.post("/api/admin/streams", requireEmployee, async (req, res) => { ... });

// After:
app.post("/api/admin/streams", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => { ... });
// Same for PUT /api/admin/streams/:id, DELETE /api/admin/streams/:id
// Same for POST /api/admin/replays, DELETE /api/admin/replays/:id
// Chat moderation (delete message, create moderation action) — keep as requireEmployee only
// since Moderators must retain this capability
```

### How to Test
1. Create a test employee with role `Moderator`.
2. Log in as that Moderator and attempt `POST /api/admin/streams` — should return 403.
3. Confirm the Moderator CAN still call `POST /api/admin/chat/:messageId/delete` — should return 200.
4. Confirm an `Editor` CAN call `POST /api/admin/streams` — should return 200.
5. Run the admin-auth tests from Item 7.

### Database Migration Required
**No.**

---

## Item 9 — Verify Secrets Are Not Hard-Coded

### Problem
A comprehensive audit of the codebase for hard-coded secrets, API keys, tokens, and credentials.

### Complete Findings

**Hard-coded values confirmed:**

| Location | Value | Severity | Disposition |
|---|---|---|---|
| `server/routes.ts:64` | `"rabbithole2024"` (admin password fallback) | **HIGH** | Fixed in Item 1 — require env var in production |
| `server/index.ts:45` | `"rabbit-hole-dev-session-secret"` (session secret fallback) | **LOW** | See proposed fix below |
| `server/routes.ts:67` | `"admin@rabbithole.io"` (admin email) | LOW | Not a secret — acceptable hardcode, but should be configurable |

**No other hard-coded secrets found.** Specifically confirmed absent:
- No API keys (OpenAI, Anthropic, Stripe, SendGrid, etc.)
- No database connection strings in code (all use `process.env.DATABASE_URL`)
- No JWT secrets in code
- No hardcoded user passwords beyond the admin seed

**`script/build.ts` allowlist** references packages like `"openai"`, `"@google/generative-ai"`, `"jsonwebtoken"`, `"nodemailer"` that are not yet installed. These are anticipated future integrations — not a security concern, but worth noting.

**`passport` and `passport-local`** are in `package.json` dependencies but unused anywhere in the codebase (auth uses raw bcrypt + express-session). These are dead dependencies that should be removed to reduce attack surface.

### Files Affected
| File | Lines | Change |
|---|---|---|
| `server/index.ts` | 45–46 | Tighten dev session secret policy |
| `package.json` | dependencies | Remove `passport` and `passport-local` |
| `package.json` | devDependencies | Remove `@types/passport` and `@types/passport-local` |

### Proposed Implementation

**Dev session secret (`server/index.ts:45`):**

```ts
// CURRENT:
const sessionSecret = process.env.SESSION_SECRET || (isProduction ? undefined : "rabbit-hole-dev-session-secret");
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required in production");
}

// PROPOSED — require in ALL environments:
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (isProduction) {
    throw new Error("SESSION_SECRET environment variable is required. Set it via Replit Secrets.");
  } else {
    // Warn loudly in development but allow a generated fallback
    console.warn("[startup] ⚠️  SESSION_SECRET not set. Using an insecure dev-only fallback. Set SESSION_SECRET in your environment.");
    // Use a non-guessable string, not a published constant
    process.env.SESSION_SECRET = `dev-only-${Date.now()}-${Math.random().toString(36)}`;
  }
}
const sessionSecretValue = process.env.SESSION_SECRET!;
```

This ensures development instances that are accidentally internet-exposed do not use a known, predictable secret.

**Remove dead passport dependencies:**
```bash
npm uninstall passport passport-local
npm uninstall --save-dev @types/passport @types/passport-local
```

### How to Test
1. **Production simulation without `SESSION_SECRET`:** Set `NODE_ENV=production`, unset `SESSION_SECRET`. Confirm server throws and refuses to start.
2. **Production simulation with secret:** Set both env vars. Confirm server starts.
3. **Development without secret:** Start with `npm run dev` and no `SESSION_SECRET`. Confirm server starts with a warning in the console.
4. Confirm `SESSION_SECRET` is set as a Replit Secret (not in `.env` file committed to source).
5. Run `grep -rn "SESSION_SECRET\|DATABASE_URL\|ADMIN_PASSWORD" .env 2>/dev/null` — confirm `.env` is either absent or in `.gitignore`.
6. Run `npm run check` after removing passport — TypeScript must still pass.

### Database Migration Required
**No.**

---

## Item 10 — Confirm App Can Build and Publish Successfully

### Problem
Publishing to production runs `npm run build` (which calls `tsx script/build.ts`, bundling the Express server with esbuild and building the Vite frontend). Any TypeScript error, missing import, or bundler misconfiguration blocks deployment.

After Phase 0 changes (especially removing packages, adding packages, and modifying imports), the build must be verified end-to-end.

### Files Affected
This item is a verification step — it reads and runs, but all changes it reveals are driven by the other items.

**Potential build issues to watch for:**

| Risk | Cause | Fix |
|---|---|---|
| TypeScript error after removing `passport` | `@types/passport` removal may leave orphaned type references | Remove any `import passport` or `import type ... from 'passport'` |
| esbuild bundler missing new packages | `helmet` and `express-rate-limit` added in Items 3/4 but not in `script/build.ts` allowlist | Add both to the allowlist in `script/build.ts` |
| Vite CSP violation at runtime | Helmet CSP blocks a resource in production build | Adjust CSP directives as needed (see Item 4) |
| `tsx` version mismatch | `tsx` is a devDependency — ensure it is present and compatible | Confirm `tsx` remains in devDependencies |

### Proposed Verification Sequence

Run these in order after all Phase 0 items are implemented:

```bash
# Step 1: TypeScript check (catches type errors without bundling)
npm run check

# Step 2: Full production build
npm run build

# Step 3: Smoke test the production bundle locally
NODE_ENV=production SESSION_SECRET=test-secret DATABASE_URL=$DATABASE_URL node dist/index.cjs

# Step 4: Verify key endpoints respond in the production bundle
curl http://localhost:5000/api/holes
curl http://localhost:5000/api/auth/me
curl http://localhost:5000/api/categories

# Step 5: Verify security headers are present in production build
curl -I http://localhost:5000/api/holes | grep -E "x-frame|x-content|strict-transport|content-security"
```

### `script/build.ts` allowlist — required additions after Phase 0:

After Items 3, 4, and 9 the following changes are needed in `script/build.ts`:

```ts
// ADD to allowlist:
"helmet",
"express-rate-limit",

// REMOVE from allowlist (already done in Item 6):
"stripe",

// LEAVE in allowlist (future integrations — harmless):
"openai",
"@google/generative-ai",
"jsonwebtoken",
"nodemailer",
```

### How to Test
The build passes when:
1. `npm run check` exits with code 0 (no TypeScript errors)
2. `npm run build` exits with code 0 and produces `dist/index.cjs` and `dist/public/`
3. The production bundle starts and serves the app without crashing
4. Security headers are present in production responses
5. The Replit deployment config in `.replit` (`build = ["npm", "run", "build"]`) runs the same command

### Database Migration Required
**No.** Phase 0 introduces no schema changes.

---

## Summary Table

| # | Item | Files Changed | Risk | DB Migration | New Packages |
|---|---|---|---|---|---|
| 1 | Admin password not logged | `server/routes.ts` | LOW | No | None |
| 2 | Session regeneration on login | `server/routes.ts` | LOW-MED | No | None |
| 3 | Rate limiting on auth routes | `server/index.ts`, `package.json` | LOW | No | `express-rate-limit` |
| 4 | Helmet security headers | `server/index.ts`, `script/build.ts`, `package.json` | LOW-MED | No | `helmet` |
| 5 | Disable broken Pro gating | `server/routes.ts`, 4 client pages | LOW | No | None |
| 6 | Remove Stripe dead code | `server/storage.ts`, `server/index.ts`, `script/build.ts` | VERY LOW | No | None (remove `"stripe"` from allowlist) |
| 7 | Automated test setup | `package.json`, `vitest.config.ts`, `tests/` (new) | LOW | No | `vitest`, `supertest` |
| 8 | Admin route role gaps | `server/routes.ts` (live routes) | LOW | No | None |
| 9 | No hard-coded secrets | `server/index.ts`, `package.json` | LOW | No | Remove `passport` |
| 10 | Build + publish verification | `script/build.ts` (allowlist only) | LOW | No | None |

---

## Implementation Order

Items have dependencies — implement in this sequence:

```
Item 6  (Stripe dead code)      — fastest win, zero risk, do first
Item 9  (Secrets + passport)    — remove dead deps before adding new ones
Item 1  (Admin password)        — security critical, do early
Item 3  (Rate limiting)         — install package, apply middleware
Item 4  (Helmet)                — install package, apply middleware
Item 2  (Session regeneration)  — logic change, do after middleware is stable
Item 5  (Pro gating)            — content change, do after server side is stable
Item 8  (Admin role gaps)       — targeted route fix
Item 7  (Test setup)            — add tests that validate all above
Item 10 (Build verification)    — run last, validates everything together
```

---

## Definition of Done

Phase 0 is complete when:
- [ ] `npm run check` passes with zero TypeScript errors
- [ ] `npm run build` produces a valid production bundle
- [ ] `npm test` passes with all tests green
- [ ] Server starts without logging any password value
- [ ] `SESSION_SECRET` is required (or warned) in all environments
- [ ] `connect.sid` cookie value changes after login (session regeneration confirmed)
- [ ] Auth endpoints return HTTP 429 after configured attempt threshold
- [ ] Response headers include `X-Content-Type-Options` and `X-Frame-Options`
- [ ] All depth nodes are accessible to all users without a paywall
- [ ] `grep -rn "stripe-replit-sync\|getUserByStripeCustomerId" server/` returns zero results
- [ ] `grep -rn "passport" server/` returns zero results
- [ ] Replit deployment succeeds and the published app loads correctly

---

*Plan complete. No application code was modified during this document's creation.*
