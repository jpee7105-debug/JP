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
- **Routing**: Wouter handles client-side navigation with routes for Home, Discover, RabbitHole details, DepthReader, Search, Profile, Connections, and an Admin CMS.
- **State Management**: TanStack React Query manages server state, data fetching, and caching.
- **UI/UX**: shadcn/ui (New York style) built on Radix UI primitives, styled with Tailwind CSS v4. Features a dark mode by default, custom fonts (Inter, Space Grotesk, JetBrains Mono), and a deep red accent color.
- **Key Features**:
    - **Home & Discover**: Entry points for exploring investigations with filtering and sorting.
    - **RabbitHole Detail**: Displays investigation overview with tabs for Depth Nodes, Timeline, Claims, and Sources.
    - **DepthReader**: A sequential reading experience for depth nodes, with progress tracking and keyboard controls.
    - **Connections**: An interactive force-directed graph visualizing relationships between investigations.
    - **Admin CMS**: A password-authenticated system for content management (holes, nodes, claims, sources, media, podcasts, employees) with role-based access control, workflow management (Draft, Review, Published), and integrity validation.

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

### Database
- **Type**: PostgreSQL.
- **ORM**: Drizzle ORM with `node-postgres` driver.
- **Schema**: Defined in `shared/schema.ts`, including tables for `categories`, `rabbit_holes`, `depth_nodes`, `claims`, `sources`, `comments`, `employees`, `users`, `podcasts`, `podcast_episodes`, `rabbit_hole_podcast_episodes`, `sponsored_podcast_slots`, `audit_logs`, and `user_sessions`.
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