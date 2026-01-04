# Isostat

A platform for tracking and analyzing statistics from 1v1 basketball YouTube videos.

## Stack

- **Frontend:** Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** tRPC v11, Prisma ORM
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **UI Components:** Radix UI, Lucide Icons, Recharts
- **Testing:** Vitest, Playwright
- **Code Quality:** ESLint (Airbnb), Prettier

## Development setup

```bash
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Create `.env` based on `.env.example`:

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

## Administration

Admin features (`/admin/dashboard`, `/admin/videos`, `/admin/players`, `/admin/games`) require an account with the `isAdmin` flag. To promote a user:

1. Sign up at `/signup`
2. Run the promotion script:

```bash
npx tsx scripts/make-admin.ts user@example.com
```

3. Log in to verify access at `/admin/dashboard`


## Database

PostgreSQL database is required. Using Supabase (free tier available). Schema includes:

- **User** - User accounts with authentication
- **Player** - Basketball players in videos
- **Video** - YouTube videos containing 1v1 games
- **Game** - 1v1 matchups between two players
- **Ruleset** - Game rulesets (scoring, possession type, etc.)
- **Stat** - Detailed basketball statistics per game

See `prisma/schema.prisma` for complete schema.

## API

Type-safe API via tRPC with modular routers:

- `player.*` - Player CRUD and statistics
- `video.*` - Video submission and listing
- `game.*` - Game management
- `ruleset.*` - Ruleset queries
- `user.*` - User authentication

## Project structure

```
isostat/
├── src/
│   ├── app/              # Next.js pages and routes
│   ├── components/       # React components
│   ├── lib/              # Utilities and tRPC client
│   ├── server/           # tRPC routers and API logic
│   └── schemas/          # Zod validation schemas
├── prisma/               # Database schema and migrations
└── .github/              # CI/CD workflows
```

## Current progress

### Phase 1 (MVP) - COMPLETE

- **Database:** Full schema with User, Player, Video, Game, Ruleset, Stat models
- **API:** Complete tRPC routers with type-safe procedures
- **Admin:** Dashboard, video moderation, player management, game entry
- **Public:** Video submission, video/game listings, player profiles
- **Auth:** Supabase Auth with admin role-based access
- **CI/CD:** GitHub Actions (lint, type-check, test, build)

### Future work

- Player profile pages with career stats
- Video submission and YouTube metadata scraping
- Manual game stat entry
- Leaderboards and stat aggregation
- Public REST API for external access
