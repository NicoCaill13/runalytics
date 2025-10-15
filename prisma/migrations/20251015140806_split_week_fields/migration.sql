-- 1) Ajouter les colonnes en NULLABLE (pour pouvoir backfiller)
ALTER TABLE "WeeklyFeatures" ADD COLUMN "year" INTEGER;
ALTER TABLE "WeeklyFeatures" ADD COLUMN "weekNumber" INTEGER;

-- 2) Backfill depuis weekStart (ISO)
UPDATE "WeeklyFeatures"
SET
  "year" = EXTRACT(ISOYEAR FROM "weekStart")::int,
  "weekNumber" = EXTRACT(WEEK FROM "weekStart")::int;

-- -- (Fallback si tu n'avais pas weekStart fiable et que tu dois parser weekId)
-- -- UPDATE "WeeklyFeatures"
-- -- SET 
-- --   "year" = (regexp_matches("weekId", '^([0-9]{4})-W([0-9]{2})$'))[1]::int,
-- --   "weekNumber" = (regexp_matches("weekId", '^([0-9]{4})-W([0-9]{2})$'))[2]::int
-- -- WHERE "year" IS NULL OR "weekNumber" IS NULL;

-- 3) Vérif de complétude (optionnel mais conseillé)
--    Si cette assertion échoue, corrige les données avant d’aller plus loin.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "WeeklyFeatures" WHERE "year" IS NULL OR "weekNumber" IS NULL) THEN
    RAISE EXCEPTION 'Backfill failed: some rows still have NULL year/weekNumber';
  END IF;
END $$;

-- 4) Rendre NOT NULL
ALTER TABLE "WeeklyFeatures" ALTER COLUMN "year" SET NOT NULL;
ALTER TABLE "WeeklyFeatures" ALTER COLUMN "weekNumber" SET NOT NULL;

-- 5) Nouvelle contrainte d’unicité (userId, year, weekNumber)
--    (Supprime l’ancienne contrainte si elle existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'WeeklyFeatures_userId_weekId_key'
  ) THEN
    ALTER TABLE "WeeklyFeatures" DROP CONSTRAINT "WeeklyFeatures_userId_weekId_key";
  END IF;
END $$;

ALTER TABLE "WeeklyFeatures" ADD CONSTRAINT "WeeklyFeatures_userId_year_weekNumber_key"
  UNIQUE ("userId","year","weekNumber");

-- 6) (Optionnel) Index pour les tris
CREATE INDEX IF NOT EXISTS "WeeklyFeatures_user_year_week_idx"
  ON "WeeklyFeatures" ("userId","year","weekNumber");

-- 7) Supprimer l’ancienne colonne si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='WeeklyFeatures' AND column_name='weekId'
  ) THEN
    ALTER TABLE "WeeklyFeatures" DROP COLUMN "weekId";
  END IF;
END $$;
