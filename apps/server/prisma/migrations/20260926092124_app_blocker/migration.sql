-- CreateTable
CREATE TABLE "BlockRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trackerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlockRule_trackerId_fkey" FOREIGN KEY ("trackerId") REFERENCES "UrgeTracker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UrgeTracker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "streakStartAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockEnabled" BOOLEAN NOT NULL DEFAULT false,
    "blockFrom" TEXT,
    "blockUntil" TEXT,
    "unlockDelayMinutes" INTEGER NOT NULL DEFAULT 15,
    CONSTRAINT "UrgeTracker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UrgeTracker" ("createdAt", "id", "name", "streakStartAt", "userId") SELECT "createdAt", "id", "name", "streakStartAt", "userId" FROM "UrgeTracker";
DROP TABLE "UrgeTracker";
ALTER TABLE "new_UrgeTracker" RENAME TO "UrgeTracker";
CREATE INDEX "UrgeTracker_userId_idx" ON "UrgeTracker"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "BlockRule_trackerId_idx" ON "BlockRule"("trackerId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockRule_trackerId_kind_target_key" ON "BlockRule"("trackerId", "kind", "target");
