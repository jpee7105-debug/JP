# Red Thread - AI-Powered Investigative Research Platform

## Overview

Red Thread is an AI-powered investigative research platform built around structured deep-dives into complex narratives. Users explore investigations through guided "Depth Nodes" (step-by-step reading), structured claims with evidence/counterpoints, normalized source libraries with credibility scores, and timeline visualizations. The platform features anonymous participation through a "Red Thread" comment system with upvote/downvote mechanics and inter-topic linking. Content is organized into categories (Intelligence, Geopolitics, History, Technology, Finance, Mysteries, Media Narratives) with a two-tier system: Specialist Intel (curated) and Active Investigations (community-driven).

The application follows a monorepo structure with a React frontend (Vite), an Express backend, and a PostgreSQL database using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.
App name: Red Thread (not Rabbit Hole)

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
- **Routing**: Wouter with routes: Home (`/`), RabbitHole (`/hole/:id`), Search (`/search`)
- **State Management**: TanStack React Query for server state (data fetching, caching, mutations)
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS v4 with CSS variables for theming, dark mode by default, custom fonts (Inter, Space Grotesk, JetBrains Mono)
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`
- **Key Custom Components**:
  - `RedThread` — Threaded comment component with upvote/downvote and inter-topic links
  - Home page with category filters, sorting (trending/new/verified), functional search
  - RabbitHole detail with 4 tabs: Go Deeper (depth nodes), Timeline, Claims, Sources
  - Search page with tabbed results across investigations/sources/claims

### Backend Architecture
- **Framework**: Express 5 on Node.js with TypeScript (via tsx)
- **API Pattern**: RESTful JSON API under `/api/` prefix
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
- **Validation**: Zod schemas generated from Drizzle schema via `drizzle-zod`

### Database
- **Database**: PostgreSQL (required via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `node-postgres` driver
- **Schema Location**: `shared/schema.ts`
- **Tables**:
  - `categories` — id, name, slug (unique), description, icon
  - `rabbit_holes` — id, slug (unique), title, summary, status, completion, isSpecialist, connections, sourceCount, categorySlug, updatedAt, timeline (JSONB)
  - `depth_nodes` — id, holeId (FK), title, summary, content, position, status (locked/unlocked), mediaUrl, branchLinks (JSONB)
  - `claims` — id, holeId (FK), nodeId (FK nullable), statement, stance, confidence (0-100), evidence (JSONB), counterpoints (JSONB)
  - `sources` — id, holeId (FK), title, author, origin, publishedDate, url, summary, type, stanceTag, credibility (0-100)
  - `comments` — id, holeId (FK), username, reputation, content, upvotes, links (JSONB), createdAt
- **Seeding**: `server/seed.ts` contains initial data (MKUltra, Vatican Archives, Steppe Pathogens, Cicada 3301, Numbers Stations) with depth nodes, claims, and normalized sources

### Storage Layer
- `server/storage.ts` defines an `IStorage` interface and `DatabaseStorage` implementation
- CRUD operations for all entities plus search with ILIKE queries
- Pattern supports swapping storage implementations if needed

### Development vs Production
- **Dev**: `npm run dev` starts tsx with Express + Vite middleware, HMR on port 5000
- **Build**: `npm run build` compiles client (Vite) and server (esbuild) to `dist/`
- **Production**: `npm start` runs the compiled `dist/index.cjs`

## Design Aesthetic
- Dark classified/tactical theme (#0A0A0A background)
- Primary: Red (#E02424), Accent: Green (#22C55E) for verified status
- Corner accents, grain overlays, terminal-style fonts
- Space Grotesk for display, JetBrains Mono for metadata, Inter for body

## Recent Changes (Feb 2026)
- Phase 1: Expanded from basic rabbit holes to full investigative platform
- Added Depth Nodes for guided "Go Deeper" reading mode
- Added Claims system with evidence/counterpoints and confidence scores
- Normalized Sources into separate table with credibility scores and stance tags
- Added Categories (Intelligence, Geopolitics, History, Technology, Finance, Mysteries, Media)
- Added Search across holes, sources, and claims
- Rebranded from "Rabbit Hole" to "Red Thread"
- Category filter bar on Home page
- Sorting: trending/new/verified for community investigations

## Planned Future Phases
- Admin CMS backend for research team
- User authentication and roles (Anonymous, Moderator, Research Editor, Admin)
- Media gallery and uploads
- Connected Rabbit Holes graph/network visualization
- International Lens (how different countries frame topics)
- Library/Bookshelf page
- Monetization (sponsored podcast slots)
