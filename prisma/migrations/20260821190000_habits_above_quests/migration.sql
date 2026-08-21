-- The pyramid flips: Category > Subcategory > Habit > Quest > Task.
-- A quest hangs off the habit that serves it; a loose quest keeps its
-- own area. The old direction (habit -> quest) is dropped.

-- Drop the old direction's foreign keys and indexes first.
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_questId_fkey";
ALTER TABLE "habits" DROP CONSTRAINT "habits_questId_fkey";
DROP INDEX "tasks_questId_idx";
DROP INDEX "habits_questId_idx";

-- Quests gain their serving habit. Deleting a habit sets the quest
-- loose rather than taking the goal with it.
ALTER TABLE "quests" ADD COLUMN "habitId" TEXT;
ALTER TABLE "quests" ADD CONSTRAINT "quests_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "habits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "quests_habitId_idx" ON "quests"("habitId");

-- A quest attached to a habit takes that habit's area, so only a loose
-- quest stores one.
ALTER TABLE "quests" ALTER COLUMN "subcategory" DROP NOT NULL;

-- Tasks no longer record a quest directly; a task serves its habit, and
-- the habit earns its quests.
ALTER TABLE "tasks" DROP COLUMN "questId";
ALTER TABLE "habits" DROP COLUMN "questId";
