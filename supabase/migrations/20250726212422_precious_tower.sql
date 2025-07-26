/*
  # Create revenue summary table for 10-year projections

  1. New Tables
    - `revenue_summary_10_year`
      - `id` (uuid, primary key)
      - `plan_name` (text, plan identifier)
      - `building_name` (text, building identifier)
      - `revenue_source` (text, source of revenue/expense)
      - `annual_revenue` (numeric, annual amount)
      - `projection_year` (integer, year of projection)
      - `revenue_type` (text, income/expense type)
      - `revenue_direction` (text, Hebrew direction label)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `revenue_summary_10_year` table
    - Add policy for public read/write access

  3. Indexes
    - Index on plan_name for fast lookups
    - Index on projection_year for sorting
    - Composite index on plan_name + projection_year
*/

CREATE TABLE IF NOT EXISTS revenue_summary_10_year (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text NOT NULL,
  building_name text DEFAULT '',
  revenue_source text NOT NULL,
  annual_revenue numeric(15,2) DEFAULT 0,
  projection_year integer NOT NULL,
  revenue_type text DEFAULT 'income',
  revenue_direction text DEFAULT 'הכנסה',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE revenue_summary_10_year ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to revenue data"
  ON revenue_summary_10_year
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public write access to revenue data"
  ON revenue_summary_10_year
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_revenue_summary_plan_name 
  ON revenue_summary_10_year (plan_name);

CREATE INDEX IF NOT EXISTS idx_revenue_summary_projection_year 
  ON revenue_summary_10_year (projection_year);

CREATE INDEX IF NOT EXISTS idx_revenue_summary_plan_year 
  ON revenue_summary_10_year (plan_name, projection_year);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_revenue_summary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_revenue_summary_updated_at
  BEFORE UPDATE ON revenue_summary_10_year
  FOR EACH ROW
  EXECUTE FUNCTION update_revenue_summary_updated_at();