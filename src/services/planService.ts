import { supabase } from './supabase';
import { BuildingPlan, Project, PlanMetrics, PlanLandUse, PlanBuilding } from '../types/plan.types';

export class PlanService {
  // Projects
  async getProjects(): Promise<{ success: boolean; data?: Project[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error getting projects:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async createProject(projectData: Partial<Project>): Promise<{ success: boolean; data?: Project; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating project:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  // Building Plans
  async getPlansByProject(projectId: string): Promise<{ success: boolean; data?: BuildingPlan[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('building_plans')
        .select(`
          *,
          plan_metrics_summary!inner(*),
          plan_land_use(*),
          plan_buildings(*),
          plan_geometries(*),
          plan_visualizations(*)
        `)
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('created_date', { ascending: false });

      if (error) throw error;

      // Transform the data to match our types
      const transformedData = data?.map(plan => ({
        ...plan,
        metrics: plan.plan_metrics_summary?.[0] || {},
        landUse: plan.plan_land_use || [],
        buildings: plan.plan_buildings || [],
        geometries: plan.plan_geometries || [],
        visualizations: plan.plan_visualizations || []
      }));

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error getting plans:', error);
      return { success: false, error: error.message };
    }
  }

  async getPlanWithDetails(planId: string): Promise<{ success: boolean; data?: BuildingPlan; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('building_plans')
        .select(`
          *,
          plan_metrics(*),
          plan_land_use(*),
          plan_buildings(*),
          plan_geometries(*),
          plan_visualizations(*),
          plan_3d_models(*)
        `)
        .eq('id', planId)
        .single();

      if (error) throw error;

      // Process metrics into summary format
      const metrics = this.aggregateMetrics(data.plan_metrics || []);
      const landUseBreakdown = this.calculateLandUsePercentages(data.plan_land_use || []);
      const buildingStats = this.calculateBuildingStatistics(data.plan_buildings || []);

      const processedData = {
        ...data,
        metrics: { ...metrics, ...buildingStats },
        landUse: landUseBreakdown,
        buildings: data.plan_buildings || [],
        geometries: data.plan_geometries || [],
        visualizations: data.plan_visualizations || []
      };

      return { success: true, data: processedData };
    } catch (error) {
      console.error('Error getting plan details:', error);
      return { success: false, error: error.message };
    }
  }

  async createPlan(planData: Partial<BuildingPlan>): Promise<{ success: boolean; data?: BuildingPlan; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('building_plans')
        .insert({
          project_id: planData.project_id,
          plan_name: planData.plan_name,
          plan_type: planData.plan_type || 'alternative',
          status: planData.status || 'draft',
          description: planData.description,
          notes: planData.notes
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating plan:', error);
      return { success: false, error: error.message };
    }
  }

  async updatePlan(planId: string, updates: Partial<BuildingPlan>): Promise<{ success: boolean; data?: BuildingPlan; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('building_plans')
        .update({
          plan_name: updates.plan_name,
          plan_type: updates.plan_type,
          status: updates.status,
          description: updates.description,
          notes: updates.notes,
          modified_date: new Date().toISOString()
        })
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating plan:', error);
      return { success: false, error: error.message };
    }
  }

  async deletePlan(planId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('building_plans')
        .update({ is_active: false })
        .eq('id', planId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting plan:', error);
      return { success: false, error: error.message };
    }
  }

  // Plan Buildings
  async addBuildingToPlan(planId: string, buildingData: Partial<PlanBuilding>): Promise<{ success: boolean; data?: PlanBuilding; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('plan_buildings')
        .insert({
          plan_id: planId,
          ...buildingData
        })
        .select()
        .single();

      if (error) throw error;

      // Recalculate plan metrics
      await this.calculatePlanMetrics(planId);

      return { success: true, data };
    } catch (error) {
      console.error('Error adding building to plan:', error);
      return { success: false, error: error.message };
    }
  }

  // Plan Metrics
  async calculatePlanMetrics(planId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('calculate_plan_metrics', {
        p_plan_id: planId
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error calculating plan metrics:', error);
      return { success: false, error: error.message };
    }
  }

  // Plan Comparisons
  async createComparison(planIds: string[], comparisonName?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('plan_comparisons')
        .insert({
          comparison_name: comparisonName,
          plan_ids: planIds,
          comparison_metrics: {}
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating comparison:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper methods
  private aggregateMetrics(metrics: any[]): PlanMetrics {
    return metrics.reduce((acc, metric) => {
      acc[metric.metric_type] = metric.metric_value;
      return acc;
    }, {});
  }

  private calculateLandUsePercentages(landUse: PlanLandUse[]): PlanLandUse[] {
    const total = landUse.reduce((sum, use) => sum + (use.area_sqm || 0), 0);
    return landUse.map(use => ({
      ...use,
      percentage: total > 0 ? (use.area_sqm / total) * 100 : 0
    }));
  }

  private calculateBuildingStatistics(buildings: PlanBuilding[]): any {
    if (buildings.length === 0) {
      return {
        total_buildings: 0,
        total_floor_area: 0,
        avg_height: 0,
        total_units: 0
      };
    }

    return {
      total_buildings: buildings.length,
      total_floor_area: buildings.reduce((sum, b) => sum + (b.gross_floor_area || 0), 0),
      avg_height: buildings.reduce((sum, b) => sum + (b.height || 0), 0) / buildings.length,
      total_units: buildings.reduce((sum, b) => sum + (b.units_count || 0), 0)
    };
  }
}

export const planService = new PlanService();