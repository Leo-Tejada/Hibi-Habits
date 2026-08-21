# Handoff — Habits graph

Written at `ac07a11`. Tree was clean.

## What is mine and what is not

I built the habits graph in `90ee850` (`src/lib/graph/*`, `src/components/habits/*`,
`src/server/queries/{habits,completion}.ts`, `src/server/actions/habits.ts`,
`src/lib/habits/*`, the homepage Statistics panel).

**I have never seen `212c1fa` or `ac07a11`, nor `quest-node.tsx`.** Zoom/pan, the
floating navbar, and quest support arrived after me and I have not reviewed them.
Read those before trusting anything below about physics or layout — several of my
constants were touched by `patch_forces.js` / `patch_layout_zoom.js`.

Also: `.claude/skills/graph-skills/` and `skills-lock.json` were committed in
`90ee850`. Those came from the user's own `npx skills add`, not from the feature.
Worth asking whether they belong in the repo.

## Decisions the user already made — do not re-ask

- Quests were originally **left out** of the graph; the user reversed this in the
  final message and now wants main and side quests under their subcategory.
- **Habits cannot hold children.** They reversed an earlier answer to get here:
  "It is easier that way and I force myself to not make anything a habit."
- Habits attach to **subcategories only**, never to a category.
- Creating a habit asks for **a name only**. It is born `WEEKLY_DAYS` with an empty
  `weekdays` array, which wants no day at all, so it writes nothing into `/daily`
  until scheduled. Verified: 0 tasks generated. Do not change this without asking.
- Clicking a habit **morphs it in place** into a blank card; the graph pushes aside.
  The card stays blank on purpose — it is the shell Journal and Quests will share.
- Layout is the **same every visit**; dragging is temporary.
- Structural nodes **collapse and expand**, and the rest must redistribute.
- Desktop first; phone only needs to be legible.
- All nodes are **sharp-cornered and solid-filled** with their category hue, stepped
  by depth (category 100% / area 45% / habit 24%, mixed toward `--panel`). Mono vs
  Helvetica is the *only* thing separating structural nodes from habits.
- **`You` is the one unfilled node** — it belongs to all three categories.
- Season completion is shown per area on the **homepage**, not on the graph.

## Outstanding, from the user's last message

1. **Physics too permissive.** "If I overthrow a subcategory, it stays away and
   doesn't snap back." I had just halved `REPULSION`/`SPRING` and set release alpha
   to 0.22, which overshot into mush. They want it snappier — but the round before,
   they said the old values snapped too harshly, so it is between the two.
   They explicitly invited **dev-only sliders** to tune it live. That is probably the
   right answer; I kept guessing at a taste parameter.
   Note `patch_forces.js` and `patch_layout_zoom.js` already changed this area.
2. **A second `+` on the left of each area node** that creates a *side quest*
   (existing right-hand `+` creates a habit).
3. **Main quests must appear** under their subcategory too.

## Open questions I was about to ask when the session ended

- Do habits nest under their quest (`Habit.questId` exists), or sit as siblings of
  quests under the area?
- How are main quest / side quest / habit told apart visually, now that shape and
  colour are both spoken for?
- A `Quest` row needs a `Season` row, and a quarter has none until something creates
  one. Should the side-quest `+` open the season silently, or be disabled?
- Does clicking a quest open the same blank card, or one with `QuestProgress`?

## Known bugs

- `today-panel.tsx:24` calls `<Meter value={...} />` with **no `tone`**, so it falls
  back to `var(--activity)` — a variable defined nowhere in `globals.css`. That bar
  renders with no fill on the homepage right now. I said I would fix it and did not.
- `loading.tsx` shows the homepage's panel skeleton on `/habits`, which looks wrong
  during a cold compile.
- The `+` affordance is hover-only, so it is unreachable by touch.

## Environment traps that cost me hours

- **The Chrome tab reports `visibility: hidden` and `framesIn1s: 0`.** `requestAnimationFrame`
  never fires, so no animation is observable — no drag motion, no settle, no morph
  transition. The initial layout still paints because `useLayoutEffect` runs
  `settle()` + `paint()` synchronously. Test animation-independent behaviour instead:
  e.g. a drag must swallow the click that follows it, a plain press must not.
- **The dev server wedges** after many edits: React never hydrates, page content sits
  in a `DIV[hidden]`, every chunk loads fine, no console errors, and `npm run build`
  passes. `pkill -f "next dev" && rm -rf .next` then restart. Do not go looking for a
  bug in the code — I did, twice.
- Verify layout numerically, not by eye. Measuring edge lengths against their spring
  rest length is what caught the tangle: ring-2 edges were resting at 244–348px
  against a 135px target, which meant repulsion had beaten the springs outright.

## Older, still open

- **Rotate the Supabase password.** It appeared in a chat transcript in an earlier
  session and must be treated as compromised. Rotation has never been confirmed.
  Supabase → Settings → Database, then update local `.env` and Vercel's
  `DATABASE_URL`, keeping port `6543`, then redeploy.
- Journal and Quests screens are unbuilt. The user is "not satisfied nor done" with
  the homepage.
- Drag-to-reorder on the daily card has never been confirmed with real input.
