CREATE TABLE IF NOT EXISTS "public"."user_read_comics" (
	"user_id" uuid NOT NULL REFERENCES "public"."users"("id"),
	"comic_id" uuid NOT NULL REFERENCES "public"."comics"("id"),
	"read_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_read_comics_pk" PRIMARY KEY ("user_id", "comic_id")
);
