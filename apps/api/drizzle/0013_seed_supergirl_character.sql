INSERT INTO "characters" ("slug", "name", "alias", "rating", "upvotes")
VALUES ('supergirl', 'Supergirl', 'Kara Zor-El', 0, 0)
ON CONFLICT ("slug") DO NOTHING;
