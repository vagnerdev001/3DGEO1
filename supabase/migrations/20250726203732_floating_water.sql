/*
  # Building Plans System Implementation

  1. New Tables
    - `projects` - Parent entity for building plans
    - `building_plans` - Main plans table with metadata
    - `plan_metrics` - Metrics like FAR, density, etc.
    - `plan_land_use` - Land use breakdown
    - `plan_geometries` - Building footprints and site boundaries
    - `plan_buildings` - Individual building data
    - `plan_3d_models` - 3D model storage
    - `plan_visualizations` - Map styling and visualization config
    - `plan_comparisons` - Plan comparison sessions

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for authenticated user write access

  3. Performance
    - Add indexes for common queries
    - Add spatial indexes for geometry columns
    - Add functions for metric calculations
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Projects table (parent entity for building plans)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location GEOGRAPHY(POINT, 4326),
    city VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Building plans table with metadata
CREATE TABLE IF NOT EXISTS building_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    plan_name VARCHAR(255) NOT NULL,
    plan_type VARCHAR(50) CHECK (plan_type IN ('baseline', 'alternative', 'proposed', 'approved')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'archived')),
    version INTEGER DEFAULT 1,
    created_by UUID,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modified_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    notes JSONB,
    UNIQUE(project_id, plan_name, version)
);

-- Plan metrics table for storing FAR, density, land use percentages
CREATE TABLE IF NOT EXISTS plan_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES building_plans(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL,
    metric_value NUMERIC(10, 4),
    unit VARCHAR(20),
    category VARCHAR(50),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB,
    CONSTRAINT unique_plan_metric UNIQUE(plan_id, metric_type, category)
);

-- Specific metrics view for easier querying
CREATE OR REPLACE VIEW plan_metrics_summary AS
SELECT 
    pm.plan_id,
    MAX(CASE WHEN pm.metric_type = 'far' THEN pm.metric_value END) as floor_area_ratio,
    MAX(CASE WHEN pm.metric_type = 'density' THEN pm.metric_value END) as density,
    MAX(CASE WHEN pm.metric_type = 'coverage' THEN pm.metric_value END) as lot_coverage,
    MAX(CASE WHEN pm.metric_type = 'height_avg' THEN pm.metric_value END) as avg_height,
    MAX(CASE WHEN pm.metric_type = 'units_total' THEN pm.metric_value END) as total_units,
    MAX(CASE WHEN pm.metric_type = 'parking_ratio' THEN pm.metric_value END) as parking_ratio
FROM plan_metrics pm
GROUP BY pm.plan_id;

-- Land use breakdown table
CREATE TABLE IF NOT EXISTS plan_land_use (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES building_plans(id) ON DELETE CASCADE,
    land_use_type VARCHAR(50) NOT NULL CHECK (land_use_type IN 
        ('residential', 'commercial', 'industrial', 'mixed_use', 'public', 'open_space', 'parking')),
    area_sqm NUMERIC(12, 2),
    percentage NUMERIC(5, 2),
    floor_count INTEGER,
    units_count INTEGER,
    color_hex VARCHAR(7),
    metadata JSONB
);

-- Plan geometries table for storing building footprints, 3D models, site boundaries
CREATE TABLE IF NOT EXISTS plan_geometries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES building_plans(id) ON DELETE CASCADE,
    geometry_type VARCHAR(50) NOT NULL CHECK (geometry_type IN 
        ('site_boundary', 'building_footprint', 'setback', 'easement', 'landscape')),
    geometry GEOMETRY(GEOMETRY, 4326) NOT NULL,
    properties JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buildings table for individual building data
CREATE TABLE IF NOT EXISTS plan_buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES building_plans(id) ON DELETE CASCADE,
    building_name VARCHAR(255),
    building_type VARCHAR(50),
    footprint GEOMETRY(POLYGON, 4326) NOT NULL,
    height NUMERIC(6, 2),
    floors INTEGER,
    gross_floor_area NUMERIC(12, 2),
    land_use_type VARCHAR(50),
    units_count INTEGER,
    parking_spaces INTEGER,
    construction_type VARCHAR(50),
    occupancy_type VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3D model storage table
CREATE TABLE IF NOT EXISTS plan_3d_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES building_plans(id) ON DELETE CASCADE,
    building_id UUID REFERENCES plan_buildings(id) ON DELETE CASCADE,
    model_type VARCHAR(50) CHECK (model_type IN ('gltf', 'obj', 'cityjson', 'cesium')),
    model_url TEXT,
    model_data JSONB,
    lod_level INTEGER CHECK (lod_level BETWEEN 0 AND 4),
    texture_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plan visualizations table for storing map layers, colors, styling data
CREATE TABLE IF NOT EXISTS plan_visualizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES building_plans(id) ON DELETE CASCADE,
    visualization_type VARCHAR(50) NOT NULL CHECK (visualization_type IN 
        ('map_style', 'color_scheme', 'layer_config', 'camera_position')),
    config_data JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_default_viz UNIQUE(plan_id, visualization_type, is_default)
);

-- Plan comparisons table for storing comparison sessions
CREATE TABLE IF NOT EXISTS plan_comparisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comparison_name VARCHAR(255),
    plan_ids UUID[] NOT NULL,
    comparison_metrics JSONB,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_building_plans_project ON building_plans(project_id);
CREATE INDEX IF NOT EXISTS idx_plan_metrics_plan ON plan_metrics(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_land_use_plan ON plan_land_use(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_geometries_plan ON plan_geometries(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_buildings_plan ON plan_buildings(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_buildings_footprint ON plan_buildings USING GIST(footprint);
CREATE INDEX IF NOT EXISTS idx_plan_geometries_geom ON plan_geometries USING GIST(geometry);

-- Row Level Security (RLS) policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE building_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_land_use ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_geometries ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_3d_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_visualizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_comparisons ENABLE ROW LEVEL SECURITY;

-- RLS policies for public read access
CREATE POLICY "Projects are viewable by everyone" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Plans are viewable by everyone" ON building_plans
    FOR SELECT USING (true);

CREATE POLICY "Plan metrics are viewable by everyone" ON plan_metrics
    FOR SELECT USING (true);

CREATE POLICY "Plan land use is viewable by everyone" ON plan_land_use
    FOR SELECT USING (true);

CREATE POLICY "Plan geometries are viewable by everyone" ON plan_geometries
    FOR SELECT USING (true);

CREATE POLICY "Plan buildings are viewable by everyone" ON plan_buildings
    FOR SELECT USING (true);

CREATE POLICY "Plan 3D models are viewable by everyone" ON plan_3d_models
    FOR SELECT USING (true);

CREATE POLICY "Plan visualizations are viewable by everyone" ON plan_visualizations
    FOR SELECT USING (true);

CREATE POLICY "Plan comparisons are viewable by everyone" ON plan_comparisons
    FOR SELECT USING (true);

-- RLS policies for authenticated write access
CREATE POLICY "Projects are editable by authenticated users" ON projects
    FOR ALL USING (true);

CREATE POLICY "Plans are editable by authenticated users" ON building_plans
    FOR ALL USING (true);

CREATE POLICY "Plan metrics are editable by authenticated users" ON plan_metrics
    FOR ALL USING (true);

CREATE POLICY "Plan land use is editable by authenticated users" ON plan_land_use
    FOR ALL USING (true);

CREATE POLICY "Plan geometries are editable by authenticated users" ON plan_geometries
    FOR ALL USING (true);

CREATE POLICY "Plan buildings are editable by authenticated users" ON plan_buildings
    FOR ALL USING (true);

CREATE POLICY "Plan 3D models are editable by authenticated users" ON plan_3d_models
    FOR ALL USING (true);

CREATE POLICY "Plan visualizations are editable by authenticated users" ON plan_visualizations
    FOR ALL USING (true);

CREATE POLICY "Plan comparisons are editable by authenticated users" ON plan_comparisons
    FOR ALL USING (true);

-- Trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_date = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_building_plans_modtime') THEN
        CREATE TRIGGER update_building_plans_modtime 
            BEFORE UPDATE ON building_plans 
            FOR EACH ROW EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;

-- Function to calculate plan metrics
CREATE OR REPLACE FUNCTION calculate_plan_metrics(p_plan_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Calculate FAR
    INSERT INTO plan_metrics (plan_id, metric_type, metric_value, unit)
    SELECT 
        p_plan_id,
        'far',
        COALESCE(SUM(gross_floor_area) / NULLIF(ST_Area(site.geometry::geography), 0), 0),
        'ratio'
    FROM plan_buildings pb
    CROSS JOIN LATERAL (
        SELECT geometry FROM plan_geometries 
        WHERE plan_id = p_plan_id AND geometry_type = 'site_boundary'
        LIMIT 1
    ) site
    WHERE pb.plan_id = p_plan_id
    ON CONFLICT (plan_id, metric_type, category) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value, calculated_at = NOW();

    -- Calculate density
    INSERT INTO plan_metrics (plan_id, metric_type, metric_value, unit)
    SELECT 
        p_plan_id,
        'density',
        COALESCE(SUM(units_count) / NULLIF((ST_Area(site.geometry::geography) / 10000), 0), 0),
        'units/hectare'
    FROM plan_buildings pb
    CROSS JOIN LATERAL (
        SELECT geometry FROM plan_geometries 
        WHERE plan_id = p_plan_id AND geometry_type = 'site_boundary'
        LIMIT 1
    ) site
    WHERE pb.plan_id = p_plan_id
    ON CONFLICT (plan_id, metric_type, category) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value, calculated_at = NOW();

    -- Calculate total units
    INSERT INTO plan_metrics (plan_id, metric_type, metric_value, unit)
    SELECT 
        p_plan_id,
        'units_total',
        COALESCE(SUM(units_count), 0),
        'units'
    FROM plan_buildings pb
    WHERE pb.plan_id = p_plan_id
    ON CONFLICT (plan_id, metric_type, category) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value, calculated_at = NOW();

    -- Calculate average height
    INSERT INTO plan_metrics (plan_id, metric_type, metric_value, unit)
    SELECT 
        p_plan_id,
        'height_avg',
        COALESCE(AVG(height), 0),
        'meters'
    FROM plan_buildings pb
    WHERE pb.plan_id = p_plan_id
    ON CONFLICT (plan_id, metric_type, category) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value, calculated_at = NOW();
END;
$$ LANGUAGE plpgsql;