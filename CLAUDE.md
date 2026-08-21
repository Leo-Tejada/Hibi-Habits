@AGENTS.md

# Hibi Habits

The pyramid: Category > Subcategory > **Habit** > Quest > Task. A quest hangs
off the habit that serves it and takes that habit's area; a loose quest stores
its own `subcategory`. One MAIN quest per category per season.

- Real data lives in `MY_DATA.md`, the human-readable source behind
  `prisma/seed-content.ts`. Never overwrite it. Past seasons are one
  `PAST_SEASONS` entry each.
- A habit's schedule is optional: `WEEKLY_DAYS` with empty `weekdays` wants no
  day — it never generates tasks, it only suggests itself in the daily
  composer.
- `prisma migrate dev` hangs against the Supabase pooler (6543); the working
  procedure is in TODO.md under "Environment traps".
- Verify before committing: `bun run typecheck`, `bun run lint` (errors under
  `.claude/skills/` are pre-existing — `src/` must be clean), `bun run build`.
