// PublicAllocationDashboard.tsx - עבור הקצאת מבני ציבור עם תחזיות הכנסות
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Building2, TrendingUp, TrendingDown, DollarSign, Users, Calendar } from 'lucide-react';

interface PublicPlan {
  id: string;
  plan_name: string;
  plan_type: string;
  status: string;
  description: string;
  created_date: string;
}

interface RevenueProjection {
  plan_id: string;
  building_name: string;
  revenue_source: string;
  annual_revenue: number;
  projection_year: number;
  revenue_type: string;
  revenue_direction: string;
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

const PublicAllocationDashboard: React.FC = () => {
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PublicPlan | null>(null);
  const [revenues, setRevenues] = useState<RevenueProjection[]>([]);
  const [metrics, setMetrics] = useState<PlanMetric[]>([]);
  const [landUse, setLandUse] = useState<LandUse[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Initialize project and create sample data
  useEffect(() => {
    const initializeData = async () => {
      try {
        // First, get or create a project for public allocation
        let { data: projects, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('name', 'Public Allocation Tel Aviv')
          .limit(1);

        if (projectError) throw projectError;

        let currentProjectId: string;

        if (!projects || projects.length === 0) {
          // Create a new project for public allocation
          const { data: newProject, error: createError } = await supabase
            .from('projects')
            .insert({
              name: 'Public Allocation Tel Aviv',
              description: 'הקצאת שטחים למבני ציבור - מרכז תעשייה תל אביב',
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

        // Check if we already have public allocation plans
        const { data: existingPlans, error: plansError } = await supabase
          .from('building_plans')
          .select('*')
          .eq('project_id', currentProjectId);

        if (plansError) throw plansError;

        if (!existingPlans || existingPlans.length === 0) {
          // Create sample public allocation plans
          await createPublicAllocationPlans(currentProjectId);
        }

        // First, get or create a project for public allocation
        let { data: projects, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('name', 'Public Allocation Tel Aviv')
          .limit(1);

        if (projectError) throw projectError;

        let currentProjectId: string;

        if (!projects || projects.length === 0) {
          // Create a new project for public allocation
          const { data: newProject, error: createError } = await supabase
            .from('projects')
            .insert({
              name: 'Public Allocation Tel Aviv',
              description: 'הקצאת שטחים למבני ציבור - מרכז תעשייה תל אביב',
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

        // Check if we already have public allocation plans
        const { data: existingPlans, error: plansError } = await supabase
          .from('building_plans')
          .select('*')
          .eq('project_id', currentProjectId);

        if (plansError) throw plansError;

        if (!existingPlans || existingPlans.length === 0) {
          // Create sample public allocation plans
          await createPublicAllocationPlans(currentProjectId);
        }

        // Fetch all plans
        await fetchPlans(currentProjectId);
      } catch (error) {
        console.error('Error initializing public allocation data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const createPublicAllocationPlans = async (projectId: string) => {
    try {
      // Create sample public allocation plans
      const samplePlans = [
        {
          project_id: projectId,
          plan_name: 'תוכנית הקצאה בסיסית - מרכז תעשייה',
          plan_type: 'baseline',
          status: 'approved',
          description: 'הקצאת שטחים בסיסית למבני ציבור במרכז התעשייה',
          version: 1
        },
        {
          project_id: projectId,
          plan_name: 'תוכנית הקצאה מורחבת - שירותי ציבור',
          plan_type: 'alternative',
          status: 'review',
          description: 'הרחבת שטחי ציבור עם דגש על שירותים קהילתיים',
          version: 1
        },
        {
          project_id: projectId,
          plan_name: 'תוכנית הקצאה כלכלית - מקסום הכנסות',
          plan_type: 'proposed',
          status: 'draft',
          description: 'תוכנית ממוקדת הכנסות עם איזון בין ציבורי למסחרי',
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

      // Create sample metrics and land use for each plan
      for (const plan of createdPlans) {
        await createPublicAllocationMetrics(plan.id, plan.plan_type);
        await createPublicAllocationLandUse(plan.id, plan.plan_type);
        await createRevenueProjections(plan.id, plan.plan_name);
      }

      console.log('✅ Public allocation plans created successfully!');
    } catch (error) {
      console.error('Error creating public allocation plans:', error);
    }
  };

  const createPublicAllocationMetrics = async (planId: string, planType: string) => {
    const metricsData = {
      baseline: [
        { metric_type: 'far', metric_value: 1.8, unit: 'ratio' },
        { metric_type: 'employment', metric_value: 2500, unit: 'jobs' },
        { metric_type: 'revenue_annual', metric_value: 45, unit: 'M ILS' },
        { metric_type: 'public_services', metric_value: 35, unit: 'percentage' }
      ],
      alternative: [
        { metric_type: 'far', metric_value: 2.2, unit: 'ratio' },
        { metric_type: 'employment', metric_value: 3200, unit: 'jobs' },
        { metric_type: 'revenue_annual', metric_value: 62, unit: 'M ILS' },
        { metric_type: 'public_services', metric_value: 45, unit: 'percentage' }
      ],
      proposed: [
        { metric_type: 'far', metric_value: 2.0, unit: 'ratio' },
        { metric_type: 'employment', metric_value: 2800, unit: 'jobs' },
        { metric_type: 'revenue_annual', metric_value: 58, unit: 'M ILS' },
        { metric_type: 'public_services', metric_value: 40, unit: 'percentage' }
      ]
    };

    const metrics = metricsData[planType as keyof typeof metricsData] || metricsData.baseline;
    
    const metricsToInsert = metrics.map(metric => ({
      plan_id: planId,
      ...metric
    }));

    const { error } = await supabase
      .from('plan_metrics')
      .upsert(metricsToInsert, { onConflict: 'plan_id,metric_type,category' });

    if (error) throw error;
  };

  const createPublicAllocationLandUse = async (planId: string, planType: string) => {
    const landUseData = {
      baseline: [
        { land_use_type: 'public', area_sqm: 8000, percentage: 40, color_hex: '#F44336' },
        { land_use_type: 'commercial', area_sqm: 6000, percentage: 30, color_hex: '#2196F3' },
        { land_use_type: 'industrial', area_sqm: 4000, percentage: 20, color_hex: '#FF9800' },
        { land_use_type: 'open_space', area_sqm: 1500, percentage: 7.5, color_hex: '#8BC34A' },
        { land_use_type: 'parking', area_sqm: 500, percentage: 2.5, color_hex: '#607D8B' }
      ],
      alternative: [
        { land_use_type: 'public', area_sqm: 10000, percentage: 50, color_hex: '#F44336' },
        { land_use_type: 'commercial', area_sqm: 5000, percentage: 25, color_hex: '#2196F3' },
        { land_use_type: 'industrial', area_sqm: 3000, percentage: 15, color_hex: '#FF9800' },
        { land_use_type: 'open_space', area_sqm: 1500, percentage: 7.5, color_hex: '#8BC34A' },
        { land_use_type: 'parking', area_sqm: 500, percentage: 2.5, color_hex: '#607D8B' }
      ],
      proposed: [
        { land_use_type: 'public', area_sqm: 9000, percentage: 45, color_hex: '#F44336' },
        { land_use_type: 'commercial', area_sqm: 5500, percentage: 27.5, color_hex: '#2196F3' },
        { land_use_type: 'industrial', area_sqm: 3500, percentage: 17.5, color_hex: '#FF9800' },
        { land_use_type: 'open_space', area_sqm: 1500, percentage: 7.5, color_hex: '#8BC34A' },
        { land_use_type: 'parking', area_sqm: 500, percentage: 2.5, color_hex: '#607D8B' }
      ]
    };

    const landUse = landUseData[planType as keyof typeof landUseData] || landUseData.baseline;
    
    const landUseToInsert = landUse.map(use => ({
      plan_id: planId,
      ...use
    }));

    const { error } = await supabase
      .from('plan_land_use')
      .upsert(landUseToInsert, { onConflict: 'plan_id,land_use_type' });

    if (error) throw error;
  };

  const createRevenueProjections = async (planId: string, planName: string) => {
    const revenueData = [];
    const sources = [
      { name: 'ארנונה מסחרית', base: 8000000, type: 'הכנסה' },
      { name: 'שכירות משרדים', base: 12000000, type: 'הכנסה' },
      { name: 'חניות ציבוריות', base: 2500000, type: 'הכנסה' },
      { name: 'אחזקת מבנים', base: -3000000, type: 'הוצאה' },
      { name: 'שירותי ניקיון', base: -1500000, type: 'הוצאה' },
      { name: 'אבטחה', base: -2000000, type: 'הוצאה' }
    ];

    for (let year = 2024; year <= 2033; year++) {
      sources.forEach(source => {
        const growth = source.type === 'הכנסה' ? 1.03 : 1.02; // 3% growth for income, 2% for expenses
        const yearMultiplier = Math.pow(growth, year - 2024);
        
        revenueData.push({
          plan_name: planName,
          building_name: 'מרכז תעשייה',
          revenue_source: source.name,
          annual_revenue: Math.round(source.base * yearMultiplier),
          projection_year: year,
          revenue_type: source.type === 'הכנסה' ? 'income' : 'expense',
          revenue_direction: source.type
        });
      });
    }

    // Insert revenue projections data
    const { error } = await supabase
      .from('revenue_summary_10_year')
      .upsert(revenueData, { onConflict: 'plan_name,revenue_source,projection_year' });
    
    if (error) {
      throw error;
    }
  };

  const createPublicAllocationPlans = async (projectId: string) => {
    try {
      // Create sample public allocation plans
      const samplePlans = [
        {
          project_id: projectId,
          plan_name: 'תוכנית הקצאה בסיסית - מרכז תעשייה',
          plan_type: 'baseline',
          status: 'approved',
          description: 'הקצאת שטחים בסיסית למבני ציבור במרכז התעשייה',
          version: 1
        },
        {
          project_id: projectId,
          plan_name: 'תוכנית הקצאה מורחבת - שירותי ציבור',
          plan_type: 'alternative',
          status: 'review',
          description: 'הרחבת שטחי ציבור עם דגש על שירותים קהילתיים',
          version: 1
        },
        {
          project_id: projectId,
          plan_name: 'תוכנית הקצאה כלכלית - מקסום הכנסות',
          plan_type: 'proposed',
          status: 'draft',
          description: 'תוכנית ממוקדת הכנסות עם איזון בין ציבורי למסחרי',
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

      // Create sample metrics and land use for each plan
      for (const plan of createdPlans) {
        await createPublicAllocationMetrics(plan.id, plan.plan_type);
        await createPublicAllocationLandUse(plan.id, plan.plan_type);
        await createRevenueProjections(plan.id, plan.plan_name);
      }

      console.log('✅ Public allocation plans created successfully!');
    } catch (error) {
      console.error('Error creating public allocation plans:', error);
    }
  };

  const createPublicAllocationMetrics = async (planId: string, planType: string) => {
    const metricsData = {
      baseline: [
        { metric_type: 'far', metric_value: 1.8, unit: 'ratio' },
        { metric_type: 'employment', metric_value: 2500, unit: 'jobs' },
        { metric_type: 'revenue_annual', metric_value: 45, unit: 'M ILS' },
        { metric_type: 'public_services', metric_value: 35, unit: 'percentage' }
      ],
      alternative: [
        { metric_type: 'far', metric_value: 2.2, unit: 'ratio' },
        { metric_type: 'employment', metric_value: 3200, unit: 'jobs' },
        { metric_type: 'revenue_annual', metric_value: 62, unit: 'M ILS' },
        { metric_type: 'public_services', metric_value: 45, unit: 'percentage' }
      ],
      proposed: [
        { metric_type: 'far', metric_value: 2.0, unit: 'ratio' },
        { metric_type: 'employment', metric_value: 2800, unit: 'jobs' },
        { metric_type: 'revenue_annual', metric_value: 58, unit: 'M ILS' },
        { metric_type: 'public_services', metric_value: 40, unit: 'percentage' }
      ]
    };

    const metrics = metricsData[planType as keyof typeof metricsData] || metricsData.baseline;
    
    const metricsToInsert = metrics.map(metric => ({
      plan_id: planId,
      ...metric
    }));

    const { error } = await supabase
      .from('plan_metrics')
      .upsert(metricsToInsert, { onConflict: 'plan_id,metric_type,category' });

    if (error) throw error;
  };

  const createPublicAllocationLandUse = async (planId: string, planType: string) => {
    const landUseData = {
      baseline: [
        { land_use_type: 'public', area_sqm: 8000, percentage: 40, color_hex: '#F44336' },
        { land_use_type: 'commercial', area_sqm: 6000, percentage: 30, color_hex: '#2196F3' },
        { land_use_type: 'industrial', area_sqm: 4000, percentage: 20, color_hex: '#FF9800' },
        { land_use_type: 'open_space', area_sqm: 1500, percentage: 7.5, color_hex: '#8BC34A' },
        { land_use_type: 'parking', area_sqm: 500, percentage: 2.5, color_hex: '#607D8B' }
      ],
      alternative: [
        { land_use_type: 'public', area_sqm: 10000, percentage: 50, color_hex: '#F44336' },
        { land_use_type: 'commercial', area_sqm: 5000, percentage: 25, color_hex: '#2196F3' },
        { land_use_type: 'industrial', area_sqm: 3000, percentage: 15, color_hex: '#FF9800' },
        { land_use_type: 'open_space', area_sqm: 1500, percentage: 7.5, color_hex: '#8BC34A' },
        { land_use_type: 'parking', area_sqm: 500, percentage: 2.5, color_hex: '#607D8B' }
      ],
      proposed: [
        { land_use_type: 'public', area_sqm: 9000, percentage: 45, color_hex: '#F44336' },
        { land_use_type: 'commercial', area_sqm: 5500, percentage: 27.5, color_hex: '#2196F3' },
        { land_use_type: 'industrial', area_sqm: 3500, percentage: 17.5, color_hex: '#FF9800' },
        { land_use_type: 'open_space', area_sqm: 1500, percentage: 7.5, color_hex: '#8BC34A' },
        { land_use_type: 'parking', area_sqm: 500, percentage: 2.5, color_hex: '#607D8B' }
      ]
    };

    const landUse = landUseData[planType as keyof typeof landUseData] || landUseData.baseline;
    
    const landUseToInsert = landUse.map(use => ({
      plan_id: planId,
      ...use
    }));

    const { error } = await supabase
      .from('plan_land_use')
      .upsert(landUseToInsert, { onConflict: 'plan_id,land_use_type' });

    if (error) throw error;
  };

  const createRevenueProjections = async (planId: string, planName: string) => {
    const revenueData = [];
    const sources = [
      { name: 'ארנונה מסחרית', base: 8000000, type: 'הכנסה' },
      { name: 'שכירות משרדים', base: 12000000, type: 'הכנסה' },
      { name: 'חניות ציבוריות', base: 2500000, type: 'הכנסה' },
      { name: 'אחזקת מבנים', base: -3000000, type: 'הוצאה' },
      { name: 'שירותי ניקיון', base: -1500000, type: 'הוצאה' },
      { name: 'אבטחה', base: -2000000, type: 'הוצאה' }
    ];

    for (let year = 2024; year <= 2033; year++) {
      sources.forEach(source => {
        const growth = source.type === 'הכנסה' ? 1.03 : 1.02; // 3% growth for income, 2% for expenses
        const yearMultiplier = Math.pow(growth, year - 2024);
        
        revenueData.push({
          plan_name: planName,
          building_name: 'מרכז תעשייה',
          revenue_source: source.name,
          annual_revenue: Math.round(source.base * yearMultiplier),
          projection_year: year,
          revenue_type: source.type === 'הכנסה' ? 'income' : 'expense',
          revenue_direction: source.type
        });
      });
    }

    // Insert revenue projections data
    const { error } = await supabase
      .from('revenue_summary_10_year')
      .upsert(revenueData, { onConflict: 'plan_name,revenue_source,projection_year' });
    
    if (error) {
      throw error;
    }
  };

  // Fetch all public allocation plans
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

  // Fetch revenue projections and plan details for selected plan
  useEffect(() => {
    if (!selectedPlan) return;

    const fetchPlanDetails = async () => {
      try {
        // Try to fetch revenue projections
        try {
          const { data: revenueData, error: revenueError } = await supabase
            .from('revenue_summary_10_year')
            .select('*')
            .eq('plan_name', selectedPlan.plan_name)
            .order('projection_year');

          if (!revenueError) {
            setRevenues(revenueData || []);
          }
        } catch (error) {
          console.warn('Revenue data not available:', error);
          setRevenues([]);
        }

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

  // Process revenue data for charts
  const processRevenueData = () => {
    if (!revenues.length) return { yearlyData: [], totalRevenue: 0, totalExpenses: 0 };

    const yearlyRevenue = revenues.reduce((acc, item) => {
      const year = item.projection_year;
      if (!acc[year]) {
        acc[year] = { year, income: 0, expenses: 0, net: 0 };
      }
      
      if (item.annual_revenue > 0) {
        acc[year].income += item.annual_revenue;
      } else {
        acc[year].expenses += Math.abs(item.annual_revenue);
      }
      acc[year].net = acc[year].income - acc[year].expenses;
      
      return acc;
    }, {} as any);

    const yearlyData = Object.values(yearlyRevenue).sort((a: any, b: any) => a.year - b.year);
    const totalRevenue = revenues.filter(r => r.annual_revenue > 0).reduce((sum, r) => sum + r.annual_revenue, 0);
    const totalExpenses = revenues.filter(r => r.annual_revenue < 0).reduce((sum, r) => sum + Math.abs(r.annual_revenue), 0);

    return { yearlyData, totalRevenue, totalExpenses };
  };

  const { yearlyData, totalRevenue, totalExpenses } = processRevenueData();

  // Get key metrics for display
  const getMetricValue = (type: string) => {
    const metric = metrics.find(m => m.metric_type === type);
    return metric ? metric.metric_value : 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return <div className="loading" style={{ textAlign: 'center', padding: '50px' }}>טוען תוכניות הקצאה...</div>;
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', direction: 'rtl' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
        🏛️ הקצאת שטחים למבני ציבור - מרכז תעשייה תל אביב
      </h1>
      
      {/* Plan Selector */}
      <div style={{ marginBottom: '30px' }}>
        <h2>📋 תוכניות זמינות ({plans.length})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              style={{
                border: selectedPlan?.id === plan.id ? '3px solid #FF5722' : '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                cursor: 'pointer',
                backgroundColor: selectedPlan?.id === plan.id ? '#fff3e0' : 'white',
                transition: 'all 0.2s ease',
                boxShadow: selectedPlan?.id === plan.id ? '0 4px 12px rgba(255,87,34,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{plan.plan_name}</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: plan.plan_type === 'baseline' ? '#4CAF50' : '#FF5722',
                  color: 'white'
                }}>
                  {plan.plan_type === 'baseline' ? 'מצב קיים' : 'חלופה'}
                </span>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: plan.status === 'approved' ? '#4CAF50' : 
                                  plan.status === 'review' ? '#FF9800' : '#9E9E9E',
                  color: 'white'
                }}>
                  {plan.status === 'approved' ? 'מאושר' : plan.status === 'review' ? 'בבדיקה' : 'טיוטה'}
                </span>
              </div>
              <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>{plan.description}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedPlan && (
        <>
          {/* Key Performance Indicators */}
          <div style={{ marginBottom: '30px' }}>
            <h2>📊 מדדים עיקריים: {selectedPlan.plan_name}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div style={{ backgroundColor: '#e8f5e8', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '2px solid #4CAF50' }}>
                <Building2 size={32} color="#4CAF50" style={{ marginBottom: '10px' }} />
                <h4 style={{ margin: '0', color: '#2E7D32' }}>יחס בנייה</h4>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1B5E20' }}>
                  {getMetricValue('far').toFixed(1)}
                </div>
              </div>
              
              <div style={{ backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '2px solid #2196F3' }}>
                <Users size={32} color="#2196F3" style={{ marginBottom: '10px' }} />
                <h4 style={{ margin: '0', color: '#1565C0' }}>תעסוקה</h4>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0D47A1' }}>
                  {getMetricValue('employment').toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#1565C0' }}>משרות</div>
              </div>

              <div style={{ backgroundColor: '#fff3e0', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '2px solid #FF9800' }}>
                <DollarSign size={32} color="#FF9800" style={{ marginBottom: '10px' }} />
                <h4 style={{ margin: '0', color: '#E65100' }}>הכנסות שנתיות</h4>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#BF360C' }}>
                  {formatCurrency(getMetricValue('revenue_annual') * 1000000)}
                </div>
              </div>

              <div style={{ backgroundColor: '#f3e5f5', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '2px solid #9C27B0' }}>
                <TrendingUp size={32} color="#9C27B0" style={{ marginBottom: '10px' }} />
                <h4 style={{ margin: '0', color: '#6A1B9A' }}>שירותי ציבור</h4>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4A148C' }}>
                  {getMetricValue('public_services').toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          {/* 10-Year Revenue Projections */}
          {yearlyData.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h2>💰 תחזית הכנסות והוצאות - 10 שנים</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <h3>תחזית שנתית</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={yearlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                      <Legend />
                      <Bar dataKey="income" fill="#4CAF50" name="הכנסות" />
                      <Bar dataKey="expenses" fill="#F44336" name="הוצאות" />
                      <Bar dataKey="net" fill="#2196F3" name="נטו" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <h3>סיכום 10 שנים</h3>
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <TrendingUp size={20} color="#4CAF50" style={{ marginLeft: '8px' }} />
                      <span style={{ fontWeight: 'bold', color: '#2E7D32' }}>סה"כ הכנסות:</span>
                    </div>
                    <div style={{ fontSize: '18px', color: '#1B5E20' }}>{formatCurrency(totalRevenue)}</div>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <TrendingDown size={20} color="#F44336" style={{ marginLeft: '8px' }} />
                      <span style={{ fontWeight: 'bold', color: '#C62828' }}>סה"כ הוצאות:</span>
                    </div>
                    <div style={{ fontSize: '18px', color: '#B71C1C' }}>{formatCurrency(totalExpenses)}</div>
                  </div>

                  <div style={{ borderTop: '2px solid #ddd', paddingTop: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <DollarSign size={20} color="#2196F3" style={{ marginLeft: '8px' }} />
                      <span style={{ fontWeight: 'bold', color: '#1565C0' }}>רווח נטו:</span>
                    </div>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: 'bold',
                      color: totalRevenue - totalExpenses > 0 ? '#1B5E20' : '#B71C1C' 
                    }}>
                      {formatCurrency(totalRevenue - totalExpenses)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Land Use Distribution */}
          <div style={{ marginBottom: '30px' }}>
            <h2>🏘️ חלוקת שטחים</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
              
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={landUse}
                      dataKey="percentage"
                      nameKey="land_use_type"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ land_use_type, percentage }) => `${percentage.toFixed(1)}%`}
                    >
                      {landUse.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color_hex} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
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
                    <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
                      {use.land_use_type === 'public' ? 'ציבורי' :
                       use.land_use_type === 'commercial' ? 'מסחרי' :
                       use.land_use_type === 'industrial' ? 'תעשייה' :
                       use.land_use_type === 'mixed_use' ? 'שימוש מעורב' :
                       use.land_use_type === 'open_space' ? 'שטח פתוח' :
                       use.land_use_type === 'parking' ? 'חניות' : use.land_use_type}
                    </h4>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: use.color_hex }}>
                      {use.percentage.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                      {use.area_sqm.toLocaleString()} מ"ר
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue Breakdown by Source */}
          {revenues.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h2>💼 פירוט הכנסות לפי מקור</h2>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>מקור הכנסה</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>מבנה</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>שנה</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>סכום</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>סוג</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenues.slice(0, 15).map((revenue, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>{revenue.revenue_source}</td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>{revenue.building_name || 'כללי'}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{revenue.projection_year}</td>
                        <td style={{ 
                          padding: '12px', 
                          textAlign: 'left',
                          color: revenue.annual_revenue > 0 ? '#2E7D32' : '#C62828',
                          fontWeight: 'bold'
                        }}>
                          {formatCurrency(Math.abs(revenue.annual_revenue))}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            backgroundColor: revenue.revenue_direction === 'הכנסה' ? '#E8F5E8' : '#FFEBEE',
                            color: revenue.revenue_direction === 'הכנסה' ? '#2E7D32' : '#C62828'
                          }}>
                            {revenue.revenue_direction}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {revenues.length > 15 && (
                  <div style={{ padding: '15px', textAlign: 'center', backgroundColor: '#f9f9f9', color: '#666' }}>
                    ועוד {revenues.length - 15} פריטים נוספים...
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Summary Box */}
      <div style={{
        backgroundColor: '#e8f5e8',
        border: '2px solid #4CAF50',
        borderRadius: '8px',
        padding: '20px',
        marginTop: '30px'
      }}>
        <h3 style={{ color: '#2E7D32', marginTop: '0' }}>📋 סיכום תוכנית הקצאה</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <strong>תוכניות זמינות:</strong> {plans.length}<br />
            <strong>תוכנית נבחרת:</strong> {selectedPlan?.plan_name || 'אין'}
          </div>
          <div>
            <strong>שטח כולל:</strong> {landUse.reduce((sum, use) => sum + use.area_sqm, 0).toLocaleString()} מ"ר<br />
            <strong>תחזיות הכנסות:</strong> {revenues.length} פריטים
          </div>
          <div>
            <strong>מיקום:</strong> מרכז תעשייה תל אביב<br />
            <strong>מזהה פרויקט:</strong> {projectId}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicAllocationDashboard;