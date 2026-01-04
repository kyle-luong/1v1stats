# Isostat

A platform for tracking and analyzing statistics from 1v1 basketball YouTube videos.

## Stack

- **Frontend:** Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** tRPC v11, Prisma ORM
- **Database:** PostgreSQL (via Supabase)

## Development setup

```bash
npm install
cp .env.local .env
# Edit .env with your Supabase credentials
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Create `.env` based on `.env.local`:

```bash
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJxxx..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Available scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run linter
- `npm run type-check` - TypeScript type checking
- `npm run test` - Run tests
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Database

PostgreSQL database is required. Using Supabase (free tier available). Schema includes:

- **User** - User accounts with authentication
- **Player** - Basketball players in videos
- **Video** - YouTube videos containing 1v1 games
- **Game** - 1v1 matchups between two players
- **Stat** - Detailed basketball statistics per game

See `prisma/schema.prisma` for complete schema.

## API

Type-safe API via tRPC with modular routers:

- `player.*` - Player CRUD and statistics
- `video.*` - Video submission and listing
- `game.*` - Game management
- `stat.*` - Statistics aggregation and leaderboards

## Project structure

```
isostat/
├── app/              # Next.js pages and routes
├── components/       # React components
├── lib/             # Utilities and tRPC client
├── prisma/          # Database schema and migrations
├── server/          # tRPC routers and API logic
└── .github/         # CI/CD workflows
```

## Current progress

### Phase 1 (MVP) - COMPLETE

- **Database:** Full schema with Rulesets, Games, Players, Videos, and Users
- **API:** Complete tRPC router implementation (`video`, `player`, `game`, `ruleset`)
- **Admin:** Dashboard, moderation queue, player management, game entry
- **Public UI:**
  - Video submission and deduplication
  - Video and game listings
  - Player profiles with stats
  - Game details with YouTube embeds
- **Auth:** Supabase Auth with admin role-based access
- **Quality:** Full CI/CD (lint, type-check, test, build)

## Future work

- **Phase 1.5:** Channel whitelisting and automated scraping
- **Phase 2:** Transcript-based event inference
- **Phase 3:** Community labeling tool (The "Moat")
- **Phase 4:** Computer Vision automation
- **Phase 5:** Advanced analytics and monetization

