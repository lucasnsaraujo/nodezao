# AGENTS.md

This file provides guidance to AI coding agents like Claude Code (claude.ai/code), Cursor AI, Codex, Gemini CLI, GitHub Copilot, and other AI coding assistants when working with code in this repository.

## Project Overview

This is a **Better-T-Stack** monorepo using:
- **Frontend**: React 19 + TanStack Router (file-based routing) + TailwindCSS 4 + shadcn/ui
- **Backend**: Hono + Node.js
- **API Layer**: tRPC for end-to-end type-safe APIs
- **Database**: PostgreSQL + Drizzle ORM (Neon serverless)
- **Authentication**: Better-Auth with email/password
- **Monorepo**: Turborepo + pnpm workspaces
- **AI Integration**: Vercel AI SDK with Google Gemini

## Development Commands

### Core Commands
```bash
pnpm install              # Install all dependencies
pnpm dev                  # Start all apps (web on :3001, server on :3000)
pnpm build                # Build all apps and packages
pnpm check-types          # Type check all packages
```

### Individual Apps
```bash
pnpm dev:web              # Start only frontend (vite dev server on :3001)
pnpm dev:server           # Start only backend (tsx watch on :3000)
```

### Database Operations
```bash
pnpm db:push              # Push schema changes to database (development)
pnpm db:migrate           # Run migrations (production)
pnpm db:generate          # Generate migration files from schema changes
pnpm db:studio            # Open Drizzle Studio UI
```

All database commands are scoped to `packages/db` but can be run from root.

## Architecture

### Monorepo Structure

```
apps/
├── web/          # React frontend (Vite + TanStack Router)
└── server/       # Hono backend server
packages/
├── api/          # tRPC routers and procedures
├── auth/         # Better-Auth configuration
└── db/           # Drizzle schema and database client
```

### Workspace Dependencies

- `apps/web` depends on `@nodezao/api` and `@nodezao/auth`
- `apps/server` depends on `@nodezao/api`, `@nodezao/auth`, and `@nodezao/db`
- `packages/api` depends on `@nodezao/auth` and `@nodezao/db`
- `packages/auth` depends on `@nodezao/db`

All workspace packages use TypeScript source imports (not compiled) for faster development.

### API Layer Architecture

The API follows a clear separation of concerns:

1. **`packages/api/src/index.ts`**: Defines tRPC instance, public/protected procedures
2. **`packages/api/src/context.ts`**: Creates request context with Better-Auth session
3. **`packages/api/src/routers/`**: tRPC routers grouped by domain (e.g., `todo.ts`)
4. **`packages/api/src/routers/index.ts`**: Root router that combines all sub-routers

**Adding a new tRPC endpoint:**
1. Create or modify a router in `packages/api/src/routers/`
2. Use `publicProcedure` for unauthenticated routes
3. Use `protectedProcedure` for authenticated routes (auto-injects `ctx.session`)
4. Import and merge router in `packages/api/src/routers/index.ts`
5. Types are automatically synced to frontend via `AppRouter` export

### Frontend Architecture

**TanStack Router** provides file-based routing in `apps/web/src/routes/`:
- `__root.tsx`: Root layout component
- Each file = route (e.g., `todos.tsx` → `/todos`)
- Auto-generated route tree in `routeTree.gen.ts` (do not edit manually)

**tRPC Client Setup:**
- Client configured in `apps/web/src/utils/trpc.ts`
- Exports `trpc` proxy for React hooks and `trpcClient` for vanilla calls
- Uses `httpBatchLink` with credentials for cookies (Better-Auth sessions)
- Integrated with TanStack Query for caching/state management

**Authentication:**
- Client in `apps/web/src/lib/auth-client.ts` (Better-Auth React client)
- Server validates sessions via `packages/api/src/context.ts`

### Backend Entry Point

`apps/server/src/index.ts` is the main server file:
- Hono app with CORS, logger middleware
- `/api/auth/*` routes handled by Better-Auth
- `/trpc/*` routes handled by tRPC server adapter
- `/ai` endpoint for streaming AI responses (Gemini 2.5 Flash)
- Context creation extracts session from request headers

### Database Schema

Schema files live in `packages/db/src/schema/`:
- `auth.ts`: Better-Auth tables (users, sessions, etc.)
- `todo.ts`: Example domain tables

**Schema changes workflow:**
1. Modify schema files in `packages/db/src/schema/`
2. Run `pnpm db:push` to sync changes (dev) or `pnpm db:generate` + `pnpm db:migrate` (prod)
3. Drizzle config at `packages/db/drizzle.config.ts` loads `.env` from `apps/server/.env`

**Database client:**
- Exported from `packages/db/src/index.ts`
- Uses Neon serverless driver with WebSocket fallback
- Import via `import { db } from "@nodezao/db"`

## Environment Variables

Server requires `apps/server/.env`:
```bash
DATABASE_URL=                      # PostgreSQL connection string
BETTER_AUTH_SECRET=                # Random secret for session signing
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3001
GOOGLE_GENERATIVE_AI_API_KEY=     # For AI features
```

Web requires `apps/web/.env`:
```bash
VITE_SERVER_URL=http://localhost:3000
```

## Key Patterns

### Type Safety Flow
- Database schema (Drizzle) → API types (tRPC) → Frontend types (AppRouter)
- No manual type definitions needed across layers
- Context types flow through `Context` interface in `packages/api/src/context.ts`

### Protected Routes
```typescript
// In packages/api/src/routers/
export const myRouter = router({
  publicData: publicProcedure.query(() => { /* no auth */ }),
  privateData: protectedProcedure.query(({ ctx }) => {
    // ctx.session guaranteed to exist and typed
    return ctx.session.user;
  }),
});
```

### Authentication Flow
1. Better-Auth handles `/api/auth/*` endpoints (sign-up, sign-in, etc.)
2. Sets HTTP-only cookies for sessions
3. tRPC context reads session from cookies via `auth.api.getSession()`
4. `protectedProcedure` validates session exists

### Adding Dependencies
- Root: Add to root `package.json` if used by all workspaces
- Workspace: Add to specific `apps/*/package.json` or `packages/*/package.json`
- Run `pnpm install` from root to install and link workspaces

## Testing Strategy

This codebase currently includes example implementations (todo, ai) but no test infrastructure. When adding tests:
- Add test scripts to `turbo.json` tasks
- Install testing libraries in specific workspaces
- For API testing, consider `@trpc/server/test` utilities
- For frontend, use Vitest with React Testing Library

## Notes

- Always run commands from **project root** (not subdirectories)
- Turborepo caches builds; use `--force` flag to rebuild
- Router file generation happens automatically on dev/build
- Database migrations live in `packages/db/src/migrations/` (auto-generated)
