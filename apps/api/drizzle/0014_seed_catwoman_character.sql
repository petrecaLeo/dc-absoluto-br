INSERT INTO "characters" ("slug", "name", "alias", "rating", "upvotes")
VALUES ('catwoman', 'Mulher-Gato', 'Selina Kyle', 0, 0)
ON CONFLICT ("slug") DO NOTHING;
