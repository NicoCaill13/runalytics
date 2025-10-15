-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hasHeartRateData" BOOLEAN DEFAULT false,
ADD COLUMN     "heartRateCoverage" DOUBLE PRECISION,
ADD COLUMN     "heartRateStatus" TEXT;
