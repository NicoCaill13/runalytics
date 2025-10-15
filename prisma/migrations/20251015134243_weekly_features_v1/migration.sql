-- CreateTable
CREATE TABLE "WeeklyFeatures" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "runsCount" INTEGER NOT NULL,
    "daysActive" INTEGER NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "movingTimeH" DOUBLE PRECISION NOT NULL,
    "elevGainM" INTEGER NOT NULL,
    "loadWeek" DOUBLE PRECISION NOT NULL,
    "monotony" DOUBLE PRECISION,
    "strain" DOUBLE PRECISION,
    "acwr" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyFeatures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeeklyFeatures_userId_weekStart_idx" ON "WeeklyFeatures"("userId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyFeatures_userId_weekId_key" ON "WeeklyFeatures"("userId", "weekId");

-- AddForeignKey
ALTER TABLE "WeeklyFeatures" ADD CONSTRAINT "WeeklyFeatures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
