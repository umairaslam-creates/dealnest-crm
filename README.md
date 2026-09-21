# MYTM Sales CRM

Internal CRM for MYTM's sales team: leads, contacts, pipeline (including custom
event pipelines like LEAP or Money 20/20), deals, dashboard, reports, and
on-demand AI + Gmail/Calendar integrations. Fully working locally right now,
backed by a real Postgres database, not a mockup.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind v4), Server Components + Server Actions
- Database: Postgres. Locally this uses the Postgres already installed in this
  environment; in production point `DATABASE_URL` at Supabase or Neon's free tier
- ORM: Drizzle (chosen over Prisma: Prisma's CLI needs to download a native
  engine binary from binaries.prisma.sh at generate/migrate time, which this
  sandbox's network policy blocks; Drizzle talks to Postgres directly with no
  binary download, and is just as valid a free-tier choice for Vercel/Supabase/Neon)
- Fonts: self-hosted (Poppins + a monospace for numbers) via next/font/local,
  not fetched from Google Fonts at build time, so the build never depends on
  external network access
- Auth: Auth.js v5 (Credentials provider, JWT session, bcrypt password hashing),
  every route except /login requires a signed-in session
- File import: `xlsx` (SheetJS), parses .csv/.xlsx entirely client-side, no
  file upload storage needed
- AI: OPENAI_API_KEY, called ONLY on demand (button click or a typed command),
  never on a background schedule. Without a key set, both AI features fall
  back to a simple rule-based suggestion so the buttons still work locally
- Gmail / Calendar: plain fetch against Google's OAuth + REST endpoints (no
  SDK), triggered only by clicking "Email" or "Schedule meeting" on a deal

## Running it locally

```
service postgresql start        # if not already running
npm install
npx drizzle-kit push            # creates tables from src/db/schema.ts
npx tsx src/db/seed.ts           # loads sample users/leads/deals/pipelines
npm run dev
```

Log in with one of the seeded users, e.g. `ahmad.aziz@mytm.co` / `mytm2026`
(see `src/db/seed.ts` for the others). Add or remove teammates from
Settings > Team. Connect Gmail/Calendar/OpenAI from Settings > Integrations
once you have credentials for them (see Environment variables below).

## What's real vs. still a placeholder

Real, backed by Postgres, verified end to end:
- Login/logout with real sessions, every page redirects to /login when signed
  out
- Leads and Deals kanban boards, drag and drop persists to the database and
  logs a stage-history event
- Custom pipelines and stages (add/rename/delete), including a sample
  "LEAP 2026" event pipeline separate from the main sales pipeline
- "New deal" on the Pipeline page (name, value, currency, account, owner,
  stage), and "Convert to deal" on any lead card, which creates the deal,
  logs a "converted from lead" note, and moves the lead to a Converted
  stage if one exists
- Deal cards on the Pipeline board link straight to that deal's detail page
- Dashboard stats, lead source breakdown, and pipeline-by-region are computed
  live from the database
- Contacts: add/delete, linked to an account
- Deal detail page: change stage, log activities (call/meeting/note/email),
  add/complete tasks, run "Analyze & Suggest" and see the saved suggestion
  history, plus "Email" and "Schedule meeting" (once Google is connected)
- Reports page: pipeline coverage by stage, win/loss rate, per-rep breakdown,
  all computed live from the database
- Settings > Team: add a teammate (name/email/password/role) or remove one
- Settings > Integrations: live status for Google, OpenAI, and HubSpot, with
  a "Connect Google account" button and exactly what env var each one needs
- "Pipeline Analytics" chart: real cumulative deal value by week created,
  computed from the database
- Leads > "Import from file": upload a .csv or .xlsx, columns are matched
  loosely (Name/Company/Email/Phone/Source/Region, case-insensitive), so a
  HubSpot "export contacts" file works as-is with no reformatting. Rows
  land in whichever stage you pick before confirming
- Gmail send + Google Calendar event creation: code path is complete
  (OAuth connect/callback, token refresh, send/create calls, activity
  logging on success) and verified to degrade correctly with no credentials
  set (Integrations page shows "Not configured", deal detail shows a
  "Connect Google" prompt instead of the buttons). Not yet exercised
  against a real Google account, since that needs your own Google Cloud
  OAuth client (see below) and this sandbox's network can't reach Google's
  OAuth endpoints to test it here regardless

Still placeholder, needs more building:
- "Pipeline Analytics" shows value created over time, not a true snapshot
  of pipeline state at each point in the past. A `stage_history` table now
  exists and logs every move, so this can be upgraded once enough history
  accumulates
- Live HubSpot API sync (as opposed to importing its CSV export): not
  started, needs a HubSpot private app token
- Not yet deployed, still running local Postgres + local dev server; Vercel
  + a hosted Postgres (Supabase/Neon free tier) is the next step

## Setting up Google (Gmail + Calendar)

1. In Google Cloud Console, create an OAuth 2.0 Client ID (type: Web application).
2. Add `<your app URL>/api/integrations/google/callback` as an authorized
   redirect URI (e.g. `http://localhost:3311/api/integrations/google/callback`
   locally, or your Vercel URL in production).
3. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `NEXTAUTH_URL` (your
   app's base URL) in `.env`.
4. Restart the app, go to Settings > Integrations, click "Connect Google
   account", sign in and approve the Gmail-send + Calendar-events scopes.
5. "Email" and "Schedule meeting" appear on every deal's page once connected.

## Environment variables (see .env.example)

- `DATABASE_URL` - Postgres connection string
- `AUTH_SECRET` / `NEXTAUTH_URL` - Auth.js session secret and this app's base URL
- `OPENAI_API_KEY` - for the on-demand AI features (optional, falls back to
  rule-based suggestions if unset)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - for Gmail + Calendar, see above
- `HUBSPOT_TOKEN` - for a future live HubSpot sync (CSV import works today
  without it)
