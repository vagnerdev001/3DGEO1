/*
  # Add floor_colors column to buildings table

  1. Changes
    - Add `floor_colors` column to `buildings` table
    - Column type: JSONB to store array of color values
    - Default value: empty array

  2. Notes
    - This column will store the color information for each floor of a building
    - Uses JSONB for efficient storage and querying of JSON data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'buildings' AND column_name = 'floor_colors'
  ) THEN
    ALTER TABLE buildings ADD COLUMN floor_colors jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;