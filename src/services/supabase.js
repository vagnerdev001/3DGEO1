import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Building data operations
export const buildingService = {
  // Save building data
  async saveBuilding(buildingId, data, geometryPoints = null, aiCommand = '', height = 0, floorColors = []) {
    try {
      console.log('Saving building:', { buildingId, data, geometryPoints, aiCommand, height });
      
      const buildingData = {
        id: buildingId,
        ...data,
        geometry_points: geometryPoints,
        ai_command: aiCommand,
        height: height,
        floor_colors: floorColors,
        updated_at: new Date().toISOString()
      };
      
      const { data: savedData, error } = await supabase
        .from('buildings')
        .upsert(buildingData)
        .select()
        .single();

      if (error) throw error;
      console.log('Building saved successfully');
      return { success: true, data: savedData };
    } catch (error) {
      console.error('Error saving building:', error);
      return { success: false, error: error.message };
    }
  },

  // Get building data
  async getBuilding(buildingId) {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('id', buildingId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      return { success: true, data };
    } catch (error) {
      console.error('Error getting building:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all buildings
  async getAllBuildings() {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting buildings:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete building
  async deleteBuilding(buildingId) {
    try {
      const { error } = await supabase
        .from('buildings')
        .delete()
        .eq('id', buildingId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting building:', error);
      return { success: false, error: error.message };
    }
  }
};