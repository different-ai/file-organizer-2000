ALTER TABLE "user_usage" ADD COLUMN "subscriptionStatus" text DEFAULT 'inactive' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "paymentStatus" text DEFAULT 'unpaid' NOT NULL