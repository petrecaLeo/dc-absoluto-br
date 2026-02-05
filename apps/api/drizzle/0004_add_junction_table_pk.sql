DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.comics_to_characters'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE comics_to_characters
      ADD CONSTRAINT comics_to_characters_pkey PRIMARY KEY (comic_id, character_id);
  END IF;
END $$;
