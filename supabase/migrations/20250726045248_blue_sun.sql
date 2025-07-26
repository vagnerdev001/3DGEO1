/*
  # Complete Buildings Schema for AI Building Creator

  1. New Tables
    - `buildings`
      - `id` (text, primary key) - Unique building identifier
      - `wkt` (text) - Well-Known Text geometry data
      - `full_addres_q` (text) - Full address query
      - `street_cod` (text) - Street code
      - `bldg_num` (text) - Building number
      - `bldg_type` (text) - Building type
      - `num_floors` (text) - Number of floors
      - `street_c_1` (text) - Street code 1
      - `bldg_num_2` (text) - Building number 2
      - `street_is_tama` (text) - Street is TAMA
      - `no_floors` (text) - Number of floors
      - `no_apt` (text) - Number of apartments
      - `st_code` (text) - Street code
      - `street_1` (text) - Street 1
      - `color` (text) - Color
      - `מיון_2` (text) - Classification 2
      - `masadcolor2` (text) - Masad color 2
      - `color_sofi` (text) - Color Sofi
      - `full_addresse` (text) - Full address
      - `mi_address` (text) - MI address
      - `codeapp` (text) - Code app
      - `height` (numeric) - Building height in meters
      - `ai_command` (text) - Original AI command used
      - `geometry_points` (jsonb) - Cesium polygon points
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Update timestamp

  2. Security
    - Enable RLS on `buildings` table
    - Add policies for public read/write access (for demo purposes)

  3. Changes
    - Drop existing buildings table if it exists
    - Create new table with complete schema
    - Add proper indexes for performance
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.buildings CASCADE;

-- Create buildings table with complete schema
CREATE TABLE IF NOT EXISTS public.buildings (
  id text PRIMARY KEY,
  wkt text DEFAULT '',
  full_addres_q text DEFAULT '',
  street_cod text DEFAULT '',
  bldg_num text DEFAULT '',
  bldg_type text DEFAULT '',
  num_floors text DEFAULT '',
  street_c_1 text DEFAULT '',
  bldg_num_2 text DEFAULT '',
  street_is_tama text DEFAULT '',
  no_floors text DEFAULT '',
  no_apt text DEFAULT '',
  st_code text DEFAULT '',
  street_1 text DEFAULT '',
  color text DEFAULT '',
  מיון_2 text DEFAULT '',
  masadcolor2 text DEFAULT '',
  color_sofi text DEFAULT '',
  full_addresse text DEFAULT '',
  mi_address text DEFAULT '',
  codeapp text DEFAULT '',
  height numeric DEFAULT 0,
  ai_command text DEFAULT '',
  geometry_points jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (demo purposes)
CREATE POLICY "Allow public read access" ON public.buildings
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public write access" ON public.buildings
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_buildings_created_at ON public.buildings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_buildings_updated_at ON public.buildings(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_buildings_height ON public.buildings(height);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_buildings_updated_at ON public.buildings;
CREATE TRIGGER update_buildings_updated_at
    BEFORE UPDATE ON public.buildings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();