// TestPlanData.tsx - Component to test your sample data
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

interface Plan {
  id: string;
  plan_name: string;
  plan_type: string;
  status: string;
  description: string;
  created_date: string;
}

interface PlanMetric {
  metric_type: string;
  metric_value: number;
  unit: string;
}

interface LandUse {
  land_use_type: string;
  area_sqm: number;
  percentage: number;
  color_hex: string;
}

const TestPlanData: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [metrics, setMetrics] = useState<PlanMetric[]>([]);
  const [landUse, setLandUse] = useState<LandUse[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Initialize project and create sample data
  useEffect(() => {
    const initializeData = async () => {
      try {
        // First, get or create a project
        let { data: projects, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .limit(1);

        if (projectError) throw projectError;

        let currentProjectId: string;

        if (!projects || projects.length === 0) {
          // Create a new project
          const { data: newProject, error: createError } = await supabase
            .from('projects')
            .insert({
              name: 'La Guardia Tel Aviv',
              description: 'Urban development project in Tel Aviv',
              city: 'Tel Aviv'
            })
            .select()
            .single();

          if (createError) throw createError;
          currentProjectId = newProject.id;
        } else {
          currentProjectId = projects[0].id;
        }

        setProjectId(currentProjectId);

        // Check if we already have plans
        const { data: existingPlans, error: plansError } = await supabase
          .from('building_plans')
          .select('*')
          .eq('project_id', currentProjectId);

        if (plansError) throw plansError;

        if (!existingPlans || existingPlans.length === 0) {
          // Create sample plans
          await createSamplePlans(currentProjectId);
        }

        // Fetch all plans
        await fetchPlans(currentProjectId);
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const createSamplePlans = async (projectId: string) => {
    try {
      // Create sample building plans
      const samplePlans = [
        {
          project_id: projectId,
          plan_name: 'תוכנית בסיס - La Guardia',
          plan_type: 'baseline',
          status: 'approved',
          description: 'תוכנית הבסיס המקורית עם 4 בניינים בגובה 8 קומות',
          version: 1
        },
        {
          project_id: projectId,
          plan_name: 'תוכנית חלופית A - גובה מוגבר',
          plan_type: 'alternative',
          status: 'review',
          description: 'תוכנית חלופית עם 3 בניינים בגובה 12 קומות',
          version: 1
        },
        {
          project_id: projectId,
          plan_name: 'תוכנית חלופית B - צפיפות נמוכה',
          plan_type: 'alternative',
          status: 'draft',
          description: 'תוכנית עם 6 בניינים בגובה 6 קומות ושטחים ירוקים מוגדלים',
          version: 1
        },
        {
          project_id: projectId,
          plan_name: 'תוכנית מוצעת - היברידית',
          plan_type: 'proposed',
          status: 'review',
          description: 'שילוב של התוכניות החלופיות עם איזון בין גובה וצפיפות',
          version: 1
        }
      ];

      const { data: createdPlans, error: plansError } = await supabase
        .from('building_plans')
        .upsert(samplePlans, { 
          onConflict: 'project_id,plan_name,version' 
        })
        .select();

      if (plansError) throw plansError;

      // Create sample metrics for each plan
      for (const plan of createdPlans) {
        await createSampleMetrics(plan.id, plan.plan_type);
        await createSampleLandUse(plan.id, plan.plan_type);
      }

      console.log('✅ Sample plans created successfully!');
    } catch (error) {
      console.error('Error creating sample plans:', error);
    }
  };

  const createSampleMetrics = async (planId: string, planType: string) => {
    // Different metrics based on plan type
    const metricsData = {
      baseline: [
        { metric_type: 'far', metric_value: 2.1, unit: 'ratio' },
        { metric_type: 'density', metric_value: 85, unit: 'units/hectare' },
        { metric_type: 'units_total', metric_value: 320, unit: 'units' },
        { metric_type: 'height_avg', metric_value: 28, unit: 'meters' },
        { metric_type: 'coverage', metric_value: 35, unit: 'percentage' },
        { metric_type: 'parking_ratio', metric_value: 1.2, unit: 'spaces/unit' }
      ],
      alternative: planType === 'alternative' ? [
        { metric_type: 'far', metric_value: 2.8, unit: 'ratio' },
        { metric_type: 'density', metric_value: 110, unit: 'units/hectare' },
        { metric_type: 'units_total', metric_value: 415, unit: 'units' },
        { metric_type: 'height_avg', metric_value: 42, unit: 'meters' },
        { metric_type: 'coverage', metric_value: 28, unit: 'percentage' },
        { metric_type: 'parking_ratio', metric_value: 1.0, unit: 'spaces/unit' }
      ] : [
        { metric_type: 'far', metric_value: 1.8, unit: 'ratio' },
        { metric_type: 'density', metric_value: 65, unit: 'units/hectare' },
        { metric_type: 'units_total', metric_value: 245, unit: 'units' },
        { metric_type: 'height_avg', metric_value: 21, unit: 'meters' },
        { metric_type: 'coverage', metric_value: 25, unit: 'percentage' },
        { metric_type: 'parking_ratio', metric_value: 1.5, unit: 'spaces/unit' }
      ],
      proposed: [
        { metric_type: 'far', metric_value: 2.4, unit: 'ratio' },
        { metric_type: 'density', metric_value: 95, unit: 'units/hectare' },
        { metric_type: 'units_total', metric_value: 360, unit: 'units' },
        { metric_type: 'height_avg', metric_value: 35, unit: 'meters' },
        { metric_type: 'coverage', metric_value: 30, unit: 'percentage' },
        { metric_type: 'parking_ratio', metric_value: 1.1, unit: 'spaces/unit' }
      ]
    };

    const metrics = metricsData[planType as keyof typeof metricsData] || metricsData.baseline;
    
    const metricsToInsert = metrics.map(metric => ({
      plan_id: planId,
      ...metric
    }));

    const { error } = await supabase
      .from('plan_metrics')
      .insert(metricsToInsert);

    if (error) throw error;
  };

  const createSampleLandUse = async (planId: string, planType: string) => {
    const landUseData = {
      baseline: [
        { land_use_type: 'residential', area_sqm: 12000, percentage: 60, color_hex: '#4CAF50' },
        { land_use_type: 'commercial', area_sqm: 3000, percentage: 15, color_hex: '#2196F3' },
        { land_use_type: 'public', area_sqm: 2000, percentage: 10, color_hex: '#F44336' },
        { land_use_type: 'open_space', area_sqm: 2500, percentage: 12.5, color_hex: '#8BC34A' },
        { land_use_type: 'parking', area_sqm: 500, percentage: 2.5, color_hex: '#607D8B' }
      ],
      alternative: planType === 'alternative' ? [
        { land_use_type: 'residential', area_sqm: 14000, percentage: 70, color_hex: '#4CAF50' },
        { land_use_type: 'commercial', area_sqm: 2500, percentage: 12.5, color_hex: '#2196F3' },
        { land_use_type: 'public', area_sqm: 1500, percentage: 7.5, color_hex: '#F44336' },
        { land_use_type: 'open_space', area_sqm: 1500, percentage: 7.5, color_hex: '#8BC34A' },
        { land_use_type: 'parking', area_sqm: 500, percentage: 2.5, color_hex: '#607D8B' }
      ] : [
        { land_use_type: 'residential', area_sqm: 10000, percentage: 50, color_hex: '#4CAF50' },
        { land_use_type: 'commercial', area_sqm: 2000, percentage: 10, color_hex: '#2196F3' },
        { land_use_type: 'public', area_sqm: 2000, percentage: 10, color_hex: '#F44336' },
        { land_use_type: 'open_space', area_sqm: 5000, percentage: 25, color_hex: '#8BC34A' },
        { land_use_type: 'parking', area_sqm: 1000, percentage: 5, color_hex: '#607D8B' }
      ],
      proposed: [
        { land_use_type: 'residential', area_sqm: 13000, percentage: 65, color_hex: '#4CAF50' },
        { land_use_type: 'commercial', area_sqm: 2800, percentage: 14, color_hex: '#2196F3' },
        { land_use_type: 'public', area_sqm: 1800, percentage: 9, color_hex: '#F44336' },
        { land_use_type: 'open_space', area_sqm: 2000, percentage: 10, color_hex: '#8BC34A' },
        { land_use_type: 'parking', area_sqm: 400, percentage: 2, color_hex: '#607D8B' }
      ]
    };

    const landUse = landUseData[planType as keyof typeof landUseData] || landUseData.baseline;
    
    const landUseToInsert = landUse.map(use => ({
      plan_id: planId,
      ...use
    }));

    const { error } = await supabase
      .from('plan_land_use')
      .insert(landUseToInsert);

    if (error) throw error;
  };

  // Fetch all plans
  const fetchPlans = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('building_plans')
        .select('*')
        .eq('project_id', projectId)
        .order('created_date', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
      if (data && data.length > 0) {
        setSelectedPlan(data[0]);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  // Fetch metrics and land use for selected plan
  useEffect(() => {
    if (!selectedPlan) return;

    const fetchPlanDetails = async () => {
      try {
        // Fetch metrics
        const { data: metricsData, error: metricsError } = await supabase
          .from('plan_metrics')
          .select('*')
          .eq('plan_id', selectedPlan.id);

        if (metricsError) throw metricsError;
        setMetrics(metricsData || []);

        // Fetch land use
        const { data: landUseData, error: landUseError } = await supabase
          .from('plan_land_use')
          .select('*')
          .eq('plan_id', selectedPlan.id);

        if (landUseError) throw landUseError;
        setLandUse(landUseData || []);
      } catch (error) {
        console.error('Error fetching plan details:', error);
      }
    };

    fetchPlanDetails();
  }, [selectedPlan]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        🏗️ יוצר נתוני דוגמה...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', direction: 'rtl' }}>
      <h1>🏗️ La Guardia Tel Aviv - בדיקת תוכניות בנייה</h1>
      
      {/* Plan Selector */}
      <div style={{ marginBottom: '30px' }}>
        <h2>📋 תוכניות זמינות ({plans.length})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              style={{
                border: selectedPlan?.id === plan.id ? '3px solid #3b82f6' : '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                cursor: 'pointer',
                backgroundColor: selectedPlan?.id === plan.id ? '#f0f9ff' : 'white',
                transition: 'all 0.2s ease'
              }}
            >
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{plan.plan_name}</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: plan.plan_type === 'baseline' ? '#10b981' : 
                                  plan.plan_type === 'proposed' ? '#8b5cf6' : '#3b82f6',
                  color: 'white'
                }}>
                  {plan.plan_type}
                </span>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: plan.status === 'approved' ? '#10b981' : 
                                  plan.status === 'review' ? '#f59e0b' : '#6b7280',
                  color: 'white'
                }}>
                  {plan.status}
                </span>
              </div>
              <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>{plan.description}</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#999' }}>
                נוצר: {new Date(plan.created_date).toLocaleDateString('he-IL')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {selectedPlan && (
        <>
          {/* Plan Metrics */}
          <div style={{ marginBottom: '30px' }}>
            <h2>📊 מדדי תוכנית: {selectedPlan.plan_name}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              {metrics.map((metric) => (
                <div
                  key={metric.metric_type}
                  style={{
                    backgroundColor: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid #e9ecef'
                  }}
                >
                  <h4 style={{ margin: '0 0 10px 0', textTransform: 'capitalize', color: '#495057' }}>
                    {getMetricLabel(metric.metric_type)}
                  </h4>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#212529' }}>
                    {typeof metric.metric_value === 'number' ? metric.metric_value.toFixed(1) : metric.metric_value}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '5px' }}>
                    {metric.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Land Use Breakdown */}
          <div style={{ marginBottom: '30px' }}>
            <h2>🏘️ פילוח שימושי קרקע</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              {landUse.map((use) => (
                <div
                  key={use.land_use_type}
                  style={{
                    backgroundColor: 'white',
                    padding: '15px',
                    borderRadius: '8px',
                    border: `3px solid ${use.color_hex}`,
                    position: 'relative'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    width: '20px',
                    height: '20px',
                    backgroundColor: use.color_hex,
                    borderRadius: '50%'
                  }} />
                  <h4 style={{ margin: '0 0 10px 0', textTransform: 'capitalize', color: '#333' }}>
                    {getLandUseLabel(use.land_use_type)}
                  </h4>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: use.color_hex }}>
                    {use.percentage.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    {use.area_sqm.toLocaleString()} מ״ר
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Comparison */}
          <div style={{ marginBottom: '30px' }}>
            <h2>⚡ השוואה מהירה</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6' }}>מדד</th>
                    {plans.map(plan => (
                      <th key={plan.id} style={{ 
                        padding: '12px', 
                        textAlign: 'center', 
                        borderBottom: '2px solid #dee2e6',
                        backgroundColor: selectedPlan?.id === plan.id ? '#e3f2fd' : '#f8f9fa'
                      }}>
                        {plan.plan_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['far', 'density', 'units_total', 'height_avg'].map(metricType => (
                    <tr key={metricType}>
                      <td style={{ padding: '12px', fontWeight: 'bold', borderBottom: '1px solid #dee2e6' }}>
                        {getMetricLabel(metricType)}
                      </td>
                      {plans.map(plan => {
                        return (
                          <td key={plan.id} style={{ 
                            padding: '12px', 
                            textAlign: 'center', 
                            borderBottom: '1px solid #dee2e6',
                            backgroundColor: selectedPlan?.id === plan.id ? '#f0f9ff' : 'white'
                          }}>
                            {selectedPlan?.id === plan.id ? (
                              metrics.find(m => m.metric_type === metricType)?.metric_value?.toFixed(1) || 'N/A'
                            ) : (
                              '...'
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Debug Info */}
      <div style={{ 
        backgroundColor: '#f1f3f4', 
        padding: '15px', 
        borderRadius: '8px', 
        marginTop: '30px',
        fontSize: '12px',
        color: '#666'
      }}>
        <h3>🔧 מידע דיבוג</h3>
        <p>סה״כ תוכניות: {plans.length}</p>
        <p>תוכנית נבחרת: {selectedPlan?.plan_name || 'אין'}</p>
        <p>מדדים נטענו: {metrics.length}</p>
        <p>סוגי שימושי קרקע: {landUse.length}</p>
        <p>מזהה פרויקט: {projectId}</p>
      </div>
    </div>
  );
};

// Helper functions for Hebrew labels
const getMetricLabel = (metricType: string): string => {
  const labels: { [key: string]: string } = {
    'far': 'יחס שטח בנוי',
    'density': 'צפיפות',
    'units_total': 'סה״כ יחידות',
    'height_avg': 'גובה ממוצע',
    'coverage': 'אחוז כיסוי',
    'parking_ratio': 'יחס חניות'
  };
  return labels[metricType] || metricType;
};

const getLandUseLabel = (landUseType: string): string => {
  const labels: { [key: string]: string } = {
    'residential': 'מגורים',
    'commercial': 'מסחר',
    'public': 'ציבורי',
    'open_space': 'שטח פתוח',
    'parking': 'חניות',
    'industrial': 'תעשייה',
    'mixed_use': 'שימוש מעורב'
  };
  return labels[landUseType] || landUseType;
};

export default TestPlanData;