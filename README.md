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

### Connection pooling

The database sits behind Supabase's pooler, and the ceiling is
(app instances × pool size), not pool size alone. `src/server/db.ts` caps each
pool at 3 — override with `DATABASE_POOL_MAX`. Running out surfaces as an
`EMAXCONNS` error on an innocent-looking query, not as anything resembling a bug.

Two ports are available on the same host:

| Port | Mode        | Use for                                              |
| ---- | ----------- | ---------------------------------------------------- |
| 5432 | session     | local development, and migrations                    |
| 6543 | transaction | anything serverless, where instances come and go     |

Both are verified to work with Prisma 7 and `@prisma/adapter-pg`, interactive
transactions included. Prefer 6543 for the deployed app.

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
for the things the app counted.

JetBrains Mono NL ships with the app, subset to Latin — no operating system
carries it, so without that it would fall back everywhere but the machine it was
built on. It is SIL Open Font Licensed; see `src/app/fonts/NOTICE.md`.

Helvetica Neue is *not* shipped. It is proprietary and cannot be redistributed.
macOS and iOS already have it; Windows falls back to Arial and Android to its
default grotesque, both of which are close enough that the layout does not
shift.

Light and dark are chosen in the top bar and remembered in `localStorage`.
"Auto" follows the system. A small script in `<head>` applies the stored choice
before the first paint, so the wrong theme never flashes.

## Daily tasks

One card, centred, nothing else. It has two modes and you click between them.

**View** shows the day's lines: a checkbox, the task, and its clock time. A
linked task carries a dotted underline under the habit it feeds — that
underline is what says "this counts for something". A line written like a link
but matching no habit gets a wavy red underline instead of being quietly
downgraded to a free task, because that is a typo worth seeing. Whatever is
happening right now is lit.

**Edit** shows the same day as raw lines you can type. Each line is bound to its
task, so a line the schedule wrote refuses edits, and fixing a typo never loses
the fact that a task was done. Enter opens a line, Backspace on an empty one
removes it, Tab accepts the top suggestion, Escape finishes.

### The line syntax

```
Calisthenics.Push 19:30-20:30    habit, task, and a span
Buy bread 13:40                  free task with a time
Wash dishes                      free task
```

Only the name is required. `Habit.Task` links the line; everything else counts
toward nothing. The dot only links when it has no space around it *and* the
habit exists, so `Dr. Smith 10:00` and `etc.` stay ordinary prose.

### Rules worth knowing

- **Days**: yesterday, today, tomorrow. Chevrons or the arrow keys.
- **Settling**: a task can be ticked until the end of the day after it was due,
  then it settles for good. The window is exactly as far as the card can travel,
  so there is never grace you cannot reach. There is no "skipped" — unchecked is
  unchecked.
- **Order**: timed tasks sort themselves by the clock; untimed ones stay where
  you dragged them, keeping their neighbours.
- **Rotation**: a habit cycles through names across its occurrences, so one
  `Calisthenics` on Mondays and Thursdays produces Push, then Pull.
- **Removing**: deleting the line is the only way. Ticking never removes
  anything, and a generated line can only be removed by changing its habit.

## Still to build

Three of the five screens: journal and mood, quests, habits and training. The
schema already covers them, including the end-of-season reflection.

Season task totals — completed against uncompleted for a whole season,
filterable by whether a task was linked — belong in the reserved Statistics
square on the homepage.

The calendar squares are blank on purpose — they are held for the hours logged
at the office, which will arrive from the NFC reader.

Tasks are materialised up to today only; the daily screen will want to run
`materializeTasks` forward as well.
