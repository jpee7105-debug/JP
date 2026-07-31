# Rabbit Hole — Phase 0 Implementation Plan (Revised)
**Goal:** Safely stabilise the existing codebase for V2 development.  
**Constraint:** No new features. Security fixes, broken-flow repairs, and cleanup only.  
**Source:** `PROJECT_AUDIT.md` + feedback review dated 2026-07-31.  
**Status:** Plan only — no code changed yet.  
**Data guarantee:** No database tables, columns, or rows are dropped or altered in any Phase 0 item. All content is preserved.

---

## Prerequisites

Run these before starting any item. Record the exact output. Any failure here is pre-existing and must not be blamed on Phase 0 changes.

```bash
npm run check        # TypeScript compiler — must exit 0
npm run build        # Production bundle — must exit 0 and produce dist/
npm run dev          # Dev server — must start on port 5000 within 10 s
```

**Rollback baseline:** Create a git commit or Replit checkpoint labelled `phase-0-baseline` before making any changes. Every item in this plan references this checkpoint as the rollback target.

---

## Item 1 — Require `ADMIN_PASSWORD` in All Environments (No Fallback)

### Problem
`server/routes.ts:64`

```ts
// CURRENT — DANGEROUS
const defaultPassword = process.env.ADMIN_PASSWORD || "rabbithole2024";
console.log(`[seed] Created default admin employee: ... (password: ${defaultPassword})`);
```

Two distinct issues:
1. The string `"rabbithole2024"` is a publicly known credential (committed to source, referenced in audit). If `ADMIN_PASSWORD` is unset anywhere — dev, staging, or production — an attacker can log in as Admin immediately.
2. The password value is written to stdout regardless of environment. Server logs are frequently stored, forwarded, and accessible to infrastructure teams.

The previous plan proposed keeping `"rabbithole2024"` as a dev fallback. **This revision removes the fallback entirely.** There is no safe default password. Requiring the env var everywhere eliminates the entire class of "unset secret" incidents.

### Files Affected
| File | Lines | Change |
|---|---|---|
| `server/routes.ts` | 64–73 | Remove fallback; require env var; never log value |

### Risk Level
**LOW.** Logic-only change. The admin account is still created on first boot. Anyone who has been relying on the default password in development must set `ADMIN_PASSWORD` in their environment before this change is deployed.

### Proposed Implementation

Replace lines 64–73 with:

```ts
const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminPassword) {
  throw new Error(
    "[startup] ADMIN_PASSWORD environment variable is required in all environments. " +
    "Set it via Replit Secrets (development and production). " +
    "Choose a strong password — it is never logged."
  );
}

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
```

**Required action before deploying this change:**  
Set `ADMIN_PASSWORD` as a Replit Secret in both the development workspace and any deployed environment. The value must be a strong, unique password (≥16 characters, mixed case, numbers, symbols). Do not reuse `rabbithole2024`.

### How to Test
1. **Missing env var:** Unset `ADMIN_PASSWORD`. Start the server. Confirm it throws and refuses to start — the error message must name the missing variable.
2. **Set env var:** Set `ADMIN_PASSWORD=SomeStrongPassword!`. Start server. Confirm it starts. Log in to `/admin` with that password. Confirm success.
3. **No password in logs:** Inspect all console output during startup. Confirm the password value does not appear anywhere.
4. **Idempotency:** Run twice with employees already existing. Confirm the seeding block is skipped (gated on `empCount === 0`). Password never re-hashed or re-logged.
5. **Automated test:** `tests/startup.test.ts` — assert process throws when `ADMIN_PASSWORD` is undefined.

### Rollback
Restore `server/routes.ts:64–73` from the `phase-0-baseline` checkpoint. Re-add `ADMIN_PASSWORD` to Replit Secrets if it was removed during testing.

### Database Migration Required
**No.**

---

## Item 2 — Require `SESSION_SECRET` in All Environments (No Fallback)

### Problem
`server/index.ts:45`

```ts
// CURRENT
const sessionSecret = process.env.SESSION_SECRET || (isProduction ? undefined : "rabbit-hole-dev-session-secret");
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required in production");
}
```

The fallback `"rabbit-hole-dev-session-secret"` is a static, published string. Any development instance that is accidentally internet-exposed (common in Replit) has its sessions forgeable by anyone who has read this codebase. Additionally, the check only throws in production — a developer who omits `SESSION_SECRET` from a staging environment receives no warning.

**This revision removes the fallback in all environments.** Forgeable session secrets are not acceptable at any stage.

### Files Affected
| File | Lines | Change |
|---|---|---|
| `server/index.ts` | 44–48 | Remove fallback; require env var everywhere; fail hard on missing value |

### Risk Level
**LOW.** `SESSION_SECRET` is already a Replit Secret in this workspace. The change only affects developers who do not have it set locally — they will receive a clear error on startup.

### Proposed Implementation

Replace lines 44–48 with:

```ts
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error(
    "[startup] SESSION_SECRET environment variable is required in all environments. " +
    "Set it via Replit Secrets. Minimum 32 random characters."
  );
}
```

Remove the `isProduction` reference from session secret handling entirely. The production-only `app.set("trust proxy", 1)` check above it is unrelated and stays.

**Required action before deploying:**  
Confirm `SESSION_SECRET` is set as a Replit Secret. A suitable value can be generated with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

### How to Test
1. **Missing env var:** Unset `SESSION_SECRET`. Start the server. Confirm it throws immediately with the descriptive error.
2. **Set env var:** Set `SESSION_SECRET` to a 32+ character random string. Confirm server starts normally.
3. **Session persistence:** After login, confirm `connect.sid` cookie is set and `/api/auth/me` returns the user. Restart the server with the same `SESSION_SECRET` — existing sessions should survive. Restart with a *different* `SESSION_SECRET` — existing sessions should be invalidated (users must log in again).
4. **Automated test:** `tests/startup.test.ts` — assert process throws when `SESSION_SECRET` is undefined.

### Rollback
Restore `server/index.ts:44–48` from the `phase-0-baseline` checkpoint.

### Database Migration Required
**No.**

---

## Item 3 — Regenerate Sessions on Login (Session Fixation Protection)

### Problem
Three login handlers write to the **existing** session object without first regenerating the session ID. An attacker who obtains or sets a victim's pre-login `connect.sid` value retains access to the session after the victim authenticates.

**Affected handlers in `server/routes.ts`:**

| Handler | Line | Vulnerability |
|---|---|---|
| `POST /api/admin/login` | 100 | `req.session.employeeId = emp.id` without regenerate |
| `POST /api/auth/signup` | 151 | `req.session.userId = user.id` without regenerate |
| `POST /api/auth/login` | 174 | `req.session.userId = user.id` without regenerate |

### Files Affected
| File | Lines | Change |
|---|---|---|
| `server/routes.ts` | ~96–102, ~148–153, ~170–176 | Wrap each login assignment in `req.session.regenerate()` |

### Risk Level
**LOW-MEDIUM.** The regenerate callback creates a new, empty session. Any session data set before the callback is lost — there is currently none to preserve, so this is safe. The only risk is incomplete implementation (setting the ID field outside the callback), which the test steps below will catch.

### Proposed Implementation

Apply this pattern to all three handlers. The user login handler is shown; apply identically to admin login (using `employeeId`) and signup (using `userId`):

```ts
// BEFORE — vulnerable
req.session.userId = user.id;
const { passwordHash: _, ...safeUser } = user;
res.json(safeUser);

// AFTER — safe
req.session.regenerate((regenErr) => {
  if (regenErr) {
    return res.status(500).json({ message: "Session error. Please try again." });
  }
  req.session.userId = user.id;
  // safeUser built AFTER regenerate to avoid closure over stale data
  const { passwordHash: _, stripeCustomerId: __, stripeSubscriptionId: ___, ...safeUser } = user;
  res.json(safeUser);
});
```

**Note:** The `stripeCustomerId` and `stripeSubscriptionId` fields are excluded here as a forward reference to Item 6 (safe response DTOs). Both concerns are addressed in one edit per handler.

### How to Test
1. Open browser DevTools → Application → Cookies.
2. Note the `connect.sid` value before logging in.
3. Complete a successful login. Confirm `connect.sid` has changed to a new value.
4. Repeat for `/admin` login. Confirm cookie changes.
5. **Negative case:** Attempt login with wrong password. Confirm `connect.sid` does NOT change (regenerate must not be called on failure).
6. **Concurrent sessions:** Log in from two browsers simultaneously. Confirm both sessions are independent and both remain valid after either one logs in.
7. **Automated test (`tests/auth.test.ts`):** Record `Set-Cookie` header before and after login. Assert the session ID value changed.

### Rollback
Restore the three login handler blocks from `phase-0-baseline`.

### Database Migration Required
**No.** `connect-pg-simple` handles new session rows automatically on regenerate.

---

## Item 4 — `BILLING_ENABLED` Feature Flag (Single Point of Control)

### Problem
With Stripe removed, `plan` is permanently `"Free"` for all users. This locks all users out of:
- Depth nodes beyond level 2 (`FREE_NODE_LIMIT = 2`, `routes.ts:21`)
- Premium stream embed URLs (`routes.ts:1561–1564`)
- Premium replay access (`routes.ts:1579–1582`)

The previous plan proposed hardcoding `hasFullAccess = true` in **multiple places** across `server/routes.ts` and four client pages. This approach has two flaws:
1. Scattered `true` literals are impossible to grep reliably when restoring billing in Phase 4.
2. It was proposed to automatically expose premium embed URLs when billing is disabled — this is wrong. Premium URLs are access-controlled assets. Disabling billing does not mean all users should receive premium URLs.

**This revision uses a single `BILLING_ENABLED` env var** as the authoritative switch. All gating reads one flag. Premium stream/replay URLs are never automatically exposed — they are replaced with a "coming soon" message when billing is disabled.

### Files Affected
| File | Lines | Change |
|---|---|---|
| `server/routes.ts` | 21, 313–330, 360–380, ~1555–1615 | Read `BILLING_ENABLED`; adjust access logic per rules below |
| `client/src/pages/RabbitHole.tsx` | 399–450 | Replace upgrade lock UI with "early access" message |
| `client/src/pages/DepthReader.tsx` | 268–380 | Remove upgrade wall; show all nodes when `hasFullAccess` true |
| `client/src/pages/Watch.tsx` | 149–164, 286–290 | Replace premium wall with "coming soon" — never show premium URL |
| `client/src/pages/Replay.tsx` | 79–94 | Replace premium wall with "coming soon" — never show premium URL |

### Risk Level
**LOW.** Replacing a dead upgrade path with an early-access message is strictly an improvement. No content is hidden, no users are newly blocked.

### Proposed Implementation

**Set the env var (Replit Secrets):**
```
BILLING_ENABLED=false
```

**`server/routes.ts` — add near the top of `registerRoutes`:**

```ts
// Single source of truth for billing state.
// Set BILLING_ENABLED=true in Replit Secrets when a payment provider is connected.
// All Pro/subscription checks read this flag — do not add billing logic elsewhere.
const BILLING_ENABLED = process.env.BILLING_ENABLED === "true";
```

**Depth node access — replace the two `hasFullAccess` checks (lines ~323 and ~373):**

```ts
// Phase 0: when billing is disabled, all authenticated and unauthenticated
// users receive full access. The gating logic below is preserved for Phase 4.
const hasFullAccess = BILLING_ENABLED
  ? (userPlan === "Pro" && subscriptionStatus === "active")
  : true; // TODO Phase 4 (Billing): remove this line and restore Pro check

// previewLimit and response remain unchanged — they already use hasFullAccess correctly
```

**Stream access — premium embed URL handling (lines ~1555–1575):**

```ts
// BILLING_ENABLED=false: streams marked premium show a placeholder;
// the premium embed URL is never returned regardless of user plan.
// This is intentional — disabling billing does not mean open access to premium assets.
if (stream.visibility === "premium") {
  if (!BILLING_ENABLED) {
    // Return stream metadata but strip both embed URLs
    return res.json({
      stream: { ...stream, embedUrl: "", premiumEmbedUrl: "" },
      creator,
      premium: true,
      hasAccess: false,
      billingDisabled: true, // client uses this to show "coming soon" rather than an upgrade wall
    });
  }
  // BILLING_ENABLED=true: restore full Pro check
  if (!userId) return res.json({ stream: { ...stream, embedUrl: "", premiumEmbedUrl: "" }, creator, premium: true, hasAccess: false });
  const user = await storage.getUserById(userId);
  if (!user || user.plan !== "Pro" || user.subscriptionStatus !== "active") {
    return res.json({ stream: { ...stream, embedUrl: "", premiumEmbedUrl: "" }, creator, premium: true, hasAccess: false });
  }
}
// TODO Phase 4 (Billing): above block is the full billing gate — restore BILLING_ENABLED=true to activate
```

Apply the same `billingDisabled` pattern to replay access (`~lines 1579–1610`).

**Client — `Watch.tsx` and `Replay.tsx`:**

Replace the existing premium wall UI with a billing-aware message:
```tsx
// When billingDisabled is true (server response), show:
<div data-testid="billing-coming-soon">
  <h3>Coming Soon</h3>
  <p>Premium streaming will be available when subscriptions launch.</p>
</div>

// When billingDisabled is false and hasAccess is false (billing active, not subscribed):
// restore the original Pro upgrade wall — preserved in a comment block
```

**Client — `RabbitHole.tsx` and `DepthReader.tsx`:**

The server already returns `hasFullAccess: true` when `BILLING_ENABLED=false`. The client paywall UI (`Lock` icon overlay, upgrade CTA, `/pricing` links) should be:
- **Hidden** when `hasFullAccess` is `true`
- **Replaced with neutral message** when `hasFullAccess` is `false` and billing is disabled (defensive fallback)
- **Preserved in comments** for Phase 4 restoration

Exact comment to add above each disabled block:
```tsx
{/* TODO Phase 4 (Billing): Restore this block when BILLING_ENABLED=true.
    See PHASE_0_PLAN.md Item 4 and PROJECT_AUDIT.md Section 10. */}
```

### How to Test
1. **`BILLING_ENABLED=false` (default):** Create a new user (plan = "Free"). Navigate to an investigation with 3+ depth nodes. Confirm all nodes are visible without any paywall or upgrade prompt.
2. **`BILLING_ENABLED=false`:** Navigate to a premium-marked stream. Confirm the embed URL is empty. Confirm "coming soon" message appears. Confirm `premiumEmbedUrl` is absent from the network response.
3. **`BILLING_ENABLED=true` (future):** Set the env var. A Free user should see the paywall for premium content. A Pro user should see content. This is a smoke test only — billing cannot be fully tested without a payment provider.
4. **Single flag grep:** Run `grep -rn "BILLING_ENABLED" server/` — confirm all gating references this one variable.
5. **Automated test (`tests/billing-flag.test.ts`):** With `BILLING_ENABLED=false`, assert `GET /api/holes/:slug/access` returns `{ hasFullAccess: true }`. Assert `GET /api/streams/:id` for a premium stream returns `{ premiumEmbedUrl: "" }`.

### Rollback
Restore the four server route blocks and four client page files from `phase-0-baseline`. Remove `BILLING_ENABLED` from Replit Secrets.

### Database Migration Required
**No.** `plan`, `subscriptionStatus`, and all subscription columns are preserved unchanged.

---

## Item 5 — CSRF / Trusted-Origin Protection

### Problem
No CSRF (Cross-Site Request Forgery) protection exists. `SameSite=Lax` cookies reduce the risk of cross-site `GET` navigation-triggered requests, but `SameSite=Lax` does NOT protect against:
- Cross-site `POST` requests initiated from a `<form>` without JavaScript (exempted by Lax)
- Cross-site requests from same-site subdomains
- Environments where `SameSite` is not honoured (older browsers, misconfigured proxies)

The `csurf` npm package is deprecated. Implementing a **trusted-origin check** is the recommended replacement: for all state-changing requests, verify that the `Origin` (or fallback `Referer`) header matches the application's own domain. This is stateless, does not require token management, and works correctly with the existing session-based auth model.

### Files Affected
| File | Change |
|---|---|
| `server/index.ts` | Add `trustedOrigin` middleware before route registration |
| `server/routes.ts` | No changes — middleware applies globally |

### Risk Level
**MEDIUM.** Middleware that rejects requests by origin will break:
- Automated scripts calling the API without an `Origin` header
- Admin users accessing from unexpected domains (unlikely with Replit's fixed domain model)
- The test suite — tests must set `Origin` headers on all `POST`/`PUT`/`DELETE` requests

Mitigations are listed below.

### Proposed Implementation

**In `server/index.ts`**, add after `helmet()` but before `express.json()` and `registerRoutes()`:

```ts
// Trusted-origin CSRF protection.
// State-changing requests must originate from the application's own domain.
// GET, HEAD, OPTIONS are exempt (read-only, no side effects).
function trustedOriginMiddleware(req: Request, res: Response, next: NextFunction) {
  const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
  if (SAFE_METHODS.includes(req.method)) return next();

  // Skip for webhook endpoints that must accept external origins
  // (none exist in Phase 0 — add explicit exceptions here if needed in future)

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.headers.host;

  // In development, derive the expected origin from the host header
  // In production, use REPLIT_DOMAINS (set automatically by Replit)
  const replitDomains = process.env.REPLIT_DOMAINS;
  const allowedOrigins = new Set<string>();

  if (host) {
    allowedOrigins.add(`http://${host}`);
    allowedOrigins.add(`https://${host}`);
  }

  if (replitDomains) {
    for (const domain of replitDomains.split(",")) {
      allowedOrigins.add(`https://${domain.trim()}`);
    }
  }

  // Allow requests with no origin header only in development
  // (e.g. curl, server-to-server calls without a browser)
  if (!origin && !referer) {
    if (process.env.NODE_ENV !== "production") return next();
    return res.status(403).json({ message: "Origin header required" });
  }

  const requestOrigin = origin || (referer ? new URL(referer).origin : "");
  const isAllowed = [...allowedOrigins].some((allowed) =>
    requestOrigin === allowed || requestOrigin.startsWith(allowed)
  );

  if (!isAllowed) {
    console.warn(`[csrf] Rejected request from origin: ${requestOrigin}`);
    return res.status(403).json({ message: "Forbidden: untrusted origin" });
  }

  next();
}

app.use(trustedOriginMiddleware);
```

**Test suite adjustment:**  
All `supertest` POST/PUT/DELETE requests must set the `Origin` header to match the test server's host:

```ts
// In tests/setup.ts — apply to all non-GET requests
request(app)
  .post("/api/auth/login")
  .set("Origin", "http://localhost:5000")
  .send({ email, password });
```

### How to Test
1. **Valid origin:** From the running app (browser), perform a login. Confirm it succeeds — the browser sends the correct `Origin` header automatically.
2. **Rejected origin:** Use `curl` in production mode with a different `Origin`:
   ```bash
   NODE_ENV=production curl -X POST http://localhost:5000/api/auth/login \
     -H "Origin: https://evil.example.com" \
     -H "Content-Type: application/json" \
     -d '{"email":"x","password":"y"}'
   ```
   Confirm 403 response.
3. **No origin in development:** `curl -X POST http://localhost:5000/api/auth/login` (no `Origin` header) must succeed in development, fail in production.
4. **No origin in production:** Same `curl` without `Origin` must return 403.
5. **Automated test (`tests/csrf.test.ts`):** POST with a mismatched origin must return 403. POST with the correct origin must return the normal auth response.

### Rollback
Remove `trustedOriginMiddleware` and its `app.use()` call from `server/index.ts`. Restore from `phase-0-baseline` if needed.

### Database Migration Required
**No.**

---

## Item 6 — Safe Response DTOs (No Sensitive Fields in API Responses)

### Problem
User and employee objects are returned from the database with sensitive fields that must never reach API consumers. The current approach is ad-hoc: each handler individually spreads out `passwordHash` using a destructure pattern (`{ passwordHash: _, ...safeUser }`). This has three failure modes:
1. A new handler added in V2 forgets the destructure — password hash leaks.
2. The pattern does not strip `stripeCustomerId` or `stripeSubscriptionId` from public user responses.
3. The employee list endpoint (`GET /api/admin/employees`, line ~802) uses a map, not the destructure — a code-style inconsistency that makes auditing harder.

**This revision defines explicit DTO functions** that are the only permitted way to serialize users and employees. All handlers call the DTO, never raw Drizzle rows.

### Files Affected
| File | Change |
|---|---|
| `server/dtos.ts` | **New file** — `toUserDTO()` and `toEmployeeDTO()` functions |
| `server/routes.ts` | All user/employee response sites (~10 locations) — replace spreads with DTO calls |

### Risk Level
**LOW.** Pure refactor — same data out, just enforced through a single path. TypeScript will catch any type mismatch at compile time.

### Proposed Implementation

**New file `server/dtos.ts`:**

```ts
import type { User, Employee } from "@shared/schema";

/**
 * Safe public-facing user object.
 * Never includes: passwordHash, stripeCustomerId, stripeSubscriptionId.
 * These fields exist in the database schema (preserved for Phase 4 billing)
 * but must not be transmitted to clients.
 */
export type UserDTO = {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  subscriptionStatus: string;
  createdAt: Date;
  lastLoginAt: Date | null;
};

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt ?? null,
  };
}

/**
 * Safe admin-facing employee object.
 * Never includes: passwordHash.
 */
export type EmployeeDTO = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
};

export function toEmployeeDTO(employee: Employee): EmployeeDTO {
  return {
    id: employee.id,
    email: employee.email,
    name: employee.name,
    role: employee.role,
    isActive: employee.isActive,
    createdAt: employee.createdAt,
    lastLoginAt: employee.lastLoginAt ?? null,
  };
}
```

**In `server/routes.ts`**, replace every response site:

```ts
// BEFORE (spread pattern — misses stripeCustomerId etc.)
const { passwordHash: _, ...safeUser } = user;
res.json(safeUser);

// AFTER (DTO — explicit, type-checked, complete)
import { toUserDTO, toEmployeeDTO } from "./dtos";
res.json(toUserDTO(user));
```

**Locations to update in `server/routes.ts`:**

| Line | Handler | Change |
|---|---|---|
| ~102 | `POST /api/admin/login` | `res.json(toEmployeeDTO(emp))` |
| ~124 | `GET /api/admin/me` | `res.json(toEmployeeDTO(emp))` |
| ~152 | `POST /api/auth/signup` | `res.json(toUserDTO(user))` |
| ~175 | `POST /api/auth/login` | `res.json(toUserDTO(user))` |
| ~198 | `GET /api/auth/me` | `res.json(toUserDTO(user))` |
| ~802 | `GET /api/admin/employees` | `res.json(emps.map(toEmployeeDTO))` |
| ~833 | `POST /api/admin/employees` | `res.json(toEmployeeDTO(emp))` |
| ~860 | `PUT /api/admin/employees/:id` | `res.json(toEmployeeDTO(emp))` |

### How to Test
1. `POST /api/auth/login` with valid credentials. Inspect the response body. Confirm none of these fields are present: `passwordHash`, `stripeCustomerId`, `stripeSubscriptionId`.
2. `GET /api/auth/me`. Inspect response. Same fields must be absent.
3. `GET /api/admin/employees` (as Admin). Confirm no `passwordHash` in any employee object.
4. `POST /api/admin/employees` (create a test employee). Confirm response has no `passwordHash`.
5. Run `npm run check` — TypeScript must confirm all DTO call sites have correct types.
6. **Automated test (`tests/auth.test.ts`):** Add assertions that `passwordHash`, `stripeCustomerId`, `stripeSubscriptionId` keys are absent from every auth response.

### Rollback
Delete `server/dtos.ts`. Restore the spread patterns in `server/routes.ts` from `phase-0-baseline`.

### Database Migration Required
**No.** Schema columns are unchanged — this is a serialization-layer change only.

---

## Item 7 — Zod Validation on All State-Changing Admin Routes

### Problem
Admin `POST` routes correctly use Zod insert schemas (e.g. `insertRabbitHoleSchema.parse(req.body)`). Admin `PUT` routes pass `req.body` directly to storage with no schema validation:

| Route | Line | Current behaviour |
|---|---|---|
| `PUT /api/admin/holes/:id` | 471 | `storage.updateHole(id, { ...req.body, lastEditedBy })` — raw body |
| `PUT /api/admin/depth-nodes/:id` | 547 | `storage.updateDepthNode(id, req.body)` — raw body |
| `PUT /api/admin/claims/:id` | 594 | `storage.updateClaim(id, req.body)` — raw body |
| `PUT /api/admin/sources/:id` | 640 | `storage.updateSource(id, req.body)` — raw body |
| `PUT /api/admin/media/:id` | 686 | `storage.updateMedia(id, req.body)` — raw body |
| `PUT /api/admin/people/:id` | 1165 | `storage.updatePerson(id, { ...req.body })` — raw body |
| `PUT /api/admin/relationships/:id` | 1215 | `storage.updateRelationship(id, { ...req.body })` — raw body |
| `PUT /api/admin/timeline/:id` | 1732 | `storage.updateGlobalTimelineItem(id, { ...req.body })` — raw body |
| `PUT /api/admin/timeline-entries/:id` | 1802 | `storage.updateTimelineEntry(id, { ...req.body })` — raw body |
| `PUT /api/admin/streams/:id` | 1430 | `storage.updateStream(id, req.body)` — raw body |

Any of these can receive extra fields, wrong types, or invalid values and write them directly to the database.

### Files Affected
| File | Change |
|---|---|
| `shared/schema.ts` | Confirm Drizzle insert schemas already exist; derive partial update schemas |
| `server/routes.ts` | Apply `.partial()` schemas to all PUT handlers listed above |

### Risk Level
**LOW-MEDIUM.** Adding validation to existing PUT routes could cause currently-passing (but invalid) client requests to start returning 400. All admin routes require an authenticated employee session, so the exposure is limited — but the admin UI must be tested to confirm it sends valid payloads.

### Proposed Implementation

Drizzle-Zod's `createInsertSchema` already produces Zod schemas for each table. Update schemas are derived using `.partial()` — all fields become optional, matching the partial-update pattern already used in storage.

**In `server/routes.ts`**, add near the existing import line for insert schemas:

```ts
// Derive partial update schemas from insert schemas for PUT route validation
const updateRabbitHoleSchema = insertRabbitHoleSchema.partial();
const updateDepthNodeSchema = insertDepthNodeSchema.partial();
const updateClaimSchema = insertClaimSchema.partial();
const updateSourceSchema = insertSourceSchema.partial();
const updateMediaSchema = insertMediaSchema.partial();
const updatePersonSchema = insertPersonSchema.partial();
const updateRelationshipSchema = insertRelationshipSchema.partial();
const updateGlobalTimelineItemSchema = insertGlobalTimelineItemSchema.partial();
const updateTimelineEntrySchema = insertTimelineEntrySchema.partial();
const updateStreamSchema = insertStreamSchema.partial();
```

**Apply to each PUT handler — example pattern:**

```ts
// BEFORE
app.put("/api/admin/depth-nodes/:id", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const node = await storage.updateDepthNode(id, req.body); // raw body
    ...

// AFTER
app.put("/api/admin/depth-nodes/:id", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) return res.status(400).json({ message: "Invalid id" });
    const parsed = updateDepthNodeSchema.parse(req.body); // validated
    const node = await storage.updateDepthNode(id, parsed);
    ...
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ message: "Validation failed", errors: err.errors });
    res.status(500).json({ message: "Failed to update depth node" });
  }
});
```

**Note on `parseInt` safety:** Every handler that calls `parseInt(req.params.id)` must additionally check `isNaN(id) || id < 1` and return 400. This is not currently done consistently.

**`PUT /api/admin/holes/:id` special case:**  
This handler has additional business logic (publish checklist, status transition rules). The Zod validation must be applied to `req.body` before those checks run, not after. The `lastEditedBy` field is injected after parsing (server-side), not accepted from the client body.

### How to Test
1. Send a `PUT /api/admin/depth-nodes/1` with an invalid field type (e.g. `{ "nodeNumber": "not-a-number" }`). Confirm 400 with Zod error details.
2. Send a `PUT /api/admin/holes/1` with an extra unexpected field (e.g. `{ "maliciousField": "inject" }`). Confirm the field is stripped by Zod and does not appear in the stored record.
3. Send a valid partial update (e.g. `{ "title": "New Title" }`) to each PUT endpoint. Confirm 200 and the change is persisted.
4. Send `PUT /api/admin/holes/abc` (non-numeric ID). Confirm 400.
5. Send `PUT /api/admin/holes/-1`. Confirm 400.
6. Run `npm run check` — TypeScript must confirm all `parsed` variables have correct types.
7. **Automated test (`tests/admin-validation.test.ts`):** For each PUT endpoint, assert: invalid type → 400, extra fields stripped, valid partial → 200.

### Rollback
Restore all PUT handler bodies from `phase-0-baseline`. Remove the `update*Schema` declarations.

### Database Migration Required
**No.**

---

## Item 8 — Pagination Limits and Offset Validation

### Problem
Public and admin endpoints accept user-supplied `limit` and `offset` query parameters with insufficient validation:

| Endpoint | Current behaviour | Issue |
|---|---|---|
| `GET /api/timeline` (public) | `limit = parseInt(...) \|\| 20` | No upper bound; negative accepted |
| `GET /api/admin/timeline` | Same pattern | No upper bound; negative accepted |
| `GET /api/library/search` | Capped at 100; no lower bound | Negative `limit` accepted |

A request with `limit=100000` or `offset=-1` produces unexpected SQL behaviour (`LIMIT -1` is equivalent to no limit in PostgreSQL; `OFFSET -1` throws a database error). These are denial-of-service and stability risks.

### Files Affected
| File | Lines | Change |
|---|---|---|
| `server/routes.ts` | ~1680–1684 (public timeline) | Add validation |
| `server/routes.ts` | ~1710–1714 (admin timeline) | Add validation |
| `server/routes.ts` | ~1654–1656 (library search) | Add lower bound check |

### Risk Level
**LOW.** Existing valid clients send reasonable values. Clamping and rejecting negatives does not affect any legitimate use case.

### Proposed Implementation

Define a reusable pagination parser near the top of `registerRoutes`:

```ts
/**
 * Parses and validates pagination parameters from query strings.
 * Returns null if validation fails — caller must return 400.
 */
function parsePagination(
  query: Record<string, unknown>,
  opts: { maxLimit?: number } = {}
): { limit: number; offset: number } | null {
  const maxLimit = opts.maxLimit ?? 100;
  const rawLimit = parseInt(query.limit as string);
  const rawOffset = parseInt(query.offset as string);

  const limit = isNaN(rawLimit) ? 20 : rawLimit;
  const offset = isNaN(rawOffset) ? 0 : rawOffset;

  // Reject invalid values — do not silently clamp to hide bad inputs
  if (offset < 0) return null;
  if (limit < 1 || limit > maxLimit) return null;

  return { limit, offset };
}
```

**Apply to each affected endpoint:**

```ts
// GET /api/timeline
const pagination = parsePagination(req.query, { maxLimit: 100 });
if (!pagination) return res.status(400).json({ message: "Invalid pagination: limit must be 1–100, offset must be ≥ 0" });
const { limit, offset } = pagination;
```

```ts
// GET /api/library/search — limit only (no offset)
const rawLimit = parseInt(req.query.limit as string);
const limit = isNaN(rawLimit) ? 20 : rawLimit;
if (limit < 1 || limit > 100) {
  return res.status(400).json({ message: "Invalid limit: must be 1–100" });
}
```

### How to Test
1. `GET /api/timeline?limit=0` → 400.
2. `GET /api/timeline?limit=101` → 400.
3. `GET /api/timeline?offset=-1` → 400.
4. `GET /api/timeline?limit=abc` → 400 (NaN → default, then check fails if default is also out of range — or accept the default of 20).
   - **Decision:** `NaN` should resolve to the default value of 20 (not an error). Only explicit invalid integers (negative, over max) should be rejected. Document this in code comments.
5. `GET /api/timeline?limit=20&offset=0` → 200 with paginated results.
6. `GET /api/library/search?q=test&limit=-5` → 400.
7. **Automated test (`tests/pagination.test.ts`):** Assert 400 for each invalid case above and 200 for the valid case.

### Rollback
Restore the three pagination blocks from `phase-0-baseline`. Remove the `parsePagination` helper.

### Database Migration Required
**No.**

---

## Item 9 — Rate Limiting on Authentication Routes

### Problem
`POST /api/auth/login`, `POST /api/auth/signup`, and `POST /api/admin/login` have no rate limiting. This exposes the application to brute-force attacks, credential stuffing, and signup spam. `express-rate-limit` was anticipated (it is in `script/build.ts`'s bundler allowlist at line 27) but never installed.

### Files Affected
| File | Change |
|---|---|
| `package.json` | Add `express-rate-limit` to dependencies |
| `server/index.ts` | Apply limiters before `registerRoutes` |

### Risk Level
**LOW.** Well-maintained package. Generous limits protect against automated attacks without inconveniencing real users.

### Proposed Implementation

```bash
npm install express-rate-limit
```

**In `server/index.ts`**, before `registerRoutes(...)`:

```ts
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15-minute window
  max: 20,                       // 20 requests per window per IP
  standardHeaders: true,         // Emit RateLimit-* headers (RFC 6585)
  legacyHeaders: false,
  skipSuccessfulRequests: true,  // Successful logins don't count toward limit
  message: { message: "Too many attempts. Please try again in 15 minutes." },
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,     // 1-hour window
  max: 10,                       // 10 signups per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many registrations from this address. Please try again later." },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", signupLimiter);
app.use("/api/admin/login", authLimiter);
```

### How to Test
1. Send 21 consecutive `POST /api/auth/login` requests with wrong credentials from the same IP. The 21st must return 429.
2. Confirm the 429 response body matches the configured message.
3. Confirm `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` headers are present on every response.
4. After a successful login, confirm the attempt counter resets (due to `skipSuccessfulRequests: true`).
5. Confirm `POST /api/admin/login` is also limited.
6. **Automated test (`tests/rate-limit.test.ts`):** Use vitest fake timers or a loop of 21 requests. Assert 429 on the 21st and presence of `RateLimit-*` headers.

### Rollback
Remove `express-rate-limit` with `npm uninstall express-rate-limit`. Remove the `authLimiter`, `signupLimiter`, and `app.use` calls from `server/index.ts`.

### Database Migration Required
**No.**

---

## Item 10 — Helmet Security Headers

### Problem
Express does not set security headers by default and exposes `X-Powered-By: Express`. Missing headers: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, Referrer-Policy. `helmet` is not installed and is not in the `script/build.ts` allowlist.

### Files Affected
| File | Change |
|---|---|
| `package.json` | Add `helmet` dependency |
| `server/index.ts` | Apply as first `app.use()` |
| `script/build.ts` | Add `"helmet"` to esbuild allowlist |

### Risk Level
**MEDIUM.** Helmet's default CSP will block Leaflet tile images, Vite's HMR WebSocket, and any inline scripts or styles. The CSP directives below are pre-configured for this app's known resource origins. Any resource not listed will silently fail in the browser — verify with the browser console after applying.

### Proposed Implementation

```bash
npm install helmet
```

**In `server/index.ts`**, as the very first `app.use()`:

```ts
import helmet from "helmet";

const isDev = process.env.NODE_ENV !== "production";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          ...(isDev ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
          // 'unsafe-eval' is required by Vite in development only.
          // Remove once the app has a production build-time CSP nonce strategy.
        ],
        styleSrc: ["'self'", "'unsafe-inline'"],
        // unsafe-inline required by Tailwind CSS and shadcn/ui component styles.
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
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: isDev ? null : [],
      },
    },
    strictTransportSecurity: isDev
      ? false
      : { maxAge: 63072000, includeSubDomains: true, preload: true },
    crossOriginEmbedderPolicy: false,
    // COEP disabled — Leaflet maps require cross-origin resources
  })
);
```

**In `script/build.ts`**: add `"helmet"` to the allowlist array alongside `"express"`.

### How to Test
1. Start the app. In DevTools → Network, inspect any response. Confirm `X-Powered-By` is absent. Confirm `X-Content-Type-Options: nosniff` is present.
2. Open browser console. Confirm zero CSP violation errors on all pages.
3. Navigate to Connections → Map view. Confirm CartoDB tiles load (must pass the `imgSrc` CSP directive).
4. In development, confirm Vite HMR reconnects after file saves (WebSocket must pass `connectSrc`).
5. **Production build test:** Run `npm run build && NODE_ENV=production node dist/index.cjs`. Confirm `Strict-Transport-Security` header is present.
6. **Automated test (`tests/security-headers.test.ts`):** `GET /api/holes`. Assert `X-Content-Type-Options: nosniff` and absence of `X-Powered-By`.

### Rollback
Remove `helmet` with `npm uninstall helmet`. Remove `app.use(helmet(...))` from `server/index.ts`. Remove `"helmet"` from `script/build.ts` allowlist.

### Database Migration Required
**No.**

---

## Item 11 — Admin Route Authorization (Stream/Creator Role Gap)

### Problem
The admin stream and creator management routes have `requireEmployee` but no `requireRole` check — meaning a `Moderator`-role employee can create, edit, and delete live streams and creator accounts. This exceeds the intended Moderator scope (chat moderation only).

**Affected routes (all in `server/routes.ts`, lines ~1385–1470):**

| Method | Route | Current | Required |
|---|---|---|---|
| `POST` | `/api/admin/creators` | `requireEmployee` | `requireEmployee + requireRole("Admin", "Editor")` |
| `PUT` | `/api/admin/creators/:id` | `requireEmployee` | `requireEmployee + requireRole("Admin", "Editor")` |
| `DELETE` | `/api/admin/creators/:id` | `requireEmployee` | `requireEmployee + requireRole("Admin")` |
| `POST` | `/api/admin/streams` | `requireEmployee` | `requireEmployee + requireRole("Admin", "Editor")` |
| `PUT` | `/api/admin/streams/:id` | `requireEmployee` | `requireEmployee + requireRole("Admin", "Editor")` |
| `DELETE` | `/api/admin/streams/:id` | `requireEmployee` | `requireEmployee + requireRole("Admin")` |
| `POST` | `/api/admin/replays` | `requireEmployee` | `requireEmployee + requireRole("Admin", "Editor")` |
| `DELETE` | `/api/admin/replays/:id` | `requireEmployee` | `requireEmployee + requireRole("Admin")` |

**Retained as `requireEmployee` only (Moderators must retain access):**
- `GET /api/admin/chat/:streamId` — chat listing for moderation
- `POST /api/admin/chat/:messageId/delete` — delete a chat message
- `POST /api/admin/chat/moderate` — create moderation action
- `GET /api/admin/chat/moderation/:streamId` — moderation log

### Files Affected
| File | Lines | Change |
|---|---|---|
| `server/routes.ts` | ~1385–1470 | Add `requireRole` to mutating creator/stream/replay routes |

### Risk Level
**LOW.** If no Moderator employees exist yet in production, risk is zero. If Moderators are managing streams today, coordinate before deploying — they will receive 403 after this change.

### Proposed Implementation

```ts
// BEFORE
app.post("/api/admin/streams", requireEmployee, async (req, res) => { ... });

// AFTER
app.post("/api/admin/streams", requireEmployee, requireRole("Admin", "Editor"), async (req, res) => { ... });
```

Apply the same pattern to all eight routes in the table above. No logic changes inside the handlers.

### How to Test
1. Create a test employee with role `Moderator`.
2. Log in as Moderator. `POST /api/admin/streams` → must return 403.
3. `PUT /api/admin/streams/1` → 403.
4. `DELETE /api/admin/streams/1` → 403.
5. `POST /api/admin/chat/1/delete` → 200 (Moderator chat access preserved).
6. Log in as Editor. `POST /api/admin/streams` → 200.
7. **Automated test (`tests/admin-auth.test.ts`):** Assert Moderator receives 403 on stream creation; assert Editor receives 200.

### Rollback
Restore the eight route definitions from `phase-0-baseline` (remove the `requireRole` middleware argument).

### Database Migration Required
**No.**

---

## Item 12 — Remove Remaining Stripe Dead Code (Schema Preserved)

### Problem
Three code locations contain dead Stripe references that will cause confusion in V2 development:

| Location | What | Why remove |
|---|---|---|
| `server/storage.ts:171, 712–714` | `getUserByStripeCustomerId()` interface + implementation | No callers exist — `webhookHandlers.ts` was deleted |
| `server/index.ts:28–29, 106` | Commented-out webhook route and `// Stripe disabled` comments | Stale — actively misleading about current state |
| `script/build.ts:27` | `"stripe"` in esbuild allowlist | Package was uninstalled; entry causes a build warning |

**Schema columns to preserve (no migration in Phase 0):**

| Column | Table | Reason |
|---|---|---|
| `plan` | `users` | Actively used by BILLING_ENABLED gating logic |
| `subscriptionStatus` | `users` | Same |
| `stripeCustomerId` | `users` | Will be repopulated when Phase 4 billing is connected |
| `stripeSubscriptionId` | `users` | Same |

These columns are excluded from API responses by the DTOs introduced in Item 6, so they are invisible to clients while being available for future billing reconnection.

### Files Affected
| File | Lines | Change |
|---|---|---|
| `server/storage.ts` | 171, 712–714 | Delete `getUserByStripeCustomerId` interface and implementation |
| `server/index.ts` | 28–29, 106 | Delete 3 comment lines |
| `script/build.ts` | 27 | Remove `"stripe"` string from allowlist |

### Risk Level
**VERY LOW.** Dead code removal. TypeScript will confirm zero callers exist.

### How to Test
1. `grep -rn "getUserByStripeCustomerId" server/` → zero results.
2. `grep -rn "stripe-replit-sync" .` → zero results.
3. `npm run check` → zero TypeScript errors.
4. `npm run build` → build succeeds, no esbuild warning about missing `stripe` package.
5. `npm run dev` → server starts with no import errors.

### Rollback
Restore `server/storage.ts:171, 712–714`, the 3 comment lines in `server/index.ts`, and `"stripe"` in `script/build.ts` from `phase-0-baseline`.

### Database Migration Required
**No.** Schema columns are intentionally preserved.

---

## Item 13 — Automated Test Setup with `TEST_DATABASE_URL`

### Problem
Zero test coverage exists. Additionally, the previous plan proposed running tests against the development database — this would destroy or corrupt development content on every test run. **Tests must use a separate database.**

`TEST_DATABASE_URL` must be set as a Replit Secret before any tests run. The test setup must hard-fail if this variable is not present.

### Files Affected
| File | Change |
|---|---|
| `package.json` | Add `test`, `test:watch`, `test:coverage` scripts; add dev dependencies |
| `vitest.config.ts` | **New file** — test runner configuration |
| `tests/setup.ts` | **New file** — shared setup: DB connection, server creation, teardown |
| `tests/auth.test.ts` | **New file** — auth route contract tests |
| `tests/admin-auth.test.ts` | **New file** — admin route protection tests |
| `tests/csrf.test.ts` | **New file** — trusted-origin tests (supports Item 5) |
| `tests/rate-limit.test.ts` | **New file** — rate limiter tests (supports Item 9) |
| `tests/pagination.test.ts` | **New file** — pagination validation tests (supports Item 8) |
| `tests/admin-validation.test.ts` | **New file** — Zod PUT validation tests (supports Item 7) |
| `tests/security-headers.test.ts` | **New file** — helmet header tests (supports Item 10) |
| `tests/startup.test.ts` | **New file** — env var requirement tests (supports Items 1 and 2) |
| `tests/billing-flag.test.ts` | **New file** — BILLING_ENABLED flag tests (supports Item 4) |

### Risk Level
**LOW.** Tests do not change application code. `TEST_DATABASE_URL` isolation prevents data loss.

### Proposed Implementation

**Install:**
```bash
npm install --save-dev vitest @vitest/coverage-v8 supertest @types/supertest
```

**`package.json` scripts:**
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

**`vitest.config.ts`:**
```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 20000,
    pool: "forks",       // isolate each test file in a separate process
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["server/**/*.ts"],
      exclude: ["server/vite.ts", "server/static.ts", "server/seed*.ts"],
    },
  },
});
```

**`tests/setup.ts`:**
```ts
import { beforeAll, afterAll } from "vitest";
import type { Server } from "http";

// Hard fail if TEST_DATABASE_URL is not set.
// Tests must never run against the development or production database.
if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    "[test setup] TEST_DATABASE_URL environment variable is required to run tests. " +
    "Create a separate test database and add TEST_DATABASE_URL to Replit Secrets. " +
    "This prevents tests from modifying development or production data."
  );
}

// Override DATABASE_URL so all server code uses the test database
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

// Required for server startup — use test-specific values
process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? "test-session-secret-minimum-32-chars!!";
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "TestAdminPassword!123";
process.env.BILLING_ENABLED = "false";
process.env.NODE_ENV = "test";

let server: Server;

beforeAll(async () => {
  // Import app after env overrides are applied
  const { createApp } = await import("../server/app");
  server = await createApp();
  // Export server for use in test files via a module-level variable
  (global as any).__testServer = server;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
```

**Note on `createApp` extraction:**  
The test setup requires `server/index.ts` to export a factory function (`createApp`) rather than immediately starting the server. This is a small refactor of `server/index.ts`: move the `app` creation, middleware registration, and `registerRoutes` call into an exported `createApp()` function. The existing `(async () => { ... })()` IIFE at the bottom becomes:

```ts
// server/index.ts bottom
if (require.main === module || process.env.NODE_ENV !== "test") {
  createApp().then((server) => {
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen({ port, host: "0.0.0.0" }, () => {
      log(`serving on port ${port}`);
    });
  });
}
```

This pattern is standard for testable Express apps and does not change any existing behaviour.

**Test database setup instructions (to document in `README.md` or `CONTRIBUTING.md`):**
1. Create a new PostgreSQL database in Replit: `createdb rabbit_hole_test` (or provision via Replit DB UI)
2. Run migrations against it: `DATABASE_URL=$TEST_DATABASE_URL npm run db:push`
3. Add `TEST_DATABASE_URL` to Replit Secrets
4. Tests will run migrations and seed minimal data in `tests/setup.ts`; each test suite cleans up after itself using transactions or table truncation

**Key test cases per file:**

```
tests/auth.test.ts
  POST /api/auth/signup
    ✓ creates user with valid email + password (≥6 chars)
    ✓ 400 if email missing
    ✓ 400 if password < 6 chars
    ✓ 409 if email already registered
    ✗ response must not contain passwordHash
    ✗ response must not contain stripeCustomerId
    ✗ response must not contain stripeSubscriptionId
  POST /api/auth/login
    ✓ 200 + user data on valid credentials
    ✓ 401 on wrong password
    ✓ 401 on unknown email
    ✓ connect.sid cookie set on success
    ✓ connect.sid changes after login (session regeneration)
    ✗ response must not contain passwordHash
  POST /api/auth/logout
    ✓ 200 + cookie cleared
  GET /api/auth/me
    ✓ 401 when not authenticated
    ✓ 200 + user data when authenticated
    ✗ response must not contain passwordHash

tests/admin-auth.test.ts
  ✓ 401 on all /api/admin/* routes without employee session
  ✓ 403 on Admin-only routes when logged in as Editor
  ✓ 403 on Admin/Editor routes when logged in as Moderator (after Item 11)
  ✓ Admin login succeeds; sets employeeId session
  ✗ Employee response must not contain passwordHash

tests/csrf.test.ts
  ✓ POST /api/auth/login with correct Origin → 200
  ✓ POST /api/auth/login with mismatched Origin → 403
  ✓ POST /api/auth/login with no Origin (production mode) → 403
  ✓ GET /api/holes with no Origin → 200 (GET is exempt)

tests/pagination.test.ts
  ✓ GET /api/timeline?limit=0 → 400
  ✓ GET /api/timeline?limit=101 → 400
  ✓ GET /api/timeline?offset=-1 → 400
  ✓ GET /api/timeline?limit=20&offset=0 → 200
  ✓ GET /api/library/search?q=test&limit=-5 → 400

tests/billing-flag.test.ts
  BILLING_ENABLED=false:
    ✓ GET /api/holes/:slug/access → { hasFullAccess: true }
    ✓ GET /api/streams/:id (premium stream) → { premiumEmbedUrl: "" }
    ✓ GET /api/streams/:id (premium stream) → { billingDisabled: true }

tests/security-headers.test.ts
  ✓ GET /api/holes → X-Content-Type-Options: nosniff present
  ✓ GET /api/holes → X-Powered-By absent
  ✓ GET /api/holes → Content-Security-Policy present
```

### How to Test
```bash
# Requires TEST_DATABASE_URL to be set
npm test                 # All tests, once
npm run test:watch       # Watch mode during development
npm run test:coverage    # Coverage report in coverage/
```

**Minimum passing bar for Phase 0 completion:** `auth.test.ts`, `admin-auth.test.ts`, `csrf.test.ts`, and `security-headers.test.ts` must be fully green. All others must be green or in a documented known-failure state with an open issue.

### Rollback
Delete the `tests/` directory and `vitest.config.ts`. Remove the three test scripts from `package.json`. Uninstall `vitest`, `supertest`, and `@types/supertest`. Restore `server/index.ts` if the `createApp` extraction was applied.

### Database Migration Required
**No** for application tables. The test database requires `npm run db:push` to initialise its schema (same DDL, separate database).

---

## Item 14 — Build and Publish Verification

### Problem
After Phase 0 changes — new packages installed, packages removed, imports added, `script/build.ts` allowlist modified — the production bundle must be verified before publishing. Publishing without a passing build check risks deploying a broken app.

### Files Affected
This is a verification item only. The one file change is additive:

| File | Change |
|---|---|
| `script/build.ts` | Add `"helmet"`, `"express-rate-limit"` to allowlist; remove `"stripe"` (done in Item 12) |

### Required `script/build.ts` Allowlist State After Phase 0

The current allowlist includes packages that are not installed (`stripe`, `jsonwebtoken`, `@google/generative-ai`, `openai`, `nodemailer`, `multer`, `nanoid`, `xlsx`, `uuid`, `axios`, `cors`, `multer`). These cause esbuild to skip bundling non-existent packages — harmless, but noisy. The authoritative diff for Phase 0:

```ts
// ADD:
"helmet",
"express-rate-limit",

// REMOVE:
"stripe",           // Uninstalled — Item 12

// LEAVE (future integrations — not installed yet, not harmful to list):
"openai",
"@google/generative-ai",
"jsonwebtoken",
"nodemailer",
```

### Verification Sequence

Run in this exact order after all Phase 0 items are implemented:

```bash
# Step 1: TypeScript correctness (fast — no bundling)
npm run check

# Step 2: Full production bundle
npm run build
# Must produce: dist/index.cjs and dist/public/

# Step 3: Smoke-test the production bundle locally
SESSION_SECRET="test-secret-minimum-32-chars!!" \
ADMIN_PASSWORD="TestAdmin!123" \
DATABASE_URL="$DATABASE_URL" \
BILLING_ENABLED="false" \
NODE_ENV=production \
node dist/index.cjs &
sleep 3

# Step 4: Verify endpoints respond
curl -s http://localhost:5000/api/holes | head -c 100
curl -s http://localhost:5000/api/categories | head -c 100
curl -o /dev/null -w "%{http_code}" http://localhost:5000/api/auth/me

# Step 5: Verify security headers
curl -sI http://localhost:5000/api/holes | grep -iE "x-content-type|content-security|x-frame|x-powered-by"

# Expected: x-content-type-options present, x-frame-options present, x-powered-by ABSENT

# Step 6: Confirm startup env var requirements
ADMIN_PASSWORD="" SESSION_SECRET="" NODE_ENV=production node dist/index.cjs
# Must exit immediately with a descriptive error message
```

### Rollback
If the production build fails after Phase 0 changes, restore from the `phase-0-baseline` checkpoint. Re-run `npm install` to restore the pre-Phase-0 `node_modules`. Identify which item caused the build failure and address it before re-attempting.

### Database Migration Required
**No.**

---

## Summary Table

| # | Item | Risk | New Packages | DB Migration | Env Vars Required |
|---|---|---|---|---|---|
| 1 | Require `ADMIN_PASSWORD` everywhere; no fallback, no logging | LOW | — | No | `ADMIN_PASSWORD` |
| 2 | Require `SESSION_SECRET` everywhere; no fallback | LOW | — | No | `SESSION_SECRET` |
| 3 | Session regeneration on all login handlers | LOW-MED | — | No | — |
| 4 | `BILLING_ENABLED` feature flag; no URL exposure for premium streams | LOW | — | No | `BILLING_ENABLED` |
| 5 | Trusted-origin CSRF middleware | MEDIUM | — | No | — |
| 6 | Safe response DTOs (`toUserDTO`, `toEmployeeDTO`) | LOW | — | No | — |
| 7 | Zod validation on all admin PUT routes | LOW-MED | — | No | — |
| 8 | Pagination limits; reject invalid offsets | LOW | — | No | — |
| 9 | Rate limiting on auth routes | LOW | `express-rate-limit` | No | — |
| 10 | Helmet security headers with CSP | MEDIUM | `helmet` | No | — |
| 11 | Admin role gap on stream/creator/replay routes | LOW | — | No | — |
| 12 | Remove Stripe dead code; preserve schema columns | VERY LOW | — | No | — |
| 13 | Automated test setup with `TEST_DATABASE_URL` | LOW | `vitest`, `supertest` | No* | `TEST_DATABASE_URL` |
| 14 | Build and publish verification | LOW | — | No | All above |

*Test database requires `npm run db:push` against `TEST_DATABASE_URL` — same schema, separate database. No production data is touched.

---

## Implementation Order

Dependencies exist between items. Implement in this sequence:

```
1. Items 1 + 2     — env var requirements (must go first; block startup if missing)
2. Item 12         — remove dead code (clear the codebase before adding new things)
3. Item 6          — DTOs (required by Item 3's session regenerate blocks)
4. Item 3          — session regeneration (uses DTOs from Item 6)
5. Item 4          — BILLING_ENABLED flag
6. Items 7 + 8     — Zod validation + pagination (server-only, no dependencies)
7. Items 9 + 10    — install packages (rate-limit + helmet); update build allowlist
8. Item 5          — CSRF middleware (after rate-limit and helmet are in place)
9. Item 11         — role gap fix (isolated route change)
10. Item 13        — test setup (validates all above)
11. Item 14        — build verification (final gate before publishing)
```

---

## Definition of Done

Phase 0 is complete when all of the following are true:

- [ ] Server refuses to start without `ADMIN_PASSWORD` set (any environment)
- [ ] Server refuses to start without `SESSION_SECRET` set (any environment)
- [ ] No password value appears anywhere in server logs at any time
- [ ] `connect.sid` cookie value changes after every successful login
- [ ] Auth endpoints return 429 after 20 failed attempts per IP within 15 minutes
- [ ] All responses include `X-Content-Type-Options: nosniff` and lack `X-Powered-By`
- [ ] No CSP violations appear in the browser console on any page
- [ ] POST/PUT/DELETE requests from a mismatched origin return 403
- [ ] `GET /api/auth/me` response contains no `passwordHash`, `stripeCustomerId`, or `stripeSubscriptionId`
- [ ] `GET /api/admin/employees` response contains no `passwordHash` on any employee object
- [ ] `BILLING_ENABLED=false` causes `GET /api/holes/:slug/access` to return `{ hasFullAccess: true }`
- [ ] `BILLING_ENABLED=false` causes premium stream/replay endpoints to return empty embed URLs
- [ ] All admin PUT routes reject malformed bodies with 400 + Zod error details
- [ ] `GET /api/timeline?offset=-1` returns 400
- [ ] Moderator employees receive 403 on stream/creator/replay create, update, delete routes
- [ ] `grep -rn "getUserByStripeCustomerId\|stripe-replit-sync" server/` returns zero results
- [ ] `npm run check` exits 0 (zero TypeScript errors)
- [ ] `npm run build` exits 0 and produces `dist/index.cjs` and `dist/public/`
- [ ] `npm test` exits 0 (all tests green)
- [ ] Replit deployment succeeds; the published app loads all pages without console errors

---

## Data Preservation Guarantee

No Phase 0 item drops, truncates, renames, or alters any database table or column. The following schema elements are explicitly preserved:

- `users.plan`, `users.subscriptionStatus`, `users.stripeCustomerId`, `users.stripeSubscriptionId` — preserved for Phase 4 billing reconnection
- All 27 tables and their columns remain untouched
- All seeded content (investigations, people, timeline items, geo data) remains untouched
- All user accounts and employee accounts remain untouched
- The `user_sessions` table is unaffected (session regeneration creates new rows; it does not truncate)

---

*Revised plan complete. No application code was modified during this document's creation.*
