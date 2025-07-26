// PublicAllocationDashboard.tsx - עבור הקצאת מבני ציבור עם תחזיות הכנסות
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Building2, TrendingUp, TrendingDown, DollarSign, Users, Calendar } from 'lucide-react';

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

interface RevenueProjection {
  plan_name: string;
  building_name: string;
  revenue_source: string;
  annual_revenue: number;
  projection_year: number;
  revenue_type: string;
  revenue_direction: string;
}

const PublicAllocationDashboard: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [metrics, setMetrics] = useState<PlanMetric[]>([]);
  const [landUse, setLandUse] = useState<LandUse[]>([]);
  const [revenues, setRevenues] = useState<RevenueProjection[]>([]);
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
          .eq('name', 'הקצאת ציבור תל אביב')
          .limit(1);

        if (projectError) throw projectError;

        let currentProjectId: string;

        if (!projects || projects.length === 0) {
          // Create a new project
          const { data: newProject, error: createError } = await supabase
            .from('projects')
            .insert({
              name: 'הקצאת ציבור תל אביב',
              description: 'פרויקט הקצאת שטחים למבני ציבור במרכז תל אביב',
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
      // Create sample building plans for public allocation
      const samplePlans = [
        {
          project_id: projectId,
          plan_name: 'תוכנית הקצאה בסיסית - מרכז ציבורי',
          plan_type: 'baseline',
          status: 'approved',
          description: 'תוכנית הקצאה בסיסית למבני ציבור במרכז העיר',
          version: 1
        },
        {
          project_id: projectId,
          plan_name: 'תוכנית הקצאה מורחבת - שירותי קהילה',
          plan_type: 'alternative',
          status: 'review',
          description: 'הרחבת שטחי ציבור עם דגש על שירותים קהילתיים',
          version: 1
        },
        {
          project_id: projectId,
          plan_name: 'תוכנית הקצאה כלכלית - איזון הכנסות',
          plan_type: 'alternative',
          status: 'draft',
          description: 'תוכנית ממוקדת איזון בין צרכי ציבור להכנסות עירוניות',
          version: 1
        },
        {
          project_id: projectId,
          plan_name: 'תוכנית הקצאה מוצעת - פתרון היברידי',
          plan_type: 'proposed',
          status: 'review',
          description: 'שילוב של כל התוכניות עם דגש על קיימות כלכלית',
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
        await createSampleRevenues(plan.plan_name, plan.plan_type);
      }

      console.log('✅ Sample public allocation plans created successfully!');
    } catch (error) {
      console.error('Error creating sample plans:', error);
    }
  };

  const createSampleMetrics = async (planId: string, planType: string) => {
    // Different metrics based on plan type for public allocation
    const metricsData = {
      baseline: [
        { metric_type: 'far', metric_value: 1.8, unit: 'ratio' },
        { metric_type: 'employment', metric_value: 2500, unit: 'jobs' },
        { metric_type: 'units_total', metric_value: 180, unit: 'units' },
        { metric_type: 'height_avg', metric_value: 25, unit: 'meters' },
        { metric_type: 'coverage', metric_value: 40, unit: 'percentage' },
        { metric_type: 'public_services', metric_value: 35, unit: 'percentage' }
      ],
      alternative: planType === 'alternative' ? [
        { metric_type: 'far', metric_value: 2.2, unit: 'ratio' },
        { metric_type: 'employment', metric_value: 3200, unit: 'jobs' },
        { metric_type: 'units_total', metric_value: 220, unit: 'units' },
        { metric_type: 'height_avg', metric_value: 32, unit: 'meters' },
        { metric_type: 'coverage', metric_value: 35, unit: 'percentage' },
        { metric_type: 'public_services', metric_value: 45, unit: 'percentage' }
      ] : [
        { metric_type: 'far', metric_value: 2.0, unit: 'ratio' },
        { metric_type: 'employment', metric_value: 2800, unit: 'jobs' },
        { metric_type: 'units_total', metric_value: 200, unit: 'units' },
        { metric_type: 'height_avg', metric_value: 28, unit: 'meters' },
        { metric_type: 'coverage', metric_value: 38, unit: 'percentage' },
        { metric_type: 'public_services', metric_value: 40, unit: 'percentage' }
      ],
      proposed: [
        { metric_type: 'far', metric_value: 2.1, unit: 'ratio' },
        { metric_type: 'employment', metric_value: 2900, unit: 'jobs' },
        { metric_type: 'units_total', metric_value: 210, unit: 'units' },
        { metric_type: 'height_avg', metric_value: 30, unit: 'meters' },
        { metric_type: 'coverage', metric_value: 37, unit: 'percentage' },
        { metric_type: 'public_services', metric_value: 42, unit: 'percentage' }
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

  const createSampleLandUse = async (planId: string, planType: string) => {
    const landUseData = {
      baseline: [
        { land_use_type: 'public', area_sqm: 8000, percentage: 40, color_hex: '#F44336' },
        { land_use_type: 'commercial', area_sqm: 6000, percentage: 30, color_hex: '#2196F3' },
        { land_use_type: 'residential', area_sqm: 4000, percentage: 20, color_hex: '#4CAF50' },
        { land_use_type: 'open_space', area_sqm: 1500, percentage: 7.5, color_hex: '#8BC34A' },
        { land_use_type: 'parking', area_sqm: 500, percentage: 2.5, color_hex: '#607D8B' }
      ],
      alternative: planType === 'alternative' ? [
        { land_use_type: 'public', area_sqm: 10000, percentage: 50, color_hex: '#F44336' },
        { land_use_type: 'commercial', area_sqm: 5000, percentage: 25, color_hex: '#2196F3' },
        { land_use_type: 'residential', area_sqm: 3000, percentage: 15, color_hex: '#4CAF50' },
        { land_use_type: 'open_space', area_sqm: 1500, percentage: 7.5, color_hex: '#8BC34A' },
        { land_use_type: 'parking', area_sqm: 500, percentage: 2.5, color_hex: '#607D8B' }
      ] : [
        { land_use_type: 'public', area_sqm: 9000, percentage: 45, color_hex: '#F44336' },
        { land_use_type: 'commercial', area_sqm: 5500, percentage: 27.5, color_hex: '#2196F3' },
        { land_use_type: 'residential', area_sqm: 3500, percentage: 17.5, color_hex: '#4CAF50' },
        { land_use_type: 'open_space', area_sqm: 1500, percentage: 7.5, color_hex: '#8BC34A' },
        { land_use_type: 'parking', area_sqm: 500, percentage: 2.5, color_hex: '#607D8B' }
      ],
      proposed: [
        { land_use_type: 'public', area_sqm: 8500, percentage: 42.5, color_hex: '#F44336' },
        { land_use_type: 'commercial', area_sqm: 5800, percentage: 29, color_hex: '#2196F3' },
        { land_use_type: 'residential', area_sqm: 3700, percentage: 18.5, color_hex: '#4CAF50' },
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

  const createSampleRevenues = async (planName: string, planType: string) => {
    const revenueData = [];
    
    // Different revenue sources based on plan type
    const revenueSources = {
      baseline: [
        { name: 'ארנונה ממבני ציבור', base: 8000000, type: 'הכנסה' },
        { name: 'שכירות משרדי עירייה', base: 12000000, type: 'הכנסה' },
        { name: 'חניות ציבוריות', base: 2500000, type: 'הכנסה' },
        { name: 'אחזקת מבנים', base: -3000000, type: 'הוצאה' },
        { name: 'שירותי ניקיון', base: -1500000, type: 'הוצאה' },
        { name: 'אבטחה ושמירה', base: -2000000, type: 'הוצאה' }
      ],
      alternative: [
        { name: 'ארנונה ממבני ציבור', base: 10000000, type: 'הכנסה' },
        { name: 'שכירות משרדי עירייה', base: 15000000, type: 'הכנסה' },
        { name: 'חניות ציבוריות', base: 3000000, type: 'הכנסה' },
        { name: 'אחזקת מבנים', base: -4000000, type: 'הוצאה' },
        { name: 'שירותי ניקיון', base: -2000000, type: 'הוצאה' },
        { name: 'אבטחה ושמירה', base: -2500000, type: 'הוצאה' }
      ],
      proposed: [
        { name: 'ארנונה ממבני ציבור', base: 9000000, type: 'הכנסה' },
        { name: 'שכירות משרדי עירייה', base: 13500000, type: 'הכנסה' },
        { name: 'חניות ציבוריות', base: 2800000, type: 'הכנסה' },
        { name: 'אחזקת מבנים', base: -3500000, type: 'הוצאה' },
        { name: 'שירותי ניקיון', base: -1800000, type: 'הוצאה' },
        { name: 'אבטחה ושמירה', base: -2200000, type: 'הוצאה' }
      ]
    };

    const sources = revenueSources[planType as keyof typeof revenueSources] || revenueSources.baseline;

    for (let year = 2024; year <= 2033; year++) {
      sources.forEach(source => {
        const growth = source.type === 'הכנסה' ? 1.03 : 1.02; // 3% growth for income, 2% for expenses
        const yearMultiplier = Math.pow(growth, year - 2024);
        
        revenueData.push({
          plan_name: planName,
          building_name: 'מרכז ציבורי',
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
      console.warn('Could not insert revenue data:', error);
    }
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

  // Fetch metrics, land use, and revenues for selected plan
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
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        🏛️ יוצר נתוני הקצאת ציבור...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', direction: 'rtl' }}>
      <h1>🏛️ הקצאת שטחים למבני ציבור - תל אביב</h1>
      
      {/* Plan Selector */}
      <div style={{ marginBottom: '30px' }}>
        <h2>📋 תוכניות זמינות ({plans.length})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              style={{
                border: selectedPlan?.id === plan.id ? '3px solid #F44336' : '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                cursor: 'pointer',
                backgroundColor: selectedPlan?.id === plan.id ? '#ffebee' : 'white',
                transition: 'all 0.2s ease'
              }}
            >
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{plan.plan_name}</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: plan.plan_type === 'baseline' ? '#4CAF50' : 
                                  plan.plan_type === 'proposed' ? '#9C27B0' : '#F44336',
                  color: 'white'
                }}>
                  {plan.plan_type}
                </span>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: plan.status === 'approved' ? '#4CAF50' : 
                                  plan.status === 'review' ? '#FF9800' : '#9E9E9E',
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

          {/* Revenue Projections Chart */}
          {yearlyData.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h2>💰 תחזית הכנסות והוצאות - 10 שנים</h2>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <ResponsiveContainer width="100%" height={400}>
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
            </div>
          )}

          {/* Revenue Summary */}
          {revenues.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h2>💼 סיכום כלכלי</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div style={{ backgroundColor: '#e8f5e8', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '2px solid #4CAF50' }}>
                  <TrendingUp size={32} color="#4CAF50" style={{ marginBottom: '10px' }} />
                  <h4 style={{ margin: '0', color: '#2E7D32' }}>סה״כ הכנסות</h4>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1B5E20' }}>
                    {formatCurrency(totalRevenue)}
                  </div>
                </div>
                
                <div style={{ backgroundColor: '#ffebee', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '2px solid #F44336' }}>
                  <TrendingDown size={32} color="#F44336" style={{ marginBottom: '10px' }} />
                  <h4 style={{ margin: '0', color: '#C62828' }}>סה״כ הוצאות</h4>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#B71C1C' }}>
                    {formatCurrency(totalExpenses)}
                  </div>
                </div>

                <div style={{ backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '2px solid #2196F3' }}>
                  <DollarSign size={32} color="#2196F3" style={{ marginBottom: '10px' }} />
                  <h4 style={{ margin: '0', color: '#1565C0' }}>רווח נטו</h4>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold',
                    color: totalRevenue - totalExpenses > 0 ? '#1B5E20' : '#B71C1C' 
                  }}>
                    {formatCurrency(totalRevenue - totalExpenses)}
                  </div>
                </div>
              </div>
            </div>
          )}

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
                        backgroundColor: selectedPlan?.id === plan.id ? '#ffebee' : '#f8f9fa'
                      }}>
                        {plan.plan_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['far', 'employment', 'units_total', 'public_services'].map(metricType => (
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
                            backgroundColor: selectedPlan?.id === plan.id ? '#ffebee' : 'white'
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
        <p>תחזיות הכנסות: {revenues.length}</p>
        <p>מזהה פרויקט: {projectId}</p>
      </div>
    </div>
  );
};

// Helper functions for Hebrew labels
const getMetricLabel = (metricType: string): string => {
  const labels: { [key: string]: string } = {
    'far': 'יחס שטח בנוי',
    'employment': 'תעסוקה',
    'units_total': 'סה״כ יחידות',
    'height_avg': 'גובה ממוצע',
    'coverage': 'אחוז כיסוי',
    'public_services': 'שירותי ציבור'
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

export default PublicAllocationDashboard;