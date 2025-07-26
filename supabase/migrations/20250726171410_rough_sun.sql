/*
  # Fix RLS policies for 3D objects system

  1. Storage Policies
    - Update storage policies to allow public uploads
    - Allow public read access for model files
    - Allow public insert/update/delete for uploads

  2. Database Policies  
    - Update object_models table policies for public access
    - Update object_categories table policies for public access
    - Update placed_objects table policies for public access

  3. Security
    - Allow public access for demo/development purposes
    - Can be restricted later for production use
*/

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update" ON storage.objects;

-- Create new storage policies for public access
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id IN ('3d-models', 'thumbnails'));

CREATE POLICY "Allow public read access" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id IN ('3d-models', 'thumbnails'));

CREATE POLICY "Allow public delete" ON storage.objects
  FOR DELETE TO public
  USING (bucket_id IN ('3d-models', 'thumbnails'));

CREATE POLICY "Allow public update" ON storage.objects
  FOR UPDATE TO public
  USING (bucket_id IN ('3d-models', 'thumbnails'))
  WITH CHECK (bucket_id IN ('3d-models', 'thumbnails'));

-- Update database table policies for public access
-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to categories" ON object_categories;
DROP POLICY IF EXISTS "Allow public write access to categories" ON object_categories;
DROP POLICY IF EXISTS "Allow public read access to models" ON object_models;
DROP POLICY IF EXISTS "Allow public write access to models" ON object_models;
DROP POLICY IF EXISTS "Allow public read access to placed objects" ON placed_objects;
DROP POLICY IF EXISTS "Allow public write access to placed objects" ON placed_objects;

-- Create new public access policies
CREATE POLICY "Allow public read access to categories" ON object_categories
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Allow public write access to categories" ON object_categories
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to models" ON object_models
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Allow public write access to models" ON object_models
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to placed objects" ON placed_objects
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Allow public write access to placed objects" ON placed_objects
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);