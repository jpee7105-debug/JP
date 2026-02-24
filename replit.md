# Rabbit Hole - AI-Powered Investigative Research Platform

## Overview

Rabbit Hole is an AI-powered investigative research platform designed for structured deep-dives into complex narratives. It enables users to explore investigations through guided "Depth Nodes," structured claims with evidence, normalized source libraries, and timeline visualizations. The platform supports anonymous community participation via comments with upvote/downvote mechanics and inter-topic linking. Content is categorized into "Specialist Intel" (curated) and "Active Investigations" (community-driven). The business vision is to provide a comprehensive tool for understanding complex information, fostering critical thinking, and empowering users to navigate intricate topics effectively.

## User Preferences

Preferred communication style: Simple, everyday language.
App name: Rabbit Hole
Design theme: Deep charcoal gradient (HSL 220 12% 7% background), restrained deep red accent (HSL 0 72% 30%), off-white text (#EDEDED). Design token system in index.css with spacing/typography/elevation/transition tokens.

## System Architecture

### Monorepo Structure
The application follows a monorepo structure, separating the frontend (`client/`), backend (`server/`), and shared code (`shared/`).

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite for bundling and HMR.
- **Routing**: Wouter handles client-side navigation with routes for Home, Discover, RabbitHole details, DepthReader, Search, Profile, Connections, Live Streaming, Library, Guide, and an Admin CMS.
- **State Management**: TanStack React Query manages server state, data fetching, and caching.
- **UI/UX**: shadcn/ui (New York style) built on Radix UI primitives, styled with Tailwind CSS v4. Features a dark mode by default, custom fonts (Inter, Space Grotesk, JetBrains Mono), and a deep red accent color.
- **Key Features**:
    - **Home & Discover**: Entry points for exploring investigations with filtering and sorting.
    - **RabbitHole Detail**: Investigation pages with Graph/Timeline toggle in the overview tab, mini connection graph canvas, expandable depth nodes, claims, sources, and podcast embeds.
    - **DepthReader**: A sequential reading experience for depth nodes, with progress tracking and keyboard controls.
    - **Connections (Research Network)**: Calm research network using React Flow (@xyflow/react) for an infinite zoomable canvas (0.2x-2.5x). Multi-entity graph with cases as matte diamond nodes and people as circle nodes (60% size). Static layout with no physics simulation. Drag-to-move persists positions to database. MiniMap and zoom controls included. Typed relationship edges (family edges dashed, relationship type shown on hover). Toggle filters for people/family edges. Graph/Family Tree/Timeline/Map view modes. Family tree mode centers on a person and shows hierarchical family layout. Map mode renders a Leaflet-based dark-themed geographic map with clustered markers for geo-tagged investigations, people, and timeline items. Markers are color-coded by entity type with click-through navigation.
    - **Live Streaming**: Browse live/upcoming streams and replays, watch with live chat, creator channel pages, premium gating for Pro users.
    - **Person Detail Page**: Handle-based routing `/people/:handle` with numeric `:id` fallback. Left dossier panel (avatar, banner, fullName, handle, aliases, dates, nationality, tags, bio, case connections grouped by relationship type) + right React Flow family tree panel (zoomable, pannable, depth-limited BFS loading up to 5 levels, custom FamilyNode components with avatars, relationship labels, click-to-navigate between profiles, fit-to-screen/recenter controls). Employee preview badge for Draft/Review status.
    - **Admin CMS**: 3-column layout with left sidebar navigation (grouped into Editorial/Intelligence/Content/System sections), main content area with clean charcoal background, and collapsible right-side validation panel. Features focus mode (Cmd+B), keyboard shortcuts, publish readiness checks, depth meter, and estimated read time calculator. Uses a **node-centric editing architecture**: clicking "EDIT NODES" on an investigation transforms the sidebar into a node list; selecting a node loads the NodeEditor with all associated content (narrative, media, claims, timeline, sources) managed inline. NodeValidationPanel shows node-specific health checks. Intelligence section includes People and Relationships management tabs.
    - **Admin People Builder** (`/admin/people`): Dedicated page for managing people with list view (status filters, search), two-column edit mode (left: identity + profile dossier editor with auto-save on blur, right: workflow status panel with publish checklist, family relationships panel with inline search/add/remove, case/event links panel). Role-based permissions (Admin-only publish/delete).
    - **Persistent AdminLayout**: Centralized auth, persistent top nav (logo → Dashboard, Dashboard button, global search across people/investigations, quick-create dropdown, user dropdown), left sidebar (Editorial/Intelligence/Content/System sections), breadcrumb navigation, mobile drawer support. Unsaved changes warning blocks navigation when forms are dirty. Reusable `AutosaveIndicator` component and `useUnsavedChanges` hook.
    - **Library**: Built-in library system for browsing primary source texts. Pages: `/library` (work list), `/library/:workSlug` (book grid by testament with search), `/library/:workSlug/:bookSlug` (chapter grid), `/library/:workSlug/:bookSlug/:chapterNumber` (verse display with `#v4` anchors and prev/next navigation). First work: KJV Bible (31,100 verses, 66 books, 1,189 chapters). Citation detection auto-links Bible references (e.g., "Genesis 6:4", "1 Corinthians 13:4-7") in investigation content via `RichText` component with hover preview tooltips.
    - **Onboarding Tour**: First-visit guided tour (5 steps) explaining investigations, claims, people, connections graph, and library. Uses localStorage for persistence. Skippable, re-runnable from Account page. `OnboardingTour` component with keyboard navigation (arrows, Escape).
    - **Guide** (`/guide`): Help center with expandable sections covering how investigations work, what labels mean, connections graph usage, people profiles, library features, and timelines. Accessible from navbar help icon and Account page.
    - **Admin Live**: Manage creators, streams (with Draft→Review→Published workflow and live/upcoming/ended states), and chat moderation.
    - **Admin Timeline** (`/admin/timeline`): Full CRUD management for global timeline items with status workflow (Draft→Review→Published), tag management, location metadata, link type configuration, sort priority, and ability to promote investigation-scoped timeline entries to the global feed.
    - **Public Timeline** (`/timeline`): Chronological feed of published global timeline items with tag filter chips, investigation filter dropdown, "Load More" pagination, and click-through navigation based on link type (investigation, node, person, external).

### Backend Architecture
- **Framework**: Express 5 on Node.js with TypeScript.
- **API Pattern**: RESTful JSON API.
- **Authentication**: Separate session-based authentication for regular users (signup, login, logout, profile) and employees (admin login with role-based access). bcryptjs is used for password hashing.
- **Authorization**: Role-based access control (Admin, Editor, Moderator) for the Admin CMS, enforcing permissions on content creation, editing, publishing, and employee management.
- **Validation**: Zod schemas are used for API request validation.
- **Storage Layer**: Implements full CRUD operations for all entities, including search capabilities and cascade deletes for related content.
- **Content Workflow**: Investigations support `Draft`, `Review`, `Published` statuses. Public APIs only expose `Published` content, while admin APIs can access all statuses with appropriate authentication.
- **Paywall & Stripe Integration**: Tier model: Free (overview + first 2 depth nodes) vs Pro (full access). Users table has `plan` ("Free"/"Pro"), `subscriptionStatus` ("none"/"active"/"past_due"/"canceled"), `stripeCustomerId`, and `stripeSubscriptionId`. Stripe integration via `stripe-replit-sync` handles schema sync, webhooks, and backfill. API routes: `/api/stripe/prices` (public), `/api/stripe/checkout` (auth, creates Stripe Checkout session), `/api/stripe/portal` (auth, billing portal), `/api/stripe/sync-subscription` (auth, syncs subscription status from stripe schema to users table). Gating: depth nodes endpoint returns only preview nodes for free users; admin/employee bypass. Frontend shows lock screen with upgrade CTA after preview limit. Pricing page at `/pricing` with monthly ($9) and yearly ($79) plans. Stripe product seeded via `npx tsx server/seed-stripe.ts`.
- **Podcast System**: Manages podcast shows, episodes, their attachment to investigations, and sponsored slots, exposing them on investigation detail pages.
- **Live Streaming Module**: Full CRUD for creators, streams, replays, chat messages, and chat moderation. Streams follow Draft→Review→Published editorial workflow. Public APIs filter by Published status only. Chat supports polling with premium gating.
- **Global Timeline System**: Two-table architecture: `timeline_entries` (investigation-scoped entries linked to rabbit_holes/depth_nodes) and `global_timeline_items` (curated public feed with Draft→Review→Published workflow). Public API at `/api/timeline` returns only Published items with tag/investigation filters and pagination. Admin APIs support full CRUD, status workflow, and promoting investigation timeline entries to global items. Items support linkType-based navigation (investigation, node, person, external, timeline_entry), location metadata, tags, featured images, and sort priority.

### Database
- **Type**: PostgreSQL.
- **ORM**: Drizzle ORM with `node-postgres` driver.
- **Schema**: Defined in `shared/schema.ts`, including tables for `categories`, `rabbit_holes`, `depth_nodes`, `claims`, `sources`, `comments`, `employees`, `users`, `podcasts`, `podcast_episodes`, `rabbit_hole_podcast_episodes`, `sponsored_podcast_slots`, `audit_logs`, `user_sessions`, `creators`, `streams`, `stream_replays`, `live_chat_messages`, `chat_moderation_actions`, `people`, `relationships`, `library_works`, `library_books`, `library_chapters`, `library_verses`, `timeline_entries`, and `global_timeline_items`. People support typed relationships (family, case involvement, etc.) with a polymorphic from/to entity system. People have handle (unique slug), nationality, avatarUrl, bannerUrl fields. Duplicate spouse_of/sibling_of relationships are prevented bidirectionally. Library tables have cascade deletes and unique indexes on (work_id, slug), (book_id, chapter_number), (chapter_id, verse_number). Timeline entries cascade delete with their investigation; global timeline items set null on investigation delete. Geographic fields: `rabbit_holes` has latitude, longitude, country, region, city (all nullable doublePrecision/text); `people` has latitude, longitude (nullable doublePrecision); `global_timeline_items` has lat, lng (doublePrecision), country, region, city (text). These enable the map view on Connections page.
- **Seeding**: Initial data is provided for development, and a default Admin employee is created if none exists. KJV Bible data is seeded via `server/seed-bible.ts` which fetches public domain data from GitHub and imports 66 books, 1,189 chapters, 31,100 verses. Run with `npx tsx server/seed-bible.ts`. Geographic coordinates for investigations, people, and timeline items are seeded via `server/seed-geo.ts` — run with `npx tsx server/seed-geo.ts`. This populates latitude/longitude/country/city fields for map view rendering.

## External Dependencies

- **PostgreSQL**: Primary database for all application data.
- **Vite**: Frontend build tool.
- **TanStack React Query**: For data fetching and state management.
- **shadcn/ui & Radix UI**: UI component libraries.
- **Tailwind CSS**: Utility-first CSS framework.
- **Wouter**: Client-side routing.
- **Express**: Backend web application framework.
- **Drizzle ORM**: TypeScript ORM for PostgreSQL.
- **node-postgres**: PostgreSQL client for Node.js.
- **bcryptjs**: For password hashing.
- **express-session**: Session management middleware.
- **connect-pg-simple**: PostgreSQL session store.
- **Zod**: Schema validation library.
- **tsx**: TypeScript execution for Node.js development.
- **esbuild**: Server-side bundling.
- **Stripe**: Payment processing for Pro subscriptions.
- **stripe-replit-sync**: Replit integration for Stripe schema sync, webhooks, and backfill.
- **Leaflet & react-leaflet**: Interactive map rendering for the geographic exploration layer (Connections Map view).
- **Spotify/YouTube**: For embedding podcast players.