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
      
      // Validate required data
      if (!buildingId) {
        throw new Error('Building ID is required');
      }
      
      if (!geometryPoints || geometryPoints.length < 3) {
        throw new Error('Valid geometry points are required (minimum 3 points)');
      }
      
      // Only include fields that exist in the database schema
      const validFields = {
        wkt: data.wkt || '',
        full_addres_q: data.full_addres_q || '',
        street_cod: data.street_cod || '',
        bldg_num: data.bldg_num || '',
        bldg_type: data.bldg_type || '',
        num_floors: data.num_floors || '',
        street_c_1: data.street_c_1 || '',
        bldg_num_2: data.bldg_num_2 || '',
        street_is_tama: data.street_is_tama || '',
        no_floors: data.no_floors || '',
        no_apt: data.no_apt || '',
        st_code: data.st_code || '',
        street_1: data.street_1 || '',
        color: data.color || '',
        מיון_2: data.מיון_2 || '',
        masadcolor2: data.masadcolor2 || '',
        color_sofi: data.color_sofi || '',
        full_addresse: data.full_addresse || '',
        mi_address: data.mi_address || '',
        codeapp: data.codeapp || '',
        weblink: data.weblink || ''
      };
      
      const buildingData = {
        id: buildingId,
        ...validFields,
        geometry_points: geometryPoints,
        ai_command: aiCommand,
        height: Number(height) || 0,
        floor_colors: floorColors,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Final building data to save:', buildingData);
      
      const { data: savedData, error } = await supabase
        .from('buildings')
        .upsert(buildingData)
        .select()
        .single();

      if (error) throw error;
      console.log('Building saved successfully:', savedData);
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