ALTER TABLE "comics" ADD COLUMN "universe" varchar(100) DEFAULT 'absolute';--> statement-breakpoint
UPDATE "comics" SET "universe" = 'absolute' WHERE "universe" IS NULL;--> statement-breakpoint
ALTER TABLE "comics" ALTER COLUMN "universe" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "comics" DROP CONSTRAINT IF EXISTS "comics_title_issue_number_unique";--> statement-breakpoint
ALTER TABLE "comics" ADD CONSTRAINT "comics_title_issue_number_universe_unique" UNIQUE("title","issue_number","universe");
