# Running this on your own computer (Windows)

You're getting the actual source code, this is the exact same app that's
been running and getting tested in the build session, just copied onto your
machine. Nothing here is a demo or a cut-down version.

## 1. Prerequisites

- **Node.js 20+** — https://nodejs.org (get the LTS installer). Check with
  `node -v` in a terminal.
- **A Postgres database.** Two options, pick one:
  - **Docker Desktop** (easiest if you have it): a `docker-compose.yml` is
    included, see step 3.
  - **Native Postgres**: install from https://www.postgresql.org/download/windows/,
    create a database called `mytm_crm`, and adjust `DATABASE_URL` in step 2
    to match the user/password you set during install.

## 2. Unzip and configure

1. Unzip `mytm-crm.zip` wherever you keep projects.
2. Open a terminal in that folder (PowerShell or Command Prompt).
3. Copy `.env.example` to `.env`:
   ```
   copy .env.example .env
   ```
4. Generate an `AUTH_SECRET` and paste it into `.env` (any random 32+
   character string works for local use, or run this in PowerShell):
   ```
   powershell -Command "[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))"
   ```
5. Leave `DATABASE_URL` as `postgresql://postgres:localdev@localhost:5432/mytm_crm`
   if you're using the included `docker-compose.yml` (step 3). If you
   installed Postgres natively, change it to match what you set up.
6. Leave `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `HUBSPOT_TOKEN`, and
   `OPENAI_API_KEY` blank for now — every feature that needs them falls back
   gracefully without them. Fill them in later when you have them (see the
   main `README.md` for exactly what each one turns on).

## 3. Start Postgres (skip this if you installed it natively)

```
docker compose up -d
```

This starts a local Postgres container with the database already named
correctly. Leave it running in the background.

## 4. Install and set up the database

```
npm install
npx drizzle-kit push
npx tsx src/db/seed.ts
```

The seed script creates 3 sample users, sample accounts/contacts/leads/deals,
and two deal pipelines (including a sample "LEAP 2026" event pipeline).

## 5. Run it

```
npm run dev
```

Open http://localhost:3000 (or whatever port it prints) and log in with:

```
ahmad.aziz@mytm.co / mytm2026
```

(see `src/db/seed.ts` for the other two seeded users)

## Everything in `README.md` still applies

Stack notes, what's real vs. still placeholder, and how to connect
Gmail/Calendar and HubSpot once you have those credentials are all in the
main `README.md` in this same folder.
