# Rabbit Hole - AI-Powered Investigative Research Platform

## Overview

Rabbit Hole is an AI-powered investigative research platform built around structured deep-dives into complex narratives. Users explore investigations through guided "Depth Nodes" (step-by-step reading), structured claims with evidence/counterpoints, normalized source libraries with credibility scores, and timeline visualizations. The platform features anonymous participation through a comment system with upvote/downvote mechanics and inter-topic linking. Content is organized into categories (Intelligence, Geopolitics, History, Technology, Finance, Mysteries, Media Narratives) with a two-tier system: Specialist Intel (curated) and Active Investigations (community-driven).

The application follows a monorepo structure with a React frontend (Vite), an Express backend, and a PostgreSQL database using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.
App name: Rabbit Hole (rebranded from Red Thread)
Design theme: Dark (#0E0E0E background), deep red accent (#8B0000), light text (#EDEDED)

## System Architecture

### Directory Structure
- `client/` — React frontend (Vite-powered SPA)
- `server/` — Express backend API
- `shared/` — Shared code (database schema, types) used by both client and server
- `migrations/` — Drizzle-generated database migration files
- `script/` — Build scripts
- `attached_assets/` — Reference documents and design specs

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Bundler**: Vite with HMR support, configured for Replit deployment
- **Routing**: Wouter with routes:
  - Home (`/`)
  - Discover (`/discover`)
  - RabbitHole (`/rabbithole/:id`)
  - DepthReader (`/rabbithole/:slug/read`) — one-node-at-a-time reader with localStorage progress
  - Search (`/search`)
  - Profile (`/profile`)
  - Connections (`/connections`) — interactive graph visualization of rabbit hole relationships
  - Admin (`/admin`) — CMS with password auth for managing all content
- **State Management**: TanStack React Query for server state (data fetching, caching, mutations)
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS v4 with CSS variables for theming, dark mode by default, custom fonts (Inter, Space Grotesk, JetBrains Mono)
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`
- **Key Pages**:
  - `Home` — Hero section, category filters, sorting (trending/new/verified), functional search
  - `Discover` — Full investigation browser, category/view mode/sort filters
  - `RabbitHole` — Detail with 4 tabs: Go Deeper (depth nodes), Timeline, Claims, Sources + "Start Reading" button
  - `DepthReader` — Sequential reading mode with sidebar navigation, keyboard controls (arrow keys), localStorage progress tracking
  - `Connections` — Canvas-based force-directed graph showing relationships between rabbit holes with drag/click interaction
  - `Search` — Tabbed results across investigations/sources/claims
  - `Profile` — Anonymous operative stats, bookmarks, and activity placeholders
  - `Admin` — Password-protected CMS for CRUD on rabbit holes, depth nodes, claims, sources

### Backend Architecture
- **Framework**: Express 5 on Node.js with TypeScript (via tsx)
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Admin Auth**: Simple bearer token auth via ADMIN_PASSWORD env var (default: "rabbithole2024")
- **Key Endpoints**:
  - `GET /api/holes` — List all rabbit holes
  - `GET /api/holes/specialist` — List specialist-curated holes
  - `GET /api/holes/community` — List community holes
  - `GET /api/holes/category/:slug` — List holes by category
  - `GET /api/holes/:slug` — Get single rabbit hole by slug
  - `GET /api/holes/:slug/comments` — Get comments for a hole
  - `POST /api/holes/:slug/comments` — Create a comment
  - `POST /api/comments/:id/upvote` — Upvote a comment
  - `POST /api/comments/:id/downvote` — Downvote a comment
  - `GET /api/holes/:slug/depth-nodes` — Get depth nodes for guided reading
  - `GET /api/holes/:slug/claims` — Get claims with evidence/counterpoints
  - `GET /api/holes/:slug/sources` — Get normalized sources
  - `GET /api/categories` — List all categories
  - `GET /api/search?q=` — Search across holes, sources, and claims
  - `GET /api/sources` — List all sources
  - Admin CRUD: `POST/PUT/DELETE /api/admin/holes|depth-nodes|claims|sources`
  - `POST /api/admin/login` — Admin password authentication
- **Validation**: Zod schemas generated from Drizzle schema via `drizzle-zod`

### Database
- **Database**: PostgreSQL (required via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `node-postgres` driver
- **Schema Location**: `shared/schema.ts`
- **Tables**:
  - `categories` — id, name, slug (unique), description, icon
  - `rabbit_holes` — id, slug (unique), title, summary, status, completion, isSpecialist, connections, sourceCount, categorySlug, updatedAt, timeline (JSONB), labels (JSONB), connectedSlugs (JSONB)
  - `depth_nodes` — id, holeId (FK), title, summary, content, position, status (locked/unlocked), mediaUrl, branchLinks (JSONB)
  - `claims` — id, holeId (FK), nodeId (FK nullable), statement, stance, confidence (0-100), evidence (JSONB), counterpoints (JSONB)
  - `sources` — id, holeId (FK), title, author, origin, publishedDate, url, summary, type, stanceTag, credibility (0-100)
  - `comments` — id, holeId (FK), username, reputation, content, upvotes, links (JSONB), createdAt
- **Seeding**: `server/seed.ts` contains initial data (MKUltra, Vatican Archives, Steppe Pathogens, Cicada 3301, Numbers Stations) with depth nodes, claims, sources, and connections

### Storage Layer
- `server/storage.ts` defines an `IStorage` interface and `DatabaseStorage` implementation
- Full CRUD operations for all entities (create, read, update, delete) plus search with ILIKE queries
- Admin operations include cascade deletes (deleting a hole removes its nodes, claims, sources, comments)

### Development vs Production
- **Dev**: `npm run dev` starts tsx with Express + Vite middleware, HMR on port 5000
- **Build**: `npm run build` compiles client (Vite) and server (esbuild) to `dist/`
- **Production**: `npm start` runs the compiled `dist/index.cjs`

## Design Aesthetic
- Dark theme (#0E0E0E background)
- Primary: Deep Red (#8B0000), Accent: Green (#22C55E) for verified status
- Corner accents, grain overlays, terminal-style fonts
- Space Grotesk for display, JetBrains Mono for metadata, Inter for body

## Recent Changes (Feb 2026)
- Rebranded from "Red Thread" back to "Rabbit Hole"
- Updated color theme: deep red primary (#8B0000), darker background
- Added `labels` and `connectedSlugs` fields to rabbit_holes for graph connections
- Built Connections page with interactive force-directed graph visualization
- Built Depth Reader page with sequential reading, sidebar nav, keyboard controls, localStorage progress
- Built Admin CMS with password auth for full CRUD on holes, nodes, claims, sources
- Added "Start Reading" button to RabbitHole detail page
- Updated Navbar with Connections link
- Full admin API with bearer token auth (CRUD for all content types)
- Added `media` table to schema with full CRUD (storage, API routes, DB table)
- Upgraded Admin CMS with form validation, labels editor, connections selector, evidence editor, media management tab
- Enhanced DepthReader with sequential node locking, animated slide transitions, completion overlay badge
- Built reputation system: localStorage-based points (2pts/node, 10pts/investigation), 5 tier levels (Observer → Deep Diver)
- Updated Profile page with reputation tier display, progress bar, reading progress section, stats grid
- Enhanced Connections graph with pulsing node glows, gradient edges, particle animation on hover, radial gradient node fills

### Production Hardening (Feb 2026)
- **Content Workflow**: rabbit_holes.status now supports Draft/Review/Published, defaults to Draft
- **Published-Only Filtering**: All public API endpoints filter to Published-only; admin endpoints accept `?admin=true` with auth to see all statuses
- **Audit Logging**: `audit_logs` table tracks all admin creates/updates/deletes with editor name, entity type, changes JSONB, timestamps
- **Admin CMS Enhancements**: Status filter (All/Draft/Review/Published), editor name setting (persisted in localStorage), per-hole change history panel, Tools tab with Export/Import/Validation
- **Data Integrity Validation**: `validateIntegrity()` checks broken source/node references in claims, broken connection slugs, published holes without depth nodes
- **Publish Gate**: Attempting to publish a hole with integrity issues returns 400 with detailed issue list
- **Export/Import**: Full JSON export of all tables, import with data replacement (destructive import with confirmation)
- **QA Dashboard**: `/qa` route with automated endpoint tests — checks published-only filtering, data integrity, auth blocking, connection validity
- **Routes**: Added `/qa` page, admin tools endpoints (`/api/admin/audit-logs`, `/api/admin/export`, `/api/admin/import`, `/api/admin/validate`)

### User Authentication & Paywall (Feb 2026)
- **Users Table**: `users` table with uuid id, email (unique), password_hash, name, plan (Free/Pro), subscription_status (none/active/past_due/canceled), timestamps
- **Session Auth**: express-session with connect-pg-simple PostgreSQL session store (httpOnly cookies, `user_sessions` table auto-created)
- **Auth Endpoints**: `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` — completely separate from admin auth
- **Password Security**: bcryptjs with 12 rounds for hashing
- **Frontend Auth Hook**: `useAuth()` hook in `client/src/hooks/useAuth.ts` — provides user, isAuthenticated, login/signup/logout mutations
- **Paywall Gating**: Free users limited to first 2 depth nodes per investigation; Pro users with active subscription get full access
  - Backend: `GET /api/holes/:slug/depth-nodes` returns only 2 nodes for non-Pro users
  - Backend: `GET /api/holes/:slug/access` returns access info (totalNodes, previewLimit, hasFullAccess, loggedIn, plan)
  - Frontend: DepthReader shows upgrade prompt with login/signup CTAs at end of preview content
- **Auth Pages**: `/login` (with small Admin Login link), `/signup`, `/account` (profile + plan + upgrade placeholder)
- **Navbar**: Shows Login/Sign Up when logged out; Account/Logout when logged in
- **Admin Auth**: Completely separate — bearer token via ADMIN_PASSWORD env var, accessed via `/admin` page
