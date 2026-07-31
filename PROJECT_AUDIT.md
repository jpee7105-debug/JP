# Rabbit Hole — Project Audit
**Date:** July 31, 2026  
**Auditor:** Lead Software Architect  
**Scope:** Full codebase review — no files modified

---

## 1. Tech Stack

### Frontend
| Layer | Technology | Version |
|---|---|---|
| Framework | React | 18 |
| Language | TypeScript | ~5.x |
| Build Tool | Vite | 6.x |
| Styling | Tailwind CSS | v4 |
| Component Library | shadcn/ui + Radix UI | latest |
| Routing | Wouter | ~3.x |
| Data Fetching | TanStack Query (React Query) | v5 |
| Map Rendering | Leaflet + react-leaflet + react-leaflet-cluster | 1.9.4 / 5.0 / 4.0 |
| Rich Text | Custom `RichText.tsx` component | — |
| Icons | lucide-react | latest |
| Fonts | Custom display + mono (via CSS) | — |

### Backend
| Layer | Technology | Notes |
|---|---|---|
| Runtime | Node.js | via tsx |
| Framework | Express.js | TypeScript |
| TypeScript Runner | tsx | dev + prod |
| ORM | Drizzle ORM | node-postgres driver |
| Database | PostgreSQL | Replit managed |
| Session Store | connect-pg-simple | `user_sessions` table |
| Password Hashing | bcrypt | 12 rounds |
| Validation | drizzle-zod + manual | inconsistently applied |

### Shared
| Item | Detail |
|---|---|
| Schema | `shared/schema.ts` — single source of truth for all 27 tables |
| Type sharing | Drizzle inferred types re-exported and imported on both sides |

### Dev Tooling
- **Drizzle Kit** — migrations
- **PostCSS** — CSS processing
- **eslint** — not confirmed configured
- **No test framework** — zero test coverage

---

## 2. Folder Structure and Purpose

```
/
├── client/                        # React/Vite frontend
│   ├── index.html                 # Browser entry point
│   ├── public/                    # Static assets (favicon, OG image)
│   └── src/
│       ├── App.tsx                # Root router — splits admin vs public
│       ├── main.tsx               # React bootstrap
│       ├── index.css              # Global design tokens + Tailwind
│       ├── assets/images/         # UI imagery (hero, network, docs)
│       ├── components/            # Reusable app components
│       │   ├── ui/                # ~50 shadcn/Radix primitives
│       │   ├── AdminLayout.tsx    # Admin shell + nav + role context
│       │   ├── AutosaveIndicator  # Unsaved state indicator
│       │   ├── CitationLink.tsx   # Inline citation renderer
│       │   ├── IntelMap.tsx       # Leaflet geographic intelligence map
│       │   ├── Navbar.tsx         # Public navigation bar
│       │   ├── OnboardingTour.tsx # First-run guided tour
│       │   ├── RedThread.tsx      # Narrative connection visualizer
│       │   └── RichText.tsx       # Rich text renderer
│       ├── hooks/                 # Custom React hooks
│       │   ├── useAuth.ts         # Auth state + login/logout/signup
│       │   ├── use-mobile.tsx     # Responsive breakpoint detection
│       │   ├── useOnboarding.ts   # Onboarding tour state
│       │   ├── use-toast.ts       # Toast notification state
│       │   └── useUnsavedChanges  # Dirty-state/unsaved form guard
│       ├── lib/
│       │   ├── citations.ts       # Citation parsing + link resolution
│       │   ├── queryClient.ts     # TanStack Query client + apiRequest helper
│       │   └── utils.ts           # Shared utility functions
│       └── pages/                 # One file per route
│           ├── (Public pages)     # Home, Discover, RabbitHole, DepthReader, etc.
│           └── (Admin pages)      # Admin, AdminInvestigationEditor, AdminLive, AdminPeople, AdminTimeline
│
├── server/
│   ├── index.ts                   # Express app bootstrap + session + startup
│   ├── routes.ts                  # ALL 113 API routes (~1982 lines — monolith)
│   ├── storage.ts                 # ALL database queries (~1300 lines — monolith)
│   ├── static.ts                  # Production static file serving
│   ├── vite.ts                    # Vite dev server integration
│   ├── seed-geo.ts                # Seeds geographic coordinates for map
│   └── seed-content.ts (scripts/) # Seeds demo investigations + content
│
├── shared/
│   └── schema.ts                  # Drizzle schema — 27 tables, 473 lines
│
├── migrations/                    # Drizzle-generated SQL migrations
├── artifacts/                     # Mockup sandbox templates
├── attached_assets/               # Product briefs + UX specs (text files)
├── scripts/                       # Build + content seed scripts
├── drizzle.config.ts              # Drizzle Kit configuration
├── vite.config.ts                 # Vite configuration + path aliases
├── components.json                # shadcn/ui configuration
└── replit.md                      # Project documentation
```

---

## 3. Existing Pages and Routes

### Public Pages
| Path | Component | Auth Required | Notes |
|---|---|---|---|
| `/` | Home | No | Landing + hero |
| `/discover` | Discover | No | Browse investigations by category |
| `/login` | Login | No | Email/password login |
| `/signup` | Signup | No | Registration |
| `/account` | Account | Yes (enforced in page) | User profile + plan status |
| `/rabbithole/:slug` | RabbitHole | No | Investigation detail + depth nodes (gated) |
| `/rabbithole/:slug/read` | DepthReader | No | Immersive depth reader (Pro gated) |
| `/search` | Search | No | Full-text search |
| `/profile` | Profile | No | User public profile |
| `/connections` | Connections | No | Graph / family tree / map explorer |
| `/people/:handle` | PersonDetail | No | Individual person profile |
| `/live` | Live | No | Live streams + replays hub |
| `/channel/:handle` | Channel | No | Creator channel page |
| `/watch/:streamId` | Watch | No | Live stream viewer (Pro gated) |
| `/replay/:streamId` | Replay | No | Replay viewer (Pro gated) |
| `/library` | Library | No | Works index |
| `/library/:workSlug` | LibraryWork | No | Work detail |
| `/library/:workSlug/:bookSlug` | LibraryBook | No | Book detail |
| `/library/:workSlug/:bookSlug/:chapterNumber` | LibraryChapter | No | Chapter + verses |
| `/timeline` | Timeline | No | Global investigation timeline |
| `/guide` | Guide | No | User guide / help |
| `/pricing` | Pricing | No | Plan comparison (Pro "Coming Soon") |
| `/qa` | QA | No | Q&A page |

### Admin Pages (all require employee session)
| Path | Component | Role Required |
|---|---|---|
| `/admin` | Admin (tabbed dashboard) | Any employee |
| `/admin/investigations/:slug` | AdminInvestigationEditor | Editor+ |
| `/admin/live` | AdminLive | Any employee |
| `/admin/people` | AdminPeople | Any employee |
| `/admin/timeline` | AdminTimeline | Any employee |

### API Endpoints (113 total)
- **Auth:** 5 endpoints (signup, login, logout, me — dual user/employee)
- **Investigations:** 12 endpoints (public browse + admin CRUD)
- **Depth Nodes / Claims / Sources / Media:** ~20 endpoints
- **People / Relationships:** 8 endpoints
- **Comments:** 4 endpoints
- **Podcasts / Episodes / Sponsorship:** 10 endpoints
- **Live / Streams / Replays / Chat / Moderation:** 20 endpoints
- **Library:** 5 endpoints
- **Timeline (global + per-investigation):** 12 endpoints
- **Map:** 1 endpoint
- **Employees / Audit:** 6 endpoints
- **Search / Categories / Access:** 5 endpoints

---

## 4. Existing Features

### Core Content System
- **Investigations (Rabbit Holes):** Categorised deep-dive articles with slug-based routing, featured images, tags, credibility ratings, status workflow (Draft → Review → Published), and view counts.
- **Depth Nodes:** Hierarchical layered content within each investigation (numbered levels). Free users see first 2 nodes; Pro users see all. Nodes contain narrative, claims, sources, media, and timeline entries.
- **Claims System:** Structured evidence claims attached to depth nodes with credibility ratings.
- **Sources:** Citation-linked sources attached to claims/nodes; rendered inline via `CitationLink`.
- **Media:** Attached images/documents per depth node.

### Discovery & Navigation
- **Discover Page:** Browse by category with grid/list view toggle, tag filters, and pill-style category selector.
- **Search:** Full-text search across investigations.
- **Timeline:** Chronological global event timeline with tag filters, pagination, and per-investigation event linking.
- **Red Thread:** Narrative visualizer connecting related investigations and people.

### Connections Explorer
- **Graph View:** Force-directed network graph of investigations and people (custom SVG canvas, no library).
- **Family Tree View:** Hierarchical tree for people relationships.
- **Map View:** Leaflet-based geographic intelligence map with clustered markers for investigations and timeline events. Diamond/circle custom SVG markers, CartoDB dark tile layer, filter panel.

### People & Intelligence
- **Person Profiles:** Individual profiles with nationality, bio, associated investigations, credibility score.
- **Relationships:** Typed relationship graph between people (family, associate, etc.).
- **PersonDetail Page:** Public-facing person profile.

### Live & Streaming
- **Streams:** Live, upcoming, and ended streams linked to creators/channels.
- **Replays:** Archived stream replays with premium gating.
- **Chat:** Real-time chat attached to live streams with moderation.
- **Creators / Channels:** Creator identity layer with channel pages.

### Library
- **Hierarchical structure:** Works → Books → Chapters → Verses.
- **Search:** Full-text search within library content.
- **Verse Preview:** Inline preview pop-overs.

### Podcasts
- Per-investigation podcast series with episodes, episode links, and sponsorship slots with date-range scheduling.

### Admin CMS
- **Investigation Editor:** Full CRUD for rabbit holes, depth nodes, claims, sources, media, timeline entries; drag/reorder; autosave indicator.
- **People Manager:** Create/edit people profiles and relationships.
- **Timeline Manager:** Global timeline CRUD, status workflow, promotion from investigation events.
- **Live Manager:** Stream and creator management, chat moderation panel.
- **Audit Log:** History of content changes.
- **Validation Tools:** Content health checks.
- **Employee Management:** Admin-only; manage staff accounts and roles.

### User System
- Registration, login, profile, plan/status display.
- Onboarding tour (first-run walkthrough).
- Account page with plan badge and guide links.

---

## 5. Database Structure

**27 tables** defined in `shared/schema.ts`.

### Content Tables
| Table | Key Columns | Notes |
|---|---|---|
| `categories` | id, name, slug, description, icon | Investigation categories |
| `rabbit_holes` | id, slug, title, summary, categoryId, status, credibility, latitude, longitude, city, country, tags (jsonb), viewCount | Core investigation records |
| `depth_nodes` | id, holeId, nodeNumber, title, narrative, status, tags (jsonb) | Layered investigation content |
| `claims` | id, nodeId, statement, credibility, status | Structured evidence claims |
| `sources` | id, claimId, title, url, type, reliability | Citation sources |
| `media` | id, holeId, nodeId, type, url, caption | Attached media |
| `comments` | id, holeId, userId, content, status | User comments per investigation |

### User & Employee Tables
| Table | Key Columns | Notes |
|---|---|---|
| `users` | id (uuid), email, passwordHash, name, plan, subscriptionStatus, stripeCustomerId, stripeSubscriptionId, lastLoginAt | Public users |
| `employees` | id (uuid), email, passwordHash, name, role, isActive | Admin staff |
| `user_sessions` | sid, sess, expire | PostgreSQL session store |
| `audit_logs` | id, employeeId, action, entityType, entityId, changes (jsonb) | Admin change history |

### People & Relationships
| Table | Key Columns | Notes |
|---|---|---|
| `people` | id, fullName, handle, bio, nationality, credibility, latitude, longitude, status, imageUrl | Intelligence subject profiles |
| `relationships` | id, personAId, personBId, type, description, status | Typed person–person relationships |

### Media & Distribution
| Table | Key Columns | Notes |
|---|---|---|
| `podcasts` | id, holeId, title, description, status | Per-investigation podcast series |
| `podcast_episodes` | id, podcastId, title, status, publishedAt | Individual episodes |
| `podcast_episode_links` | id, episodeId, platform, url | Platform distribution links |
| `podcast_sponsored_slots` | id, episodeId, holeId, sponsor, startDate, endDate | Sponsorship scheduling |

### Live & Streaming
| Table | Key Columns | Notes |
|---|---|---|
| `creators` | id, handle, name, bio, avatarUrl, isActive | Channel identities |
| `streams` | id, creatorId, title, status, embedUrl, premiumEmbedUrl, scheduledAt | Live/upcoming/ended streams |
| `stream_replays` | id, streamId, title, url, isPremium | Archived replays |
| `live_chat_messages` | id, streamId, userId, content, isDeleted | Chat messages |
| `chat_moderation_actions` | id, streamId, employeeId, type, reason | Moderation log |

### Library
| Table | Key Columns | Notes |
|---|---|---|
| `library_works` | id, slug, title, description | Top-level works |
| `library_books` | id, workId, slug, title | Books within works |
| `library_chapters` | id, bookId, chapterNumber, title | Chapters |
| `library_verses` | id, chapterId, verseNumber, content | Individual verses |

### Timeline
| Table | Key Columns | Notes |
|---|---|---|
| `global_timeline_items` | id, date, title, summary, status, lat, lng, city, country, tags (jsonb), linkedInvestigationSlug | Cross-investigation event timeline |

**Schema Notes:**
- `users.id` and `employees.id` use UUID (`gen_random_uuid()`); all other PKs use serial integer.
- Inconsistent ID type strategy creates join complexity.
- `jsonb` used for tags throughout — no separate tags table, so tag-based queries cannot use foreign key constraints.
- No explicit database-level foreign key indexes on frequently joined columns (e.g. `depth_nodes.hole_id`, `claims.node_id`).

---

## 6. Authentication System

### Public Users
- **Mechanism:** Express-session with PostgreSQL store (`user_sessions` table).
- **Cookie:** `connect.sid`, httpOnly, SameSite=lax, 30-day expiry, secure in production only.
- **Signup:** Email + password (≥6 chars), bcrypt 12 rounds, plan defaults to `Free`, subscriptionStatus to `none`.
- **Login:** Email lookup → bcrypt compare → set `req.session.userId` → return sanitized user (no passwordHash).
- **Session check:** `GET /api/auth/me` — reloads user from DB each request.
- **Client:** `useAuth` hook caches with TanStack Query (5-minute stale time, no retries on 401).

### Admin / Employees
- **Separate session field:** `req.session.employeeId` — completely independent from user auth.
- **Roles:** `Admin`, `Editor`, `Moderator`.
- **Middleware:** `requireEmployee` checks active status; `requireRole('Admin')` enforces role.
- **Default seeding:** On startup, if no employees exist, creates `admin@rabbithole.io` with password `rabbithole2024` (or `ADMIN_PASSWORD` env var) and logs the password to console.

### Access Control
- Free vs Pro gating: depth nodes beyond level 2, premium stream embeds, and premium replays check `user.plan === 'Pro' && user.subscriptionStatus === 'active'`.
- With Stripe removed, no user can currently be upgraded to Pro — the gating logic remains but the upgrade path is broken.

---

## 7. AI Integrations

**There are no active AI/LLM integrations.**

The product is marketed as "AI-powered investigative research" but has zero AI implementation in the current codebase. No calls to OpenAI, Anthropic, or any other LLM provider exist anywhere in the code. No embeddings, no vector search, no AI-generated summaries.

This is a significant gap between branding and reality.

---

## 8. APIs Used

### Internal APIs
- 113 REST endpoints on Express (see Section 3).
- All JSON over HTTP; no GraphQL, no WebSockets (live chat uses polling).

### External APIs
- **None currently active.** Stripe has been removed. No other third-party API calls found.

### Previously Used / Removed
- **Stripe** — removed. Schema remnants remain (see Section 9).

### Missing / Not Yet Integrated
- LLM/AI API (OpenAI, Anthropic) — referenced in branding, not implemented.
- Email delivery — no email sending for signup verification, password reset, or notifications.
- File/image storage — images referenced by URL only; no object storage (S3/R2) integration.
- WebSockets — live chat uses HTTP polling, not real-time.

---

## 9. Stripe Remnants

Stripe has been removed from the application but several remnants remain:

### Schema (Cannot change without migration)
`shared/schema.ts` lines 115–118:
- `users.plan` — `text`, defaults to `"Free"`
- `users.subscriptionStatus` — mapped to `subscription_status`, defaults to `"none"`
- `users.stripeCustomerId` — mapped to `stripe_customer_id`
- `users.stripeSubscriptionId` — mapped to `stripe_subscription_id`

### Server
- `server/storage.ts:712–714` — `getUserByStripeCustomerId()` method still present.
- `server/index.ts:28–29, 106` — commented-out disabled Stripe webhook block + comment.

### Client
- `client/src/hooks/useAuth.ts` — `AuthUser` type includes `plan` and `subscriptionStatus`.
- `client/src/pages/Account.tsx` — renders plan badge (Free/Pro) and subscription status labels.
- `client/src/pages/Pricing.tsx` — renders Pro as "Coming Soon" at $9/month.
- `client/src/pages/RabbitHole.tsx` and `DepthReader.tsx` — Pro access gating logic present but unactivatable.
- `client/src/pages/Watch.tsx:286` — premium stream access checks `plan !== 'Pro'`.

### Impact
- Pro content (depth nodes 3+, premium streams, premium replays) is permanently inaccessible to all users until a payment system is reconnected.
- No user can be upgraded; plan field is permanently `"Free"` for all signups.
- The access-gating code is otherwise correct — reconnecting a payment provider would re-enable it.

---

## 10. Broken or Unfinished Features

### Confirmed Broken
| Feature | Issue |
|---|---|
| **Pro Upgrade Path** | Stripe removed; no mechanism exists to set `plan = 'Pro'`. All premium content is permanently inaccessible. |
| **Password Reset** | No forgot-password flow, no email delivery. Users who forget their password cannot recover their account. |
| **Email Verification** | No email sent on signup. Accounts are unverified. |
| **Live Chat** | Uses HTTP polling — not real-time. Will feel laggy or broken on active streams. No WebSocket implementation. |
| **AI Features** | Branding says "AI-powered" — zero AI implementation exists. |
| **Profile Page** | `/profile` route exists but unclear if it renders anything meaningful for the current user vs a public view. |

### Partially Built / Incomplete
| Feature | Issue |
|---|---|
| **Connections Map** | Geographic data only seeded for investigations and timeline items; people have no geo data (test placeholders only). |
| **Podcast System** | Full CRUD exists in admin, but no public-facing podcast player UI — just links to external platforms. |
| **Sponsored Slots** | Sponsorship scheduling logic exists but date-range checking is done in JS application code, not SQL. |
| **QA Page** | `/qa` route exists; content/purpose unclear — appears to be a placeholder. |
| **Library** | Full hierarchy exists but appears manually populated; no authoring tools in admin for library content. |
| **RedThread Component** | Exists as a component but it is unclear if it is surfaced anywhere in the public UI routing. |
| **Validation Tools** | Present in admin tab; scope and reliability unknown without deeper testing. |

---

## 11. Technical Debt

### Critical
- **`server/routes.ts` is 1,982 lines** — a single file handling all 113 routes across every domain. Impossible to maintain at scale. No separation of concerns.
- **`server/storage.ts` is ~1,300 lines** — a single `DatabaseStorage` class with all queries for every table. God-class antipattern.
- **No code splitting / lazy loading** — all 23 page components are statically imported in `App.tsx`. Bundle size will balloon as features are added. Initial load delivers the entire app.

### High
- **N+1 query patterns** — podcast episode loading in `storage.ts:858–874` performs 1 query per episode link, then 1 per found episode; sponsored slot logic (`:876–892`) loads all active slots for a hole then filters in JS. Under load these will cause latency spikes.
- **In-memory filtering** — multiple methods load excessive data and filter in the application layer rather than in SQL (`WHERE` clauses).
- **TypeScript `any` overuse** — admin update handlers use `as any` casts to bypass type checking on storage updates, eliminating compile-time safety.
- **No input validation on update endpoints** — admin PUT routes pass raw `req.body` objects directly to storage with minimal or no schema validation. A malformed request can write garbage to the database.
- **Unbounded pagination** — public timeline and library search endpoints accept arbitrary `limit`/`offset` values. A single request could attempt to load the entire database.

### Medium
- **Inconsistent ID types** — `users` and `employees` use UUID; all other tables use serial integer. This creates inconsistency in foreign key handling and makes cross-domain joins awkward.
- **No database indexes documented** — frequently joined columns (`hole_id`, `node_id`, `person_id`) rely on Drizzle defaults; no explicit index definitions seen in schema.
- **Tags stored as jsonb arrays** — prevents efficient tag-based querying or tag management. A proper tags table with a join table would be more robust.
- **Missing error boundaries** — no React `ErrorBoundary` components anywhere. A single component crash will white-screen the entire app.
- **Connections.tsx** — likely extremely large (force graph + family tree + map + all state in one file based on observed complexity). Needs splitting into separate view components.
- **No test coverage** — zero unit, integration, or end-to-end tests. No test runner configured.
- **Audit log is write-only** — changes are logged, but there is no rollback/restore functionality.

### Low
- Console.log statements left in production paths.
- `package.json` includes `seed-stripe` script pointing to now-deleted file.
- `attached_assets/` directory contains 18 plain-text product brief files committed to the repo — these are internal documents, not application assets.
- `artifacts/mockup-sandbox/` committed to repo — development mockup artifact, not production code.

---

## 12. Security Concerns

### HIGH — Default Admin Credentials Logged to Console
`server/routes.ts:62–73`: On startup with an empty employee table, the server creates `admin@rabbithole.io` with password `rabbithole2024` (or `ADMIN_PASSWORD` env var) and **logs the password to stdout**. If `ADMIN_PASSWORD` is unset in production, the default credentials are publicly known and the password appears in server logs.
**Fix:** Require `ADMIN_PASSWORD` env var in production, never log credentials, fail startup if not set.

### HIGH — Employee/User Responses May Expose Sensitive Fields
`shared/schema.ts:110–122`: `users` rows include `stripeCustomerId`, `stripeSubscriptionId`; `employees` rows include `passwordHash`. While login/me endpoints manually strip these, many admin endpoints return full Drizzle-inferred row objects without explicit DTO projection. Any endpoint that returns a user or employee object that was not explicitly sanitized is a data exposure risk.
**Fix:** Define explicit response DTOs; never return raw database rows.

### MEDIUM — No Session Regeneration on Login (Session Fixation)
`server/routes.ts:95–102` (admin login) and `:165–176` (user login) assign a session ID to an existing session without calling `req.session.regenerate()`. An attacker who can set a victim's pre-auth session cookie retains access after the victim logs in.
**Fix:** Call `req.session.regenerate()` before setting `userId`/`employeeId`, then migrate session data.

### MEDIUM — Missing Input Validation on Admin Updates
Several admin PUT handlers pass `req.body` directly to storage without schema validation. Invalid data types, extra fields, or out-of-range values can corrupt database records.
**Fix:** Apply drizzle-zod or Zod schemas to all update endpoints, same as insert endpoints.

### MEDIUM — No CSRF Protection
SameSite=Lax reduces risk for top-level navigations, but does not protect all cross-site scenarios. No CSRF token mechanism is implemented. If CORS is ever relaxed, this becomes a critical gap.
**Fix:** Add CSRF token middleware (e.g. `csrf` package or `helmet`).

### MEDIUM — Unbounded Pagination Parameters
`GET /api/timeline` and `/api/library/search` accept user-supplied `limit` and `offset` without lower-bound validation. Negative values or very large limits could cause unexpected DB behavior.
**Fix:** Clamp limit to a safe range (e.g. 1–100) and reject negative offsets.

### LOW — Predictable Development Session Secret
`server/index.ts:45`: Falls back to `"rabbit-hole-dev-session-secret"` in non-production. If a development instance is inadvertently internet-exposed, sessions can be forged.
**Fix:** Require `SESSION_SECRET` in all environments, not just production.

### LOW — No Rate Limiting
No rate limiting on auth endpoints (`/api/auth/login`, `/api/auth/signup`, `/api/admin/login`). Brute-force attacks on passwords and account enumeration via timing are possible.
**Fix:** Apply `express-rate-limit` to all auth endpoints.

### LOW — No `helmet` Middleware
No security headers (CSP, X-Frame-Options, HSTS, etc.) configured. Express defaults expose `X-Powered-By: Express`.
**Fix:** Add `helmet` as first middleware.

---

## 13. Components Worth Keeping

| Component / File | Reason |
|---|---|
| `shared/schema.ts` | Well-structured schema with good table design; domain model is sound. Needs indexes + minor cleanup. |
| `useAuth.ts` hook | Clean, well-abstracted auth state management. Correctly handles cache invalidation. |
| `AdminLayout.tsx` | Well-designed role-aware admin shell with breadcrumbs, dirty-state guard, and responsive nav. |
| `IntelMap.tsx` | Polished Leaflet implementation with custom SVG markers, dark tile layer, clustering, and filter panel. |
| `shadcn/ui components` | The entire `/components/ui/` library — high quality, accessible, consistent. |
| `OnboardingTour.tsx` | Good UX touch for new users — keep and expand. |
| `AutosaveIndicator.tsx` | Useful editorial UX pattern for the admin. |
| `CitationLink.tsx` | Clever inline citation rendering — unique feature. |
| `queryClient.ts` | Clean TanStack Query setup with `apiRequest` helper. |
| Session-based auth pattern | More appropriate for this app than JWT. Keep the approach; fix the security gaps. |
| Drizzle ORM choice | Good choice for PostgreSQL — type-safe, migration-aware. |
| Depth node tiering model | The Free/Pro content gating model is well-designed at schema level. |
| Admin audit log | Good governance feature — extend, don't remove. |
| `RedThread.tsx` | Interesting unique feature concept — worth surfacing prominently. |

---

## 14. Components That Should Be Rebuilt

| Component / File | Reason | Priority |
|---|---|---|
| `server/routes.ts` (1,982 lines) | Split into domain routers: `auth.routes.ts`, `investigations.routes.ts`, `people.routes.ts`, `live.routes.ts`, `library.routes.ts`, `timeline.routes.ts`, `admin.routes.ts`. | Critical |
| `server/storage.ts` (~1,300 lines) | Split into domain repositories: `InvestigationRepository`, `PeopleRepository`, `LiveRepository`, etc. Each domain owns its queries. | Critical |
| `client/src/App.tsx` | Add `React.lazy()` + `<Suspense>` for all 23 page imports. No code splitting is a bundle size time bomb. | High |
| `client/src/pages/Connections.tsx` | Almost certainly a very large file with three entirely different views (graph, family tree, map). Split into `ConnectionsGraph`, `FamilyTree`, and `ConnectionsMap` with a shared layout wrapper. | High |
| Live Chat system | Replace HTTP polling with WebSockets (e.g. `ws` or `socket.io`). Current approach is unsuitable for real-time chat. | High |
| Input validation layer | Implement Zod schemas for all admin update endpoints. Currently validation only exists on inserts. | High |
| Default admin seeding | Replace startup auto-seed with a one-time CLI migration script. Remove password logging. Require env var. | High |
| Pro upgrade flow | Reconnect a payment provider (Stripe or alternative) or build a simple invite/code system as a bridge. | High |
| Password reset flow | Build forgot-password + email delivery (e.g. Resend, Sendgrid). Without it, user accounts are permanently lost on forgotten passwords. | High |
| `server/seed-geo.ts` | Geo data is hardcoded strings — migrate coordinates into the admin CMS so editors control them. | Medium |
| Tag system | Replace jsonb tag arrays with a proper `tags` table + join tables for queryability and management. | Medium |
| Podcast player | Build a public-facing podcast player UI — the backend is complete but users have no in-app listening experience. | Medium |
| QA Page | Either build it out or remove the route entirely. | Low |

---

## 15. Overall Architecture Rating

### **5.5 / 10**

**Breakdown:**

| Dimension | Score | Notes |
|---|---|---|
| Domain model / schema | 7/10 | Sound design, good relationships; UUID inconsistency and missing indexes drag it down |
| Frontend architecture | 6/10 | Good component library usage; zero code splitting, no error boundaries, pages too large |
| Backend architecture | 4/10 | Two massive monolith files instead of domain-separated modules; hard to navigate and maintain |
| Security | 4/10 | Default plaintext credentials logged, no session regeneration, no CSRF, no rate limiting, no helmet |
| Feature completeness | 5/10 | Large surface area but several critical user flows are broken (upgrade, password reset, real-time chat) |
| Code quality | 6/10 | Generally readable TypeScript; `any` overuse and missing validation on updates are recurring issues |
| Test coverage | 0/10 | Zero tests of any kind |
| AI capability | 0/10 | Marketed as AI-powered; no AI exists |
| Observability | 4/10 | Basic console logging only; no structured logging, no error tracking, no metrics |

**Summary:** Rabbit Hole has a well-thought-out content model and a genuinely interesting editorial concept. The admin CMS is reasonably capable, and the visual design is distinctive. However, the codebase has grown without architectural separation — two monolith server files contain everything. The absence of tests, multiple broken user-facing flows (upgrade, password reset), and the zero-gap between "AI-powered" marketing and zero AI implementation are the most significant concerns going into V2.

---

## 16. Recommended Roadmap for Rabbit Hole V2

### Phase 0 — Stabilise (Weeks 1–2)
*Fix critical security and broken flows before adding anything new.*

1. **Security hardening**
   - Add `helmet` middleware
   - Add `express-rate-limit` on all auth endpoints
   - Implement `req.session.regenerate()` on all login handlers
   - Require `ADMIN_PASSWORD` env var in production; remove password logging
   - Audit and DTO-ify all user/employee API responses

2. **Fix broken Pro gating**
   - Either reconnect Stripe (proper) or implement a simple admin-assignable invite/access-code system as a temporary bridge so Pro content can actually be accessed

3. **Password reset + email**
   - Integrate Resend or Sendgrid
   - Build forgot-password flow with signed time-limited tokens

4. **Input validation**
   - Apply Zod schemas to all admin update endpoints

---

### Phase 1 — Architecture Refactor (Weeks 3–5)
*No new features — make the foundation maintainable.*

1. **Split `server/routes.ts`** into domain routers (`auth`, `investigations`, `people`, `live`, `library`, `timeline`, `admin`)
2. **Split `server/storage.ts`** into domain repositories
3. **Add `React.lazy()` + `<Suspense>`** to all page imports in `App.tsx`
4. **Split `Connections.tsx`** into `ConnectionsGraph`, `FamilyTree`, `ConnectionsMap`
5. **Add React error boundaries** at the route level
6. **Add structured logging** (e.g. `pino`) to replace `console.log`
7. **Database indexes** — add explicit indexes on all foreign key columns

---

### Phase 2 — AI Integration (Weeks 6–9)
*Deliver on the "AI-powered" promise.*

1. **Investigation summarisation** — use OpenAI / Anthropic to auto-generate node summaries and extract claims
2. **Semantic search** — replace or augment full-text search with vector embeddings (pgvector)
3. **AI-assisted fact-checking** — surface credibility signals using LLM analysis of sources
4. **Red Thread AI** — auto-detect and surface connections between investigations/people using embeddings
5. **Content authoring assist** — AI draft generation for depth nodes in the admin editor

---

### Phase 3 — Real-time & Community (Weeks 10–12)
*Fix the broken surfaces and make the community layer real.*

1. **Replace live chat polling with WebSockets** (`socket.io` or native `ws`)
2. **Build podcast player UI** — in-app audio player for episodes (the backend already exists)
3. **Real-time investigation updates** — notify readers when new depth nodes are published
4. **Comment notifications** — email digest or in-app notification for replies
5. **User bookmarks / reading list** — save investigations, track progress through depth nodes

---

### Phase 4 — Monetisation V2 (Weeks 13–15)
*Rebuild the Pro tier properly.*

1. **Reconnect Stripe** with proper webhooks, subscription management, and portal
2. **Pro content enforcement** — audit all gating points; ensure consistency
3. **Team / group subscriptions** — allow shared Pro access for organisations
4. **Creator monetisation** — allow creators to gate premium replays independently

---

### Phase 5 — Scale & Observability (Ongoing)
1. **Error tracking** — Sentry or equivalent
2. **APM / metrics** — identify slow queries, N+1s in production
3. **CDN / image storage** — move investigation imagery to R2/S3 with signed URLs
4. **Database read replicas** — as read traffic grows, separate read/write paths
5. **End-to-end test suite** — Playwright coverage for critical user journeys
6. **API documentation** — OpenAPI/Swagger spec for the 113 endpoints

---

### V2 Architecture Target

```
server/
├── app.ts                    # Express bootstrap
├── middleware/               # auth, rate-limit, helmet, error handler
├── routes/
│   ├── auth.routes.ts
│   ├── investigations.routes.ts
│   ├── people.routes.ts
│   ├── live.routes.ts
│   ├── library.routes.ts
│   ├── timeline.routes.ts
│   └── admin/
│       ├── investigations.admin.routes.ts
│       ├── people.admin.routes.ts
│       ├── live.admin.routes.ts
│       └── timeline.admin.routes.ts
├── repositories/
│   ├── InvestigationRepository.ts
│   ├── PeopleRepository.ts
│   ├── LiveRepository.ts
│   ├── LibraryRepository.ts
│   └── UserRepository.ts
├── services/
│   ├── AuthService.ts
│   ├── AIService.ts           # LLM integration layer
│   └── EmailService.ts
└── jobs/                     # Background tasks (sync, AI processing)

client/src/
├── App.tsx                   # React.lazy + Suspense throughout
├── pages/                    # Unchanged structure, just lazy loaded
├── features/                 # Co-located feature modules (queries + components)
│   ├── investigations/
│   ├── people/
│   ├── live/
│   └── library/
└── components/               # Truly shared components only
```

---

*Audit complete. No files were modified during this review.*
