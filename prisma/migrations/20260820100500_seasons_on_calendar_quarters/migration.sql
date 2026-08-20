-- DropIndex
DROP INDEX "seasons_userId_ordinal_key";

-- DropIndex
DROP INDEX "seasons_userId_startsOn_idx";

-- AlterTable
ALTER TABLE "seasons" DROP COLUMN "ordinal";

-- CreateIndex
CREATE UNIQUE INDEX "seasons_userId_startsOn_key" ON "seasons"("userId", "startsOn");

