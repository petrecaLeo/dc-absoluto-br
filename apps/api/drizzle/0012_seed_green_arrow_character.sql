INSERT INTO "characters" ("slug", "name", "alias", "rating", "upvotes")
VALUES ('green-arrow', 'Arqueiro Verde', 'Oliver Queen', 0, 0)
ON CONFLICT ("slug") DO NOTHING;
