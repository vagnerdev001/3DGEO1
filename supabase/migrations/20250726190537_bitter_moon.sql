/*
  # Add weblink column to buildings table

  1. Changes
    - Add `weblink` column to `buildings` table
    - Column type: text (for storing URLs)
    - Default value: empty string
    - Nullable: true

  2. Purpose
    - Allow storing embedded iframe links for building plans
    - Enable viewing building plans through embedded content
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'buildings' AND column_name = 'weblink'
  ) THEN
    ALTER TABLE buildings ADD COLUMN weblink text DEFAULT '' NULL;
  END IF;
END $$;