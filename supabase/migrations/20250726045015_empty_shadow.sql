/*
  # Create buildings table

  1. New Tables
    - `buildings`
      - `id` (text, primary key) - Building identifier
      - `wkt` (text) - Well-Known Text geometry
      - `full_addres_q` (text) - Full address query
      - `street_cod` (text) - Street code
      - `bldg_num` (text) - Building number
      - `bldg_type` (text) - Building type
      - `num_floors` (text) - Number of floors
      - `street_c_1` (text) - Street code 1
      - `bldg_num_2` (text) - Building number 2
      - `street_is_tama` (text) - Street is Tama
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
      - `created_at` (timestamp) - Creation timestamp
      - `updated_at` (timestamp) - Update timestamp

  2. Security
    - Enable RLS on `buildings` table
    - Add policy for public read access
    - Add policy for public write access (for demo purposes)
*/

CREATE TABLE IF NOT EXISTS buildings (
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

-- Allow public read access for demo purposes
CREATE POLICY "Allow public read access"
  ON buildings
  FOR SELECT
  TO public
  USING (true);

-- Allow public write access for demo purposes
CREATE POLICY "Allow public write access"
  ON buildings
  FOR ALL
  TO public
  USING (true);