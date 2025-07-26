import { supabase } from './supabase';

// 3D Objects Service for managing categories, models, and placed objects
export const objectsService = {
  // Categories
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('object_categories')
        .select('*')
        .order('name_he');

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting categories:', error);
      return { success: false, error: error.message };
    }
  },

  async createCategory(categoryData) {
    try {
      const { data, error } = await supabase
        .from('object_categories')
        .insert(categoryData)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating category:', error);
      return { success: false, error: error.message };
    }
  },

  // Models
  async getModelsByCategory(categoryId) {
    try {
      const { data, error } = await supabase
        .from('object_models')
        .select(`
          *,
          object_categories (
            name,
            name_he,
            icon
          )
        `)
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('name_he');

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting models by category:', error);
      return { success: false, error: error.message };
    }
  },

  async getAllModels() {
    try {
      const { data, error } = await supabase
        .from('object_models')
        .select(`
          *,
          object_categories (
            name,
            name_he,
            icon
          )
        `)
        .eq('is_active', true)
        .order('name_he');

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting all models:', error);
      return { success: false, error: error.message };
    }
  },

  async createModel(modelData) {
    try {
      const { data, error } = await supabase
        .from('object_models')
        .insert(modelData)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating model:', error);
      return { success: false, error: error.message };
    }
  },

  // Placed Objects
  async getPlacedObjects() {
    try {
      const { data, error } = await supabase
        .from('placed_objects')
        .select(`
          *,
          object_models (
            *,
            object_categories (
              name,
              name_he,
              icon
            )
          )
        `)
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting placed objects:', error);
      return { success: false, error: error.message };
    }
  },

  async placeObject(objectData) {
    try {
      console.log('Placing object:', objectData);
      
      const { data, error } = await supabase
        .from('placed_objects')
        .insert({
          model_id: objectData.model_id,
          name: objectData.name || 'Unnamed Object',
          position: objectData.position,
          scale: objectData.scale || { x: 1, y: 1, z: 1 },
          rotation: objectData.rotation || { x: 0, y: 0, z: 0 },
          properties: objectData.properties || {},
          is_visible: true
        })
        .select(`
          *,
          object_models (
            *,
            object_categories (
              name,
              name_he,
              icon
            )
          )
        `)
        .single();

      if (error) throw error;
      console.log('Object placed successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error placing object:', error);
      return { success: false, error: error.message };
    }
  },

  async updatePlacedObject(objectId, updates) {
    try {
      const { data, error } = await supabase
        .from('placed_objects')
        .update(updates)
        .eq('id', objectId)
        .select(`
          *,
          object_models (
            *,
            object_categories (
              name,
              name_he,
              icon
            )
          )
        `)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating placed object:', error);
      return { success: false, error: error.message };
    }
  },

  async deletePlacedObject(objectId) {
    try {
      const { error } = await supabase
        .from('placed_objects')
        .delete()
        .eq('id', objectId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting placed object:', error);
      return { success: false, error: error.message };
    }
  },

  // File Upload (for future use with Supabase Storage)
  async uploadModel(file, fileName) {
    try {
      // Generate unique filename to prevent conflicts
      const timestamp = Date.now();
      const extension = fileName.split('.').pop();
      const baseName = fileName.replace(/\.[^/.]+$/, "");
      const uniqueFileName = encodeURIComponent(`${timestamp}_${baseName}.${extension}`);
      
      const { data, error } = await supabase.storage
        .from('3d-models')
        .upload(uniqueFileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('3d-models')
        .getPublicUrl(uniqueFileName);

      return { success: true, data: { ...data, publicUrl: urlData.publicUrl } };
    } catch (error) {
      console.error('Error uploading model:', error);
      return { success: false, error: error.message };
    }
  },

  async uploadThumbnail(file, fileName) {
    try {
      // Generate unique filename to prevent conflicts
      const timestamp = Date.now();
      const extension = fileName.split('.').pop();
      const baseName = fileName.replace(/\.[^/.]+$/, "");
      const uniqueFileName = encodeURIComponent(`${timestamp}_${baseName}.${extension}`);
      
      const { data, error } = await supabase.storage
        .from('thumbnails')
        .upload(uniqueFileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(uniqueFileName);

      return { success: true, data: { ...data, publicUrl: urlData.publicUrl } };
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      return { success: false, error: error.message };
    }
  },

  // Storage management functions
  async getStorageStats() {
    try {
      const { data, error } = await supabase.rpc('get_storage_stats');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { success: false, error: error.message };
    }
  },

  async cleanupOrphanedFiles() {
    try {
      const { data, error } = await supabase.rpc('cleanup_orphaned_model_files');
      if (error) throw error;
      return { success: true, data: { cleanedFiles: data } };
    } catch (error) {
      console.error('Error cleaning up orphaned files:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteModelFile(fileUrl) {
    try {
      // Extract filename from URL
      const fileName = fileUrl.split('/').pop();
      const { error } = await supabase.storage
        .from('3d-models')
        .remove([fileName]);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting model file:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteThumbnailFile(thumbnailUrl) {
    try {
      // Extract filename from URL
      const fileName = thumbnailUrl.split('/').pop();
      const { error } = await supabase.storage
        .from('thumbnails')
        .remove([fileName]);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting thumbnail file:', error);
      return { success: false, error: error.message };
    }
  }
};