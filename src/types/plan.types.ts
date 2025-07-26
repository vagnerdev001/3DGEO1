// Building Plans Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  location?: {
    longitude: number;
    latitude: number;
  };
  city?: string;
  created_at: Date;
  updated_at: Date;
}

export interface BuildingPlan {
  id: string;
  project_id: string;
  plan_name: string;
  plan_type: 'baseline' | 'alternative' | 'proposed' | 'approved';
  status: 'draft' | 'review' | 'approved' | 'archived';
  version: number;
  created_by?: string;
  created_date: Date;
  modified_date: Date;
  is_active: boolean;
  description?: string;
  notes?: any;
  metrics?: PlanMetrics;
  buildings?: PlanBuilding[];
  landUse?: PlanLandUse[];
  geometries?: PlanGeometry[];
  visualizations?: PlanVisualization[];
}

export interface PlanMetrics {
  floor_area_ratio?: number;
  density?: number;
  lot_coverage?: number;
  avg_height?: number;
  total_units?: number;
  parking_ratio?: number;
}

export interface PlanLandUse {
  id: string;
  plan_id: string;
  land_use_type: 'residential' | 'commercial' | 'industrial' | 'mixed_use' | 'public' | 'open_space' | 'parking';
  area_sqm: number;
  percentage: number;
  floor_count?: number;
  units_count?: number;
  color_hex?: string;
  metadata?: any;
}

export interface PlanGeometry {
  id: string;
  plan_id: string;
  geometry_type: 'site_boundary' | 'building_footprint' | 'setback' | 'easement' | 'landscape';
  geometry: any; // GeoJSON geometry
  properties?: any;
  created_at: Date;
}

export interface PlanBuilding {
  id: string;
  plan_id: string;
  building_name?: string;
  building_type?: string;
  footprint: any; // GeoJSON polygon
  height?: number;
  floors?: number;
  gross_floor_area?: number;
  land_use_type?: string;
  units_count?: number;
  parking_spaces?: number;
  construction_type?: string;
  occupancy_type?: string;
  metadata?: any;
  created_at: Date;
}

export interface Plan3DModel {
  id: string;
  plan_id: string;
  building_id?: string;
  model_type: 'gltf' | 'obj' | 'cityjson' | 'cesium';
  model_url?: string;
  model_data?: any;
  lod_level?: number;
  texture_url?: string;
  metadata?: any;
  created_at: Date;
}

export interface PlanVisualization {
  id: string;
  plan_id: string;
  visualization_type: 'map_style' | 'color_scheme' | 'layer_config' | 'camera_position';
  config_data: any;
  is_default: boolean;
  created_at: Date;
}

export interface PlanComparison {
  id: string;
  comparison_name?: string;
  plan_ids: string[];
  comparison_metrics?: any;
  created_by?: string;
  created_at: Date;
}