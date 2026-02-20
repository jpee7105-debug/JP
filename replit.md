# Rabbit Hole - AI-Powered Investigative Research Platform

## Overview

Rabbit Hole is an AI-powered investigative research platform built around structured "rabbit holes." Each rabbit hole explores a controversial, historical, geopolitical, or conspiracy-adjacent topic with neutral overviews, timelines, key claims, evidence/source sections, and connected rabbit holes. Users can engage anonymously through a threaded comment system styled as a "red thread," with upvote/downvote mechanics and inter-topic linking.

The application follows a monorepo structure with a React frontend (Vite), an Express backend, and a PostgreSQL database using Drizzle ORM for schema management and queries.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **Routing**: Wouter (lightweight React router) with two main routes: Home (`/`) and RabbitHole (`/hole/:id`)
- **State Management**: TanStack React Query for server state (data fetching, caching, mutations)
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS v4 with CSS variables for theming, dark mode by default, custom fonts (Inter, Space Grotesk, JetBrains Mono)
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`
- **Key Custom Component**: `RedThread` — the threaded comment component styled as notes pinned along a red thread with upvote/downvote buttons and inter-topic link badges

### Backend Architecture
- **Framework**: Express 5 on Node.js with TypeScript (via tsx)
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Key Endpoints**:
  - `GET /api/holes` — List all rabbit holes
  - `GET /api/holes/specialist` — List specialist-curated holes
  - `GET /api/holes/community` — List community holes
  - `GET /api/holes/:slug` — Get single rabbit hole by slug
  - `GET /api/holes/:slug/comments` — Get comments for a hole
  - `POST /api/holes/:slug/comments` — Create a comment
  - `POST /api/comments/:id/upvote` — Upvote a comment
  - `POST /api/comments/:id/downvote` — Downvote a comment
- **Validation**: Zod schemas generated from Drizzle schema via `drizzle-zod`
- **Development**: Vite dev server middleware integrated into Express for HMR
- **Production**: Static file serving from `dist/public`, SPA fallback to `index.html`
- **Build**: Custom build script using esbuild (server) + Vite (client), outputs to `dist/`

### Database
- **Database**: PostgreSQL (required via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `node-postgres` driver
- **Schema Location**: `shared/schema.ts`
- **Schema Push**: `npm run db:push` (uses drizzle-kit push, no migration files needed for development)
- **Tables**:
  - `rabbit_holes` — id, slug (unique), title, summary, status, completion, isSpecialist, connections, sourceCount, updatedAt, timeline (JSONB array), sources (JSONB array)
  - `comments` — id, holeId (FK to rabbit_holes), username, reputation, content, upvotes, links (JSONB array of {text, target}), createdAt
- **Seeding**: `server/seed.ts` contains initial data for rabbit holes (MKUltra, Vatican Archives, etc.)

### Storage Layer
- `server/storage.ts` defines an `IStorage` interface and `DatabaseStorage` implementation
- Direct Drizzle queries using the `db` instance from a connection pool
- Pattern supports swapping storage implementations if needed

### Development vs Production
- **Dev**: `npm run dev` starts tsx with Express + Vite middleware, HMR on port 5000
- **Build**: `npm run build` compiles client (Vite) and server (esbuild) to `dist/`
- **Production**: `npm start` runs the compiled `dist/index.cjs`

## External Dependencies

### Database
- **PostgreSQL** — Primary data store, connected via `DATABASE_URL` environment variable
- **Drizzle ORM** — Query builder and schema management
- **drizzle-kit** — Schema push and migration tooling
- **node-postgres (pg)** — PostgreSQL client driver

### Frontend Libraries
- **React** with **TanStack React Query** for data fetching
- **shadcn/ui** component library (Radix UI + Tailwind CSS)
- **Wouter** for client-side routing
- **Lucide React** for icons
- **Google Fonts** (Inter, Space Grotesk, JetBrains Mono) loaded via CDN

### Build Tools
- **Vite** — Frontend bundler with React plugin, Tailwind CSS plugin
- **esbuild** — Server bundler for production builds
- **tsx** — TypeScript execution for development
- **PostCSS** with Tailwind CSS and Autoprefixer

### Replit-Specific
- `@replit/vite-plugin-runtime-error-modal` — Error overlay in development
- `@replit/vite-plugin-cartographer` and `@replit/vite-plugin-dev-banner` — Dev tools (conditionally loaded)
- Custom `vite-plugin-meta-images` — Updates OpenGraph meta tags with Replit deployment URL