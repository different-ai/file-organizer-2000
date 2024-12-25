CREATE TABLE IF NOT EXISTS "christmas_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"claimed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_christmas_claim_idx" ON "christmas_claims" USING btree ("user_id");