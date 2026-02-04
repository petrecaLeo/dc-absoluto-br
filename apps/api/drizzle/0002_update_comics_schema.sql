ALTER TABLE "comics" DROP COLUMN IF EXISTS "title_original";--> statement-breakpoint
ALTER TABLE "comics" DROP COLUMN IF EXISTS "description";--> statement-breakpoint
ALTER TABLE "comics" DROP COLUMN IF EXISTS "release_date_br";--> statement-breakpoint
ALTER TABLE "comics" ADD COLUMN "writer" varchar(255);--> statement-breakpoint
ALTER TABLE "comics" ADD COLUMN "artists" varchar(500);
