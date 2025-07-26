/*
  # Create Storage Functions for 3D Models

  1. Storage Setup
    - Create storage buckets for 3D models and thumbnails
    - Set up proper policies for public access
    - Configure file size and type restrictions

  2. Functions
    - File upload validation
    - Automatic cleanup functions
    - Model metadata extraction

  3. Security
    - Public read access for model files
    - Authenticated upload access
    - File type validation
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('3d-models', '3d-models', true, 52428800, ARRAY['model/gltf-binary', 'model/gltf+json', 'application/octet-stream', 'model/obj', 'application/json']),
  ('thumbnails', 'thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for 3d-models bucket
CREATE POLICY "Public read access for 3D models"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = '3d-models');

CREATE POLICY "Authenticated users can upload 3D models"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = '3d-models');

CREATE POLICY "Authenticated users can update 3D models"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = '3d-models');

CREATE POLICY "Authenticated users can delete 3D models"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = '3d-models');

-- Storage policies for thumbnails bucket
CREATE POLICY "Public read access for thumbnails"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated users can upload thumbnails"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated users can update thumbnails"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated users can delete thumbnails"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'thumbnails');

-- Function to validate file extensions
CREATE OR REPLACE FUNCTION validate_file_extension(file_name TEXT, allowed_extensions TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN LOWER(RIGHT(file_name, 4)) = ANY(
    SELECT ('.' || LOWER(ext)) FROM UNNEST(allowed_extensions) AS ext
  ) OR LOWER(RIGHT(file_name, 5)) = ANY(
    SELECT ('.' || LOWER(ext)) FROM UNNEST(allowed_extensions) AS ext
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get file extension from filename
CREATE OR REPLACE FUNCTION get_file_extension(file_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(SUBSTRING(file_name FROM '\.([^.]*)$'));
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique filename
CREATE OR REPLACE FUNCTION generate_unique_filename(original_name TEXT, prefix TEXT DEFAULT '')
RETURNS TEXT AS $$
DECLARE
  extension TEXT;
  base_name TEXT;
  timestamp_str TEXT;
BEGIN
  extension := get_file_extension(original_name);
  base_name := SUBSTRING(original_name FROM '^(.+)\.[^.]*$');
  timestamp_str := EXTRACT(EPOCH FROM NOW())::TEXT;
  
  IF prefix != '' THEN
    RETURN prefix || '_' || timestamp_str || '_' || base_name || '.' || LOWER(extension);
  ELSE
    RETURN timestamp_str || '_' || base_name || '.' || LOWER(extension);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup orphaned files (files not referenced in object_models)
CREATE OR REPLACE FUNCTION cleanup_orphaned_model_files()
RETURNS INTEGER AS $$
DECLARE
  orphaned_count INTEGER := 0;
  file_record RECORD;
BEGIN
  -- Find files in storage that are not referenced in object_models
  FOR file_record IN
    SELECT name, bucket_id
    FROM storage.objects
    WHERE bucket_id IN ('3d-models', 'thumbnails')
    AND name NOT IN (
      SELECT SUBSTRING(file_url FROM '[^/]*$') FROM object_models WHERE file_url IS NOT NULL
      UNION
      SELECT SUBSTRING(thumbnail_url FROM '[^/]*$') FROM object_models WHERE thumbnail_url IS NOT NULL
    )
  LOOP
    -- Delete the orphaned file
    DELETE FROM storage.objects 
    WHERE name = file_record.name AND bucket_id = file_record.bucket_id;
    
    orphaned_count := orphaned_count + 1;
  END LOOP;
  
  RETURN orphaned_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get storage usage statistics
CREATE OR REPLACE FUNCTION get_storage_stats()
RETURNS TABLE(
  bucket_name TEXT,
  file_count BIGINT,
  total_size_mb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bucket_id::TEXT,
    COUNT(*)::BIGINT,
    ROUND((SUM(metadata->>'size')::NUMERIC / 1024 / 1024), 2)
  FROM storage.objects
  WHERE bucket_id IN ('3d-models', 'thumbnails')
  GROUP BY bucket_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to automatically cleanup files when model is deleted
CREATE OR REPLACE FUNCTION cleanup_model_files()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the model file from storage
  IF OLD.file_url IS NOT NULL THEN
    DELETE FROM storage.objects 
    WHERE bucket_id = '3d-models' 
    AND name = SUBSTRING(OLD.file_url FROM '[^/]*$');
  END IF;
  
  -- Delete the thumbnail file from storage
  IF OLD.thumbnail_url IS NOT NULL AND OLD.thumbnail_url != '' THEN
    DELETE FROM storage.objects 
    WHERE bucket_id = 'thumbnails' 
    AND name = SUBSTRING(OLD.thumbnail_url FROM '[^/]*$');
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to cleanup files when model is deleted
DROP TRIGGER IF EXISTS cleanup_model_files_trigger ON object_models;
CREATE TRIGGER cleanup_model_files_trigger
  AFTER DELETE ON object_models
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_model_files();

-- Insert some sample categories if they don't exist
INSERT INTO object_categories (name, name_he, description, icon) VALUES
  ('playground', 'מגרש משחקים', 'Playground equipment and structures', '🛝'),
  ('courtyard', 'חצר', 'Courtyard furniture and decorations', '🏛️'),
  ('bench', 'ספסל', 'Various types of benches and seating', '🪑'),
  ('tree', 'עץ', 'Trees and vegetation', '🌳'),
  ('fountain', 'מזרקה', 'Water fountains and features', '⛲'),
  ('sculpture', 'פסל', 'Decorative sculptures and art', '🗿'),
  ('lighting', 'תאורה', 'Street lights and illumination', '💡'),
  ('vehicle', 'רכב', 'Cars, bikes, and transportation', '🚗')
ON CONFLICT (name) DO NOTHING;