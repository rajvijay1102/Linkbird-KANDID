# Linkbird.ai Clone – Leads & Campaigns

A production-ready React + Express (Vite) app replicating the Leads and Campaigns sections from Linkbird.ai, with modern UI (Tailwind + shadcn/ui), infinite scroll, side sheets, sortable tables, and strong state management (TanStack Query + Zustand). Includes Drizzle ORM schema and Better Auth integration guide.

## Tech Stack
- React 18, TypeScript, Vite
- Express API (single port dev)
- TailwindCSS 3 with custom HSL theme
- shadcn/ui component library
- TanStack Query (data fetching, caching, infinite scroll)
- Zustand (UI state)
- Drizzle ORM (schema provided)
- Better Auth (architecture + snippets)

## Project Structure
- client/
  - layouts/AppLayout.tsx – shared Header + Sidebar + content shell
  - pages/
    - Index.tsx – overview dashboard
    - Leads.tsx – infinite table, search/filter, side sheet
    - Campaigns.tsx – sortable table, KPIs, progress bars
  - components/
    - AppHeader.tsx, AppSidebar.tsx – navigation, breadcrumbs, profile menu
    - ui/ – shadcn components
- server/
  - index.ts – express routes registration
  - routes/
    - leads.ts – paginated mock API with search/filter and status updates
    - campaigns.ts – paginated mock API with KPI fields
  - db/schema.ts – Drizzle ORM schema for Users, Leads, Campaigns
- shared/api.ts – shared types for API responses

## Getting Started
- Install deps: pnpm install
- Start dev: pnpm dev
- Typecheck/tests: pnpm typecheck, pnpm test

## Authentication (Better Auth)
This template ships with a UI that assumes a logged-in user. To enable real auth with Google OAuth and sessions using Better Auth:

1) Install
pnpm add better-auth better-auth-express cookie @better-fetch/fetch

2) Server: auth setup (server/auth.ts)
import { betterAuth } from "better-auth";
import { expressAdapter } from "better-auth/express";

export const auth = betterAuth({
  providers: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: { cookieName: "lb_session", secure: true },
});

export const authRouter = expressAdapter(auth);

// in server/index.ts
app.use("/api/auth", authRouter);

3) Client: session fetching
- Create a hook that calls /api/auth/session and stores user in a context or Zustand.
- Protect routes by redirecting unauthenticated users to /login.

4) Login/Logout
- Add buttons that hit /api/auth/signin/google and /api/auth/signout.
- Handle errors by showing a toast using sonner.

Note: You must configure OAuth callback URLs and environment variables.

## Database (Drizzle ORM + Postgres)
- Schema is located at server/db/schema.ts (users, leads, campaigns + enums)
- Install
pnpm add drizzle-orm drizzle-kit pg postgres

- drizzle.config.ts example
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  out: "./drizzle",
  schema: "./server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});

- Migrate
pnpm drizzle-kit generate && pnpm drizzle-kit migrate

- Use in server routes (example)
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { leads } from "../db/schema";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client);

// Query
await db.select().from(leads).limit(20);

## State Management
- TanStack Query powers all data fetching, caching, and infinite scroll
  - Leads: useInfiniteQuery with IntersectionObserver to auto-load pages
  - Campaigns: useQuery + client-side sort
- Zustand can hold UI flags (sidebar, filters, modals) if you expand UI states

## Design & UX
- Tailwind theme updated to a modern violet/indigo brand using HSL variables
- Consistent shadcn/ui components
- Skeletons and smooth sheet/table transitions
- Responsive layout and sticky header with breadcrumbs

## Deployment
- Build: pnpm build
- Start: pnpm start

