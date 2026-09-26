-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatar" BLOB;
ALTER TABLE "User" ADD COLUMN "avatarMimeType" TEXT;
ALTER TABLE "User" ADD COLUMN "avatarUpdatedAt" DATETIME;
