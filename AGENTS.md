# Repository Guidelines

## Project Structure & Module Organization
- Frontend lives in `src/` with React components in `src/components`, shared state in `src/contexts`, and helpers/config in `src/lib`. Entry points: `src/main.tsx` (bootstraps React) and `src/App.tsx` (app shell).
- Styling is primarily Tailwind utility classes from `src/index.css`. Global HTML template is `public/index.html`.
- Backend schema and policies are versioned in `supabase/migrations/`; keep database changes there. Static assets belong in `public/`.

## Build, Test, and Development Commands
- `npm run dev` — start Vite dev server.
- `npm run build` — production bundle.
- `npm run preview` — serve the production build locally.
- `npm run lint` — ESLint across the project.
- `npm run typecheck` — TypeScript project check using `tsconfig.app.json`.
Run all commands from the repo root.

## Supabase Setup & Migration

### Initial Setup (New Project)
1. Login ke Supabase CLI: `npx supabase login`
2. Buat project baru via MCP atau dashboard Supabase
3. Link workspace: `npx supabase link --project-ref <project-id>`
4. Update `.env` dengan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dari project baru

### Database Schema
Project ini menggunakan 2 tabel utama:
- `subscriptions` — menyimpan data langganan user (29 kolom, RLS enabled)
- `user_preferences` — menyimpan preferensi user seperti bahasa, currency, tema, dan integrasi Telegram (12 kolom, RLS enabled)

### Menjalankan Migration
Migration files ada di `supabase/migrations/`. Urutan migration:
1. `20251210031414_create_subscriptions_schema.sql` — tabel subscriptions + RLS policies
2. `20251210032217_add_subscription_extra_fields.sql` — field tambahan (email, phone, reminder)
3. `20251210034320_create_user_preferences.sql` — tabel user_preferences
4. `20251210040241_optimize_rls_policies.sql` — optimasi RLS dengan `(select auth.uid())`
5. `20251210044149_add_domain_category.sql` — tambah kategori Domain
6. `20251210050000_add_telegram_integration.sql` — integrasi Telegram

Cara apply migration ke hosted Supabase:
- Via MCP: gunakan tool `apply_migration` dengan project_id dan query SQL
- Via CLI: `npx supabase db push` (push local migrations ke remote)

### Sync Migration dari Remote
Jika ada perubahan di hosted database, sync ke local:
```bash
npx supabase migration fetch --yes
```

### Generate TypeScript Types
Setelah schema berubah, generate types:
```bash
npx supabase gen types --linked > src/lib/database.types.ts
```


## Coding Style & Naming Conventions
- TypeScript + React 18, functional components only. Prefer hooks over classes; keep side effects inside `useEffect`.
- File naming: components PascalCase (`AddSubscriptionModal.tsx`), hooks prefixed `use*`, utilities camelCase. Keep contexts in `src/contexts` and Supabase/client helpers in `src/lib`.
- Indentation: 2 spaces; keep imports sorted by origin (packages, then local).
- Use Tailwind for styling; avoid inline styles except for dynamic values. Run `npm run lint` before committing to satisfy `eslint.config.js`.

## Testing Guidelines
- No automated tests are present yet. Minimum pre-PR checks: `npm run lint`, `npm run typecheck`, and a manual pass of key flows (auth, add/edit subscription, calendar view).
- When adding tests, colocate with features (e.g., `src/components/__tests__/Component.test.tsx`) and cover Supabase interactions with mocks.

## Commit & Pull Request Guidelines
- Git history favors short, imperative subjects mentioning scope (e.g., "Update AddSubscriptionModal.tsx"). Follow the same tone.
- For PRs: include a concise summary, linked issue/ticket, screenshots or GIFs for UI changes, and a checklist of commands run (lint, typecheck, preview). Note any Supabase migration added under `supabase/migrations/`.

## Security & Configuration Tips
- Environment variables live in `.env` (copy from `.env.example`); never commit secrets. Required keys: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Keep SQL changes in migrations and verify RLS expectations locally before deploy. Netlify deploy settings come from `netlify.toml`; adjust env vars there rather than hardcoding in source.
- Setelah apply migration, selalu jalankan security check via MCP `get_advisors` dengan type "security".
