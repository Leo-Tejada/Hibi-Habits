-- CreateEnum
CREATE TYPE "Subcategory" AS ENUM ('MIND', 'BODY', 'SPIRIT', 'LOVE', 'FAMILY', 'FRIENDS', 'WORK', 'GROWTH', 'MONEY');

-- CreateEnum
CREATE TYPE "QuestKind" AS ENUM ('MAIN', 'SIDE');

-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ScheduleKind" AS ENUM ('WEEKLY_DAYS', 'EVERY_N_DAYS');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'SKIPPED', 'DONE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "kind" "QuestKind" NOT NULL,
    "subcategory" "Subcategory" NOT NULL,
    "title" TEXT NOT NULL,
    "intent" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" "QuestStatus" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT,
    "subcategory" "Subcategory" NOT NULL,
    "title" TEXT NOT NULL,
    "scheduleKind" "ScheduleKind" NOT NULL,
    "weekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "intervalDays" INTEGER,
    "anchorOn" DATE NOT NULL,
    "unit" TEXT,
    "target" DOUBLE PRECISION,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "habitId" TEXT,
    "questId" TEXT,
    "title" TEXT NOT NULL,
    "dueOn" DATE NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "value" DOUBLE PRECISION,
    "unit" TEXT,
    "target" DOUBLE PRECISION,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entryOn" DATE NOT NULL,
    "mood" INTEGER,
    "energy" INTEGER,
    "body" TEXT,
    "gratitude" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_reflections" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "wentWell" TEXT,
    "wentBadly" TEXT,
    "learned" TEXT,
    "carryForward" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "season_reflections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_ratings" (
    "id" TEXT NOT NULL,
    "reflectionId" TEXT NOT NULL,
    "subcategory" "Subcategory" NOT NULL,
    "score" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "season_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seasons_userId_startsOn_idx" ON "seasons"("userId", "startsOn");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_userId_ordinal_key" ON "seasons"("userId", "ordinal");

-- CreateIndex
CREATE INDEX "quests_seasonId_kind_idx" ON "quests"("seasonId", "kind");

-- CreateIndex
CREATE INDEX "quests_userId_status_idx" ON "quests"("userId", "status");

-- CreateIndex
CREATE INDEX "habits_userId_archivedAt_idx" ON "habits"("userId", "archivedAt");

-- CreateIndex
CREATE INDEX "habits_questId_idx" ON "habits"("questId");

-- CreateIndex
CREATE INDEX "tasks_userId_dueOn_idx" ON "tasks"("userId", "dueOn");

-- CreateIndex
CREATE INDEX "tasks_questId_idx" ON "tasks"("questId");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_habitId_dueOn_key" ON "tasks"("habitId", "dueOn");

-- CreateIndex
CREATE INDEX "journal_entries_userId_entryOn_idx" ON "journal_entries"("userId", "entryOn");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_userId_entryOn_key" ON "journal_entries"("userId", "entryOn");

-- CreateIndex
CREATE UNIQUE INDEX "season_reflections_seasonId_key" ON "season_reflections"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "season_ratings_reflectionId_subcategory_key" ON "season_ratings"("reflectionId", "subcategory");

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quests" ADD CONSTRAINT "quests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quests" ADD CONSTRAINT "quests_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_questId_fkey" FOREIGN KEY ("questId") REFERENCES "quests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_questId_fkey" FOREIGN KEY ("questId") REFERENCES "quests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_reflections" ADD CONSTRAINT "season_reflections_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_ratings" ADD CONSTRAINT "season_ratings_reflectionId_fkey" FOREIGN KEY ("reflectionId") REFERENCES "season_reflections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
