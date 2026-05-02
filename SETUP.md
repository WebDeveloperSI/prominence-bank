# Prominence Private Bank — Full Source Export

Complete React + TanStack Start v1 source code for the Core Banking System
(landing page, client portal, admin operations console).

## Stack
- React 19 + TanStack Start v1 (SSR, file-based routing)
- Vite 7 + Tailwind CSS v4 + shadcn/ui
- Supabase (Postgres + Auth + RLS + RPC) — connected via Lovable Cloud
- TypeScript (strict)

## Run locally
```bash
bun install        # or: npm install
bun run dev        # http://localhost:3000
```

## Backend (required for full functionality)
The app expects a Supabase project. Two options:

### Option A — Reuse the included Cloud backend (fastest)
The `.env` file is preconfigured with Lovable Cloud credentials. Just run
`bun run dev` and everything works (login, transfers, approvals, audit, etc.).

### Option B — Point at your own Supabase project
1. Create a new Supabase project.
2. Run every SQL file in `supabase/migrations/` in chronological order
   (psql, Supabase SQL editor, or `supabase db push`).
3. Update `.env`:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY
   VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_REF
   ```
4. Regenerate types: `npx supabase gen types typescript --project-id YOUR_REF > src/integrations/supabase/types.ts`

## Demo credentials
- Client: `client@prominencebank.com` / `Prominence2026!`
- Admin:  `admin@prominencebank.com`  / `Prominence2026!`
First sign-in auto-provisions the demo user with two funded accounts.
MFA OTP is shown on the verification screen for demo purposes.

## Build for production
```bash
bun run build      # outputs Cloudflare Worker bundle
```

## Project structure
- `src/routes/`              — file-based routes (landing, login, /portal/*, /admin/*)
- `src/components/banking/`  — PortalShell, AdminStub, Stat
- `src/components/ui/`       — shadcn primitives
- `src/api/banking.ts`       — typed RPC wrappers
- `src/auth/AuthProvider.tsx`— session + MFA state
- `src/integrations/supabase`— client + generated types
- `supabase/migrations/`     — full database schema (tables, RLS, RPCs, triggers)

## Design tokens
All colors use semantic OKLCH tokens defined in `src/styles.css`
(`--primary`, `--gold`, `--surface`, etc.). Fonts: Inter (body),
Fraunces (display), JetBrains Mono (numbers).
