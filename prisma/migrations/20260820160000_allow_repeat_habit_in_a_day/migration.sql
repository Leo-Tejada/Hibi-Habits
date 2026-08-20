-- DropIndex
DROP INDEX "tasks_habitId_dueOn_key";

-- CreateIndex
CREATE INDEX "tasks_habitId_dueOn_idx" ON "tasks"("habitId", "dueOn");

