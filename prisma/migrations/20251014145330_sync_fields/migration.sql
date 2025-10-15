-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastActivityAt" TIMESTAMP(3),
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3);
