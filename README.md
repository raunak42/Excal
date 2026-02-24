# Solo Draw

Single-user Excalidraw-style app with:
- Modern premium UI
- Light/Dark mode
- GitHub-only authentication
- Supabase cloud sync
- IndexedDB local cache for resilience

## Tech

- Next.js App Router (TypeScript)
- `@excalidraw/excalidraw`
- `next-auth` (GitHub provider)
- Supabase Postgres (`@supabase/supabase-js`)
- Dexie (IndexedDB)

## 1) Supabase setup

Run [supabase/schema.sql](./supabase/schema.sql) in your Supabase SQL editor.

## 2) GitHub OAuth app

Create a GitHub OAuth app:
- Homepage URL: `http://localhost:3000` (dev), your Vercel URL for prod
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
  Use your production domain in Vercel similarly.

Use your numeric GitHub user id as `ALLOWED_GITHUB_ID`.

## 3) Environment variables

Copy `.env.example` to `.env.local` and fill values.

Required vars:
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GITHUB_ID`
- `GITHUB_SECRET`
- `ALLOWED_GITHUB_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 4) Run locally

```bash
npm install
npm run dev
```

## 5) Deploy to Vercel

Add all env vars in Vercel Project Settings, then deploy.

Notes:
- No server filesystem writes are used.
- Project data is stored in Supabase and cached locally in browser IndexedDB.
