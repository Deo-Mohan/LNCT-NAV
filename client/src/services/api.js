import { supabase } from '../supabase';

export const buildingService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('buildings')
      .select('*');
    if (error) throw error;
    return { data };
  },
  
  getById: async (id) => {
    const { data, error } = await supabase
      .from('buildings')
      .select('*, rooms(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return { data };
  },

  // Helper to get buildings with spatial data converted to LatLng
  getWithCoordinates: async () => {
    // Note: In a real Supabase setup, you'd use a RPC or transform the WKB geometry
    const { data, error } = await supabase.from('buildings').select('*');
    if (error) throw error;
    return data;
  }
};

export const roomService = {
  getAll: async (params = {}) => {
    let query = supabase.from('rooms').select('*, buildings(*)');
    
    if (params.buildingId) {
      query = query.eq('building_id', params.buildingId);
    }
    
    if (params.query) {
      query = query.ilike('name', `%${params.query}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data };
  },
  
  getByFloor: async (buildingId, floor) => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('building_id', buildingId)
      .eq('floor', floor);
    if (error) throw error;
    return { data };
  }
};

export default { buildingService, roomService };
