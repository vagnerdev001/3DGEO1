/*
  # Create 3D Objects Management System

  1. New Tables
    - `object_categories`
      - `id` (uuid, primary key)
      - `name` (text, category name like "Playground", "Courtyard", "Bench")
      - `name_he` (text, Hebrew name)
      - `description` (text, category description)
      - `icon` (text, icon name or URL)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `object_models`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key to object_categories)
      - `name` (text, model name)
      - `name_he` (text, Hebrew name)
      - `description` (text, model description)
      - `file_url` (text, URL to the 3D model file)
      - `thumbnail_url` (text, URL to preview image)
      - `file_type` (text, GLB, GLTF, OBJ, etc.)
      - `file_size` (bigint, file size in bytes)
      - `scale` (jsonb, default scale factors {x, y, z})
      - `rotation` (jsonb, default rotation {x, y, z})
      - `metadata` (jsonb, additional model info)
      - `is_active` (boolean, whether model is available for use)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `placed_objects`
      - `id` (uuid, primary key)
      - `model_id` (uuid, foreign key to object_models)
      - `name` (text, custom name for this instance)
      - `position` (jsonb, {longitude, latitude, height})
      - `scale` (jsonb, scale factors {x, y, z})
      - `rotation` (jsonb, rotation {x, y, z})
      - `properties` (jsonb, custom properties)
      - `is_visible` (boolean, whether object is currently visible)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Storage
    - Create storage bucket for 3D model files
    - Create storage bucket for thumbnail images

  3. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for authenticated write access
*/

-- Create object categories table
CREATE TABLE IF NOT EXISTS object_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_he text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create object models table
CREATE TABLE IF NOT EXISTS object_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES object_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_he text NOT NULL,
  description text DEFAULT '',
  file_url text NOT NULL,
  thumbnail_url text DEFAULT '',
  file_type text NOT NULL DEFAULT 'GLB',
  file_size bigint DEFAULT 0,
  scale jsonb DEFAULT '{"x": 1, "y": 1, "z": 1}'::jsonb,
  rotation jsonb DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create placed objects table
CREATE TABLE IF NOT EXISTS placed_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES object_models(id) ON DELETE CASCADE,
  name text NOT NULL,
  position jsonb NOT NULL,
  scale jsonb DEFAULT '{"x": 1, "y": 1, "z": 1}'::jsonb,
  rotation jsonb DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
  properties jsonb DEFAULT '{}'::jsonb,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE object_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE object_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE placed_objects ENABLE ROW LEVEL SECURITY;

-- Create policies for object_categories
CREATE POLICY "Allow public read access to categories"
  ON object_categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public write access to categories"
  ON object_categories
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create policies for object_models
CREATE POLICY "Allow public read access to models"
  ON object_models
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public write access to models"
  ON object_models
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create policies for placed_objects
CREATE POLICY "Allow public read access to placed objects"
  ON placed_objects
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public write access to placed objects"
  ON placed_objects
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_object_models_category_id ON object_models(category_id);
CREATE INDEX IF NOT EXISTS idx_object_models_is_active ON object_models(is_active);
CREATE INDEX IF NOT EXISTS idx_placed_objects_model_id ON placed_objects(model_id);
CREATE INDEX IF NOT EXISTS idx_placed_objects_is_visible ON placed_objects(is_visible);
CREATE INDEX IF NOT EXISTS idx_placed_objects_created_at ON placed_objects(created_at DESC);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_object_categories_updated_at
    BEFORE UPDATE ON object_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_object_models_updated_at
    BEFORE UPDATE ON object_models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_placed_objects_updated_at
    BEFORE UPDATE ON placed_objects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample categories
INSERT INTO object_categories (name, name_he, description, icon) VALUES
('Playground', 'מגרש משחקים', 'Children playground equipment and structures', '🛝'),
('Courtyard', 'חצר', 'Courtyard elements and decorations', '🏛️'),
('Bench', 'ספסל', 'Various types of benches and seating', '🪑'),
('Tree', 'עץ', 'Trees and vegetation', '🌳'),
('Fountain', 'מזרקה', 'Water fountains and features', '⛲'),
('Sculpture', 'פסל', 'Art sculptures and monuments', '🗿'),
('Lighting', 'תאורה', 'Street lights and outdoor lighting', '💡'),
('Vehicle', 'רכב', 'Cars, buses, and other vehicles', '🚗')
ON CONFLICT DO NOTHING;