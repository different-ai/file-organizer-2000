ALTER TABLE "user_usage" ADD COLUMN "hasCatalystAccess" boolean DEFAULT false NOT NULL;

UPDATE "user_usage"
SET "hasCatalystAccess" = true
WHERE "paymentStatus" IN ('paid', 'succeeded');
