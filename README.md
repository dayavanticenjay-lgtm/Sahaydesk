# Sahaydesk

A modern rebuild of the helpdesk ticketing app (originally Laravel + Inertia/React) on:

- **Next.js 16** (App Router, Turbopack, Server Actions)
- **TypeScript**
- **PostgreSQL** via **Prisma 7** (driver adapters — `@prisma/adapter-pg`)
- **Auth.js / NextAuth v5** (credentials + JWT sessions)
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives)
- **Recharts** for the dashboard chart
- **OpenAI SDK** (Groq-compatible) for AI ticket summaries and reply polishing

## Domain

Mirrors the Laravel app's core model: `User` (admin/agent, optional AI agent flag),
`Ticket` (status, category, sender, assignee), `TicketReply` (agent/customer). Dashboard
stats, tickets list (filter/search/sort/paginate), ticket detail with replies, AI
summarize + polish, and an inbound-email webhook that creates/threads tickets.

## User management

`/users` (admin-only, gated by `requireAdmin()` in `src/lib/dal.ts`) lets admins create
accounts, promote/demote between Admin and Agent, and deactivate/reactivate users
(soft delete via `deletedAt` — deactivated users can't log in and are excluded from the
ticket assignee list). Admins can't modify their own role or deactivate themselves.
The seeded admin is `admin@example.com` / `password`.

## Setup

1. **Create the database** (local Postgres, matches `.env`):

   ```bash
   sudo -u postgres psql -c "CREATE USER helpdesk_modern WITH PASSWORD 'helpdesk_modern' CREATEDB;"
   sudo -u postgres psql -c "CREATE DATABASE helpdesk_modern OWNER helpdesk_modern;"
   ```

   Or point `DATABASE_URL` in `.env` at any Postgres instance you already have.

2. **Install dependencies** (also runs `prisma generate` via `postinstall`):

   ```bash
   npm install
   ```

3. **Run migrations and seed data**:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

   Seeds an admin (`admin@example.com`), an agent (`agent@example.com`), and an AI
   agent user, plus a handful of sample tickets. Password for both: `password`.

4. **Start the dev server**:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000 — you'll be redirected to `/login`.

## AI features

Ticket summarize/polish need `OPENAI_API_KEY` in `.env`. By default `OPENAI_BASE_URL`
points at Groq's free OpenAI-compatible API (get a key at https://console.groq.com/keys);
unset it to use OpenAI directly.

## Inbound email webhook

`POST /api/webhooks/inbound-email` accepts `{ from, subject, text, html }` and requires
the shared secret from `WEBHOOK_SECRET`, either as `?secret=` or an `X-Webhook-Secret`
header. Creates a new ticket, or appends a reply if an open ticket from the same sender
with the same subject already exists.

## Inbound IMAP polling

`npm run imap:poll` runs a standalone, long-lived process (separate from `npm run dev`)
that polls an IMAP inbox every `IMAP_POLL_INTERVAL_MS` (default 90s) and feeds matching
messages through the same `handleInboundEmail` logic as the webhook above.

Configure `IMAP_HOST`/`IMAP_PORT`/`IMAP_SECURE`/`IMAP_USERNAME`/`IMAP_PASSWORD` in `.env`
(for Gmail: `imap.gmail.com`, port 993, an App Password — same one used for `MAIL_*`).

Only unread messages whose Subject contains `IMAP_SUBJECT_FILTER` (default `"ticket"`,
case-insensitive) are ever touched — that filter runs server-side as part of the IMAP
SEARCH query, so every other message in the mailbox (personal mail, newsletters, etc.)
is never fetched, parsed, or flagged. Matched messages are marked `\Seen` after being
turned into a ticket or threaded reply.

## Deployment (Railway)

Builds from the root `Dockerfile` (Railway auto-detects it via `railway.toml`, which
also sets the health check and deploy command). The same image serves two separate
Railway services:

1. **Web** (default service, configured by `railway.toml`) — runs
   `npx prisma migrate deploy && npm start`, applying pending migrations before every
   deploy, then serving the app on the port Railway assigns.
2. **Worker** — add a second Railway service pointing at the same repo/branch, then
   override its **Start Command** (Settings → Deploy) to:

   ```
   npm run imap:poll
   ```

   This runs the long-lived IMAP poller as its own process/container, since a single
   Railway service can only run one start command and Next.js has no built-in place
   for a background job like this. Give the worker service the same `DATABASE_URL`
   and `MAIL_*`/`IMAP_*` variables as the web service (no `NEXTAUTH_URL`/`AUTH_*`
   needed there — it never serves HTTP).

### Setup checklist

- **Database**: add Railway's Postgres plugin to the project; it exposes `DATABASE_URL`
  automatically — reference it in both services' variables (e.g. `${{Postgres.DATABASE_URL}}`).
- **Required env vars** (web service): `DATABASE_URL`, `AUTH_SECRET` (generate a real
  one — see `.env.example`), `AUTH_TRUST_HOST="true"` (required behind Railway's proxy,
  see `.env.example`), `NEXTAUTH_URL` (your Railway/custom domain), `WEBHOOK_SECRET`
  (a real secret, not the dev placeholder).
- **Required env vars** (worker service): `DATABASE_URL` plus `IMAP_HOST`/`IMAP_PORT`/
  `IMAP_SECURE`/`IMAP_USERNAME`/`IMAP_PASSWORD` and, if outbound replies should send,
  `MAIL_*`.
- **Optional**: `OPENAI_API_KEY` (+ `OPENAI_BASE_URL`/`OPENAI_MODEL`) for AI features;
  `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` for Google sign-in — if enabled, update the
  OAuth client's redirect URI to `{NEXTAUTH_URL}/api/auth/callback/google` with the
  production URL.
- **First admin account**: `/signup` is public, but it always creates a *deactivated*
  Agent (`deletedAt` set, pending an admin's approval in `/users`) — there's no way to
  self-register as an active Admin. On a fresh database, seed one via
  `railway run npm run db:seed` (also adds sample agent/tickets — fine to skip if
  unwanted), or connect to the Railway Postgres instance directly and insert an admin
  row by hand.
- **Health check**: `GET /api/health` (configured in `railway.toml`) — pings the
  database and returns `503` if unreachable, so Railway won't route traffic to a
  service that can't talk to Postgres.

## Notes / known issues

- **`middleware.ts` instead of `proxy.ts`**: Next.js 16 renamed the middleware
  convention to `proxy.ts`, but as of Next 16.2.10 the Node.js-runtime `proxy.ts` path
  throws `TypeError: adapterFn is not a function` under Turbopack dev — a framework bug,
  reproducible even with a no-op proxy. `middleware.ts` (deprecated but functional, and
  still Edge-runtime) is used instead. Because of that, auth config is split into
  `src/auth.config.ts` (Edge-safe, no Prisma) for the middleware's optimistic
  redirect check, and `src/auth.ts` (full config with the Prisma-backed credentials
  provider) for Server Components/Actions/Route Handlers. Revisit once upstream fixes
  the `proxy.ts` + Turbopack issue.
- Prisma's generated client lives in `src/generated/prisma` (gitignored, rebuilt via
  `prisma generate` / `postinstall`).
