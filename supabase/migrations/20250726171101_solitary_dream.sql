/*
  # Create Storage Buckets for 3D Models

  1. Storage Buckets
    - `3d-models` - For storing GLB, GLTF, OBJ, FBX files
    - `thumbnails` - For storing preview images

  2. Security
    - Public read access for model files (so Cesium can load them)
    - Authenticated upload/update/delete access
    - File type and size restrictions
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    '3d-models',
    '3d-models', 
    true,
    52428800, -- 50MB limit
    ARRAY[
      'model/gltf-binary',
      'model/gltf+json', 
      'application/octet-stream',
      'model/obj',
      'application/json',
      'text/plain'
    ]
  ),
  (
    'thumbnails',
    'thumbnails',
    true, 
    5242880, -- 5MB limit
    ARRAY[
      'image/jpeg',
      'image/png', 
      'image/webp',
      'image/gif'
    ]
  )
ON CONFLICT (id) DO NOTHING;

-- Storage policies for 3d-models bucket
CREATE POLICY "Public read access for 3d-models"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = '3d-models');

CREATE POLICY "Authenticated upload for 3d-models"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = '3d-models');

CREATE POLICY "Authenticated update for 3d-models"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = '3d-models');

CREATE POLICY "Authenticated delete for 3d-models"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = '3d-models');

-- Storage policies for thumbnails bucket
CREATE POLICY "Public read access for thumbnails"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated upload for thumbnails"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated update for thumbnails"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated delete for thumbnails"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'thumbnails');