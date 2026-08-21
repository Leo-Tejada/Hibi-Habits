# TODO — Habits graph

Written after the physics pass. Tree was clean at the commit that carries this.

## Where things stand

The habits graph works: the whole tree renders, collapses, expands, drags and
snaps back; habits and side quests can be created from the `+` on an area node
(a habit, or a loose side quest) and from the `+` on a habit node (a side quest
attached to that habit). The physics was measured rather than guessed at this
time round, and the constants in `src/lib/graph/simulation.ts` are hand-tuned
by the user on top of that.

## What was fixed, and how it was verified

The complaint was "too permissive — if I overthrow a subcategory, it stays away
and doesn't snap back". It had six independent causes:

1. **Nothing remembered the intended arrangement.** A force layout has many
   stable arrangements and settles into whichever it was last pushed toward, so
   a throw relocated the branch permanently. There is now a fourth force,
   `applyHoming`: every body keeps the seed position `buildGraph` computes for
   it and is drawn weakly back to it. This is what makes "layout is the same
   every visit, dragging is temporary" true rather than aspirational.
2. Repulsion beat the springs, so every edge rested ~25% long and mushy.
3. The release was *colder* than the drag (0.22 against 0.5), so the graph went
   cold while the branch was still crawling home.
4. `RING_RADIUS` was never updated when quests were inserted at depth 3, so
   everything below was seeded 35px inside the ring its own spring wanted. It is
   derived from `LINK_DISTANCE` now instead of written out twice.
5. The repulsion range cutoff floored the distance *before* comparing it, so any
   node bigger than the range — i.e. an opened card — was invisible to
   repulsion, exactly backwards.
6. Sibling spacing was an angle, so the crowded outer ring got *less* room than
   the inner one. It is an arc in pixels now, converted per ring.

Measured on the real tree, throwing four different nodes 755px and releasing:

| | before | after |
| --- | --- | --- |
| residual from home | 201 / 478 / 297 / 285 px | 89 / 156 / 55 / 10 px |
| mean edge error | 33.7px | 31.5px |
| overlapping pairs | 0 | 0 |

Confirmed in the browser too: a node thrown 645px returns fully, and the rest of
the graph returns to its settled arrangement exactly.

## Read this before touching the constants

`COLLISION_PADDING` is not like the others. `resolveCollisions` writes positions
**directly and ignores alpha**, by design — overlap is a state that must not
persist, not a force to be balanced. So it is the one thing that never cools,
and at high values it permanently fights the springs and the homing force on a
graph whose edges rest at 100–200px.

Measured, holding every other constant at its current value:

| `COLLISION_PADDING` | residuals after a throw | mean edge error |
| --- | --- | --- |
| 28 | 1 / 87 / 3 / 1 px | 23.0px |
| 44 | 8 / 81 / 7 / 2 px | 24.8px |
| **55 (current)** | **89 / 156 / 55 / 10 px** | **31.5px** |
| 70 | 229 / 127 / 71 / 19 px | 46.8px |

55 is a deliberate compromise the user chose knowing this: more air between
nodes, at the cost of a throw not landing perfectly. **Do not "fix" it down
without asking.** If more space is wanted, `REPULSION` and the `LINK_DISTANCE`
rest lengths buy it without the side effect.

`FRICTION` is at 0.5, the bottom of the range that was on offer during tuning —
the graph may want to be thicker still, so that is worth offering.

## Open questions for the user

- Does clicking a quest open the same blank card a habit does, or one with
  `QuestProgress`? Quest nodes are not clickable at all right now.
- `.claude/skills/graph-skills/` and `skills-lock.json` were committed in
  `90ee850` from the user's own `npx skills add`, not from the feature. They are
  the only source of the 14 remaining lint errors — `src/` itself is clean.
  Should they be in the repo?

## Decisions already made — do not re-ask

- **The pyramid flipped on 2026-08-21**: Category → Subcategory → **Habit** →
  Quest → Task. A quest hangs off the habit that serves it (and then takes that
  habit's area); a loose quest stands beside the habits of its own area.
  `Task.questId` is gone — a quest's recent figures are its serving habit's
  tasks.
- Quests appear on the graph, main and side — attached ones under their habit,
  loose ones under their subcategory.
- **Main quests are bold, side quests are italic**, and each takes its own step
  on the fill ladder: `area 45 → habit 24 → questMain 39 → questSide 31` percent
  of the category hue. No dashed borders on quests — dashes mean "provisional"
  and belong to the pending node and collapsed branches only.
- **Habits hold their quests** — the one kind of child a habit has, after the
  flip. (Before it: "habits cannot hold children".)
- Habits attach to **subcategories only**, never to a category.
- Creating a habit asks for **a name only**. Born `WEEKLY_DAYS` with empty
  `weekdays`, which wants no day, so it writes nothing into `/daily` until
  scheduled — it only suggests itself while a day is being written.
- Creating a side quest **opens the season silently** if the quarter has none —
  `upsert`, so two quests named at once cannot race into two seasons. A habit
  node's `+` creates the quest already attached to it.
- Clicking a habit **morphs it in place** into a blank card; the graph pushes
  aside. The card stays blank on purpose — it is the shell Journal and Quests
  will share.
- Layout is the **same every visit**; dragging is temporary.
- Structural nodes **collapse and expand**, and the rest must redistribute.
- Desktop first; phone only needs to be legible.
- All nodes are **sharp-cornered and solid-filled** with their category hue.
  Hue means category and nothing else; depth is carried by fill strength. Mono
  vs Helvetica is the only thing separating structural nodes from habits.
- **`You` is the one unfilled node** — it belongs to all three categories.
- The **Statistics panel is removed** (2026-08-21) — per-area tallies stopped
  earning their place beside the quests and signals.

## How to verify this area

Numerically, not by eye. A throwaway `.mts` file at the repo root, run with
`npx tsx --env-file=./.env --tsconfig ./tsconfig.json ./probe.mts`, can import
`@/lib/graph/*`, `@/lib/habits/tree` and `@/server/db` and step the simulation
with no browser at all. Build the graph, settle it, record every position, then
throw a node and compare. Three ways that harness lies, each of which produced a
confident wrong answer:

- **Forgetting `sim.links`.** `createSimulation` starts with none, so you
  measure a graph with no springs and get edges "resting" at 3× their target.
- **Teleporting the node instead of dragging it.** Pin it, move it a little each
  frame with the graph held at `DRAG_ALPHA`, then release. Teleporting leaves
  the neighbours undisturbed and understates the residual — 33px against a real
  232px.
- **A toy fixture.** Nine nodes come home at almost any setting; only the real
  tree from the database shows the difference.

A panel of sliders over `physicsConfig` was built for tuning this by feel, used,
and then deleted before committing — so it is *not* in the history and there is
nothing to revert to. Rebuilding it is cheap and worth it before any further
tuning: `physicsConfig` is a single plain object that `step()` re-reads every
tick, so a `<input type="range">` per key that writes straight into it takes
effect on the next frame with no rebuild and no React state involved. Gate it on
`process.env.NODE_ENV === 'development'` and give it a way to reheat the
simulation, or the graph will be cold when the slider moves.

## Environment traps

- **`prisma migrate dev` hangs against the pooler.** With `DATABASE_URL` on
  Supabase port 6543 there is no error — the CLI sits waiting on a shadow
  database it cannot create, and `db execute` fails with
  `prepared statement "s1" already exists` (PgBouncer refuses the CLI's
  prepared statements). The path that works: hand-write
  `prisma/migrations/<ts>_<name>/migration.sql` (constraint and index names
  follow Prisma's `<table>_<column>_fkey` / `<table>_<column>_idx` style —
  confirm against earlier migrations), apply it with a throwaway `*.mts` at
  the repo root using the `pg` driver (`bunx tsx`), then hand-insert the
  `_prisma_migrations` row (`gen_random_uuid()::text`, checksum = `shasum -a
  256` of the file, `applied_steps_count` 1, `finished_at now()`), then
  `bunx prisma generate`. Or point `.env` at session mode (5432) and let the
  CLI work normally. Used for `20260821190000_habits_above_quests`.
- **The browser tab must have focus.** Not merely be visible —
  `document.hasFocus()`. Without it `/habits` sits on its loading fallback
  forever: the `next/dynamic` `ssr: false` chunk never resolves, `HabitGraph`
  never mounts, and the page shows an empty field with **no console error and a
  clean 200 in the server log**. An earlier session recorded this as "the dev
  server wedges" and prescribed `pkill && rm -rf .next` — that is wrong and cost
  hours twice. Click the page, then wait ~8s.
- **`requestAnimationFrame` is throttled in an unfocused tab**, so no animation
  is observable. CSS transitions do not advance either, so
  `getBoundingClientRect` reads the *pre-transition* size while the inline style
  already holds the new one. Read `element.style.width` to see what React set.
- **A synthetic `.click()` is not a click.** It fires no `pointerdown`, so
  `startDrag` never resets `draggedRef`, and a stale `true` from an earlier
  gesture swallows it. Dispatch `pointerdown` + `pointerup` + `click`.

## Still to build

- **Main quests cannot be created from the graph** — only side quests. The
  one-main-per-category rule in `canAddMainQuest` has no interface yet, and
  setting the three anchors is the ceremony that opens a season, so it probably
  wants its own screen rather than a `+` on an area node.
- Journal and Quests screens are unbuilt. The user is "not satisfied nor done"
  with the homepage.
- Drag-to-reorder on the daily card has never been confirmed with real input.

## Older, still open

- **Rotate the Supabase password.** It appeared in a chat transcript in an
  earlier session and must be treated as compromised. Rotation has never been
  confirmed. Supabase → Settings → Database, then update local `.env` and
  Vercel's `DATABASE_URL`, keeping port `6543`, then redeploy.
