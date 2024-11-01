ALTER TABLE "user_usage" ADD COLUMN "lastPayment" timestamp;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "currentProduct" text;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "currentPlan" text;