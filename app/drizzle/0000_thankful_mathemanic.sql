CREATE TABLE IF NOT EXISTS "user_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"apiUsage" integer NOT NULL,
	"maxUsage" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"billingCycle" text NOT NULL,
	"tokenUsage" integer DEFAULT 0 NOT NULL,
	"maxTokenUsage" integer DEFAULT 1000000 NOT NULL,
	CONSTRAINT "user_usage_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_idx" ON "user_usage" USING btree ("userId");