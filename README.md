# Hibi Habits

日々 — day after day. A habit tracker built around seasons: one calendar
quarter of living, anchored by a small number of quests you set at the start
and mostly leave alone.

## The pyramid

Everything logged belongs somewhere in one structure:

```
Category      Health · Relationships · Independence
Subcategory   Mind Body Spirit · Love Family Friends · Work Growth Money
Quest         one MAIN per category per season, plus any number of SIDE
Habit         a repeating practice, carrying a schedule
Task          one thing, on one day
```

You touch it from the bottom: tasks daily, habits now and then, quests once a
season. Categories and subcategories are never editable — they are the
philosophy, so they live in `src/lib/taxonomy.ts` rather than in a table. Only
`subcategory` is ever stored; its category is always derived, so the two cannot
drift apart.

The pyramid is a shape, not a cage. A task can hang off a habit, straight off a
quest, or off nothing at all.

## Seasons are calendar quarters

A season always begins on the 1st of January, April, July or October. That makes
"which season does this day belong to" arithmetic rather than a lookup, and it
means a season can never half-exist.

The switcher in the top right moves between quarters, and every quarter is
reachable whether or not anyone has opened it. This is deliberate: finishing a
season's write-up at 00:01 on the first day of the next one should land on the
season you meant, not on the one the clock just rolled into. The homepage also
raises a signal when a season has closed without a reflection.

## Running it

```bash
npm install             # postinstall generates the Prisma client
npm run db:migrate      # apply migrations
npm run db:seed         # two seasons, one live and one closed, ~300 tasks
npm run dev
```

`DATABASE_URL` in `.env` points at Postgres; set the same variable in the
deployment environment. Prisma 7 needs a driver adapter, wired up in
`src/server/db.ts`. The generated client is gitignored, which is why
`postinstall` regenerates it on every install, including on Vercel.

Other scripts: `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run db:studio`.

`db:seed` wipes all data before writing — it starts from `user.deleteMany`.

## Layout

```
prisma/
  schema.prisma            the data model, commented
  seed.ts, seed-content.ts a live season, and one already closed

src/
  lib/                     pure logic, no database, no React
    taxonomy.ts            the nine areas of life
    dates/                 days as 'YYYY-MM-DD'; all timezone conversion lives here
    seasons/quarter.ts     which quarter a day belongs to, and how to step between them
    seasons/calendar.ts    a quarter laid out as three month grids
    seasons/window.ts      day index, days left, elapsed
    habits/schedule.ts     which days a habit wants a task on
    quests/rules.ts        progress bounds, one-main-per-category
    theme.ts               the light/dark choice, and the script that applies it early

  server/                  everything that touches the database
    db.ts                  Prisma client
    current-user.ts        the single user, until sign-in exists
    queries/               read paths, one file per concern
    actions/               writes, as server actions
    tasks/materialize.ts   turns habit schedules into dated tasks

  components/
    ui/                    primitives: Panel, Meter, Eyebrow, Figure…
    home/                  the homepage's own blocks

  app/                     routes
  types/home.ts            the shape the homepage renders
```

The rule: `lib/` never imports from `server/`, and components never query the
database directly — a page asks `homeView()` for one object and renders it.

## Design

Hue means category and nothing else. Health, Relationships and Independence own
the only three colours on screen; every panel, rule and figure is ink on ground.
A splash of colour always tells you which part of life you are looking at.

Two typefaces: Helvetica Neue for the things a person wrote, JetBrains Mono NL
for the things the app counted. Both are expected to be installed locally — the
app loads no web fonts, so on a device without them the stacks fall back to the
nearest system face.

Light and dark are chosen in the top bar and remembered in `localStorage`.
"Auto" follows the system. A small script in `<head>` applies the stored choice
before the first paint, so the wrong theme never flashes.

## Still to build

Four of the five screens: daily tasks, journal and mood, quests, habits and
training. The schema already covers them, including the end-of-season
reflection.

The calendar squares are blank on purpose — they are held for the hours logged
at the office, which will arrive from the NFC reader.

Tasks are materialised up to today only; the daily screen will want to run
`materializeTasks` forward as well.
