CREATE TABLE IF NOT EXISTS "public"."user_email_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"token" varchar(128) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_verifications_email_unique" UNIQUE("email"),
	CONSTRAINT "user_email_verifications_token_unique" UNIQUE("token")
);
