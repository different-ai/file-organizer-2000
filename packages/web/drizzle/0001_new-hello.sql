-- Update existing NULL values to the new defaults
UPDATE "user_usage" SET "tokenUsage" = 0 WHERE "tokenUsage" IS NULL;
UPDATE "user_usage" SET "maxTokenUsage" = 1000000 WHERE "maxTokenUsage" IS NULL;

-- Modify the tokenUsage column with the default value
ALTER TABLE "user_usage" 
ALTER COLUMN "tokenUsage" SET DEFAULT 0,
ALTER COLUMN "tokenUsage" SET NOT NULL;

-- Modify the maxTokenUsage column with the default value
ALTER TABLE "user_usage" 
ALTER COLUMN "maxTokenUsage" SET DEFAULT 1000000,
ALTER COLUMN "maxTokenUsage" SET NOT NULL;

