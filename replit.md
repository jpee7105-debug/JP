# Rabbit Hole - AI-Powered Investigative Research Platform

## Overview

Rabbit Hole is an AI-powered investigative research platform designed for structured deep-dives into complex narratives. It enables users to explore investigations through guided "Depth Nodes," structured claims with evidence, normalized source libraries, and timeline visualizations. The platform supports anonymous community participation via comments with upvote/downvote mechanics and inter-topic linking. Content is categorized into "Specialist Intel" (curated) and "Active Investigations" (community-driven). The business vision is to provide a comprehensive tool for understanding complex information, fostering critical thinking, and empowering users to navigate intricate topics effectively.

## User Preferences

Preferred communication style: Simple, everyday language.
App name: Rabbit Hole
Design theme: Dark (#0E0E0E background), deep red accent (#8B0000), light text (#EDEDED)

## System Architecture

### Monorepo Structure
The application follows a monorepo structure, separating the frontend (`client/`), backend (`server/`), and shared code (`shared/`).

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite for bundling and HMR.
- **Routing**: Wouter handles client-side navigation with routes for Home, Discover, RabbitHole details, DepthReader, Search, Profile, Connections, Live Streaming, and an Admin CMS.
- **State Management**: TanStack React Query manages server state, data fetching, and caching.
- **UI/UX**: shadcn/ui (New York style) built on Radix UI primitives, styled with Tailwind CSS v4. Features a dark mode by default, custom fonts (Inter, Space Grotesk, JetBrains Mono), and a deep red accent color.
- **Key Features**:
    - **Home & Discover**: Entry points for exploring investigations with filtering and sorting.
    - **RabbitHole Detail**: Investigation pages with Graph/Timeline toggle in the overview tab, mini connection graph canvas, expandable depth nodes, claims, sources, and podcast embeds.
    - **DepthReader**: A sequential reading experience for depth nodes, with progress tracking and keyboard controls.
    - **Connections (Situation Room)**: Military-themed situation room using React Flow (@xyflow/react) for an infinite zoomable canvas (0.2x-2.5x). Multi-entity graph with cases as diamond nodes (larger) and people as circle nodes (60% size). Static layout with no physics simulation. Drag-to-move persists positions to database. MiniMap and zoom controls included. Typed relationship edges (family edges dashed, relationship type shown on hover). Toggle filters for people/family edges. Graph/Family Tree/Timeline view modes. Family tree mode centers on a person and shows hierarchical family layout.
    - **Live Streaming**: Browse live/upcoming streams and replays, watch with live chat, creator channel pages, premium gating for Pro users.
    - **Person Detail Page**: Public /people/:id page showing name, aliases, bio, dates, tags, related cases grouped by relationship type, family section (parents/spouse/children/siblings), and other connections.
    - **Admin CMS**: 3-column layout with left sidebar navigation (grouped into Editorial/Intelligence/Content/System sections), main content area with military grid background, and collapsible right-side validation panel. Features focus mode (Cmd+B), keyboard shortcuts, publish readiness checks, depth meter, and estimated read time calculator. Uses a **node-centric editing architecture**: clicking "EDIT NODES" on an investigation transforms the sidebar into a node list; selecting a node loads the NodeEditor with all associated content (narrative, media, claims, timeline, sources) managed inline. NodeValidationPanel shows node-specific health checks. Intelligence section includes People and Relationships management tabs.
    - **Admin Live**: Manage creators, streams (with Draft→Review→Published workflow and live/upcoming/ended states), and chat moderation.

### Backend Architecture
- **Framework**: Express 5 on Node.js with TypeScript.
- **API Pattern**: RESTful JSON API.
- **Authentication**: Separate session-based authentication for regular users (signup, login, logout, profile) and employees (admin login with role-based access). bcryptjs is used for password hashing.
- **Authorization**: Role-based access control (Admin, Editor, Moderator) for the Admin CMS, enforcing permissions on content creation, editing, publishing, and employee management.
- **Validation**: Zod schemas are used for API request validation.
- **Storage Layer**: Implements full CRUD operations for all entities, including search capabilities and cascade deletes for related content.
- **Content Workflow**: Investigations support `Draft`, `Review`, `Published` statuses. Public APIs only expose `Published` content, while admin APIs can access all statuses with appropriate authentication.
- **Paywall**: Free users are limited to a preview of depth nodes; Pro users with an active subscription gain full access.
- **Podcast System**: Manages podcast shows, episodes, their attachment to investigations, and sponsored slots, exposing them on investigation detail pages.
- **Live Streaming Module**: Full CRUD for creators, streams, replays, chat messages, and chat moderation. Streams follow Draft→Review→Published editorial workflow. Public APIs filter by Published status only. Chat supports polling with premium gating.

### Database
- **Type**: PostgreSQL.
- **ORM**: Drizzle ORM with `node-postgres` driver.
- **Schema**: Defined in `shared/schema.ts`, including tables for `categories`, `rabbit_holes`, `depth_nodes`, `claims`, `sources`, `comments`, `employees`, `users`, `podcasts`, `podcast_episodes`, `rabbit_hole_podcast_episodes`, `sponsored_podcast_slots`, `audit_logs`, `user_sessions`, `creators`, `streams`, `stream_replays`, `live_chat_messages`, `chat_moderation_actions`, `people`, and `relationships`. People support typed relationships (family, case involvement, etc.) with a polymorphic from/to entity system.
- **Seeding**: Initial data is provided for development, and a default Admin employee is created if none exists.

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
- **Spotify/YouTube**: For embedding podcast players.