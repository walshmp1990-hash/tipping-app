# Tipping App (World Cup v1)

A mobile-first Next.js + Prisma + Postgres tipping competition app.

## Stack

- Next.js 14 App Router + TypeScript
- PostgreSQL
- Prisma ORM + migrations
- NextAuth (Credentials)
- Tailwind CSS
- Zod validation
- Vitest unit tests

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env vars:

```bash
cp .env.example .env
```

3. Run Prisma migration/deploy:

```bash
npx prisma migrate dev --name init
```

4. Start dev server:

```bash
npm run dev
```

## Environment Variables

Create `.env` with:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tipping_app?schema=public"
NEXTAUTH_SECRET="replace-me"
NEXTAUTH_URL="http://localhost:3000"
```

## CSV Import

- Visit `/admin/import`
- Paste CSV with required headers:
  - CompetitionID
  - Date
  - Stage
  - Game Week
  - Home_TeamID
  - Away_TeamID
  - Fixture Number
- Click **Dry Run** to preview create/update counts.
- Click **Apply Import** to upsert fixtures.

Implementation details:
- Dates parsed as `Europe/London` and stored UTC.
- Teams auto-created per competition.
- Fixture upsert uses unique `(competitionId, fixtureNumber)`.
- Round lock time recalculated to earliest fixture in round.

## Scoring & Recalculation

- Admin submits result via `/api/admin/results`.
- Save triggers `recalculateFixturePoints(fixtureId)` automatically.
- Admin can force recalc:
  - Fixture: POST `/api/admin/recalculate` with `{ fixtureId }`
  - Active competition: POST `/api/admin/recalculate` with `{}`
- Recalculation is idempotent (fixture awards are deleted then recreated).

## Mark Users Paid

Leaderboard only includes paid users (`PaymentStatus.isPaid = true`).

You can mark a user paid in Prisma Studio:

```bash
npx prisma studio
```

Then set/create `PaymentStatus` for `(userId, competitionId)` with `isPaid=true`.

## Running Tests

```bash
npm run test
```

Covers:
- Group scoring
- Perfect round bonus
- Knockout scoring markets
- Golden goal scoring
- MoM scoring
- Round lock enforcement
- CSV upsert parsing behavior
