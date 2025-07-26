import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BuildingPlan } from '../types/plan.types';
import { planService } from '../services/planService';
import './MetricsPanel.css';

interface MetricsPanelProps {
  plan: BuildingPlan | null;
  comparisonPlan?: BuildingPlan | null;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ 
  plan, 
  comparisonPlan 
}) => {
  const [detailedPlan, setDetailedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!plan) {
      setDetailedPlan(null);
      return;
    }

    const loadMetrics = async () => {
      setLoading(true);
      try {
        const result = await planService.getPlanWithDetails(plan.id);
        if (result.success && result.data) {
          setDetailedPlan(result.data);
        }
      } catch (error) {
        console.error('Error loading metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [plan]);

  if (!plan) {
    return (
      <div className="metrics-panel empty">
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <h3>בחר תוכנית</h3>
          <p>בחר תוכנית כדי לראות את המדדים שלה</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="metrics-panel loading">
        <div className="panel-header">
          <h3>מדדי תוכנית</h3>
        </div>
        <div className="loading-content">
          <div className="skeleton-loader" />
          <div className="skeleton-loader" />
          <div className="skeleton-loader" />
        </div>
      </div>
    );
  }

  const metrics = detailedPlan?.metrics || {};
  const landUseData = detailedPlan?.landUse || [];
  
  const LAND_USE_COLORS = {
    residential: '#4CAF50',
    commercial: '#2196F3', 
    industrial: '#FF9800',
    mixed_use: '#9C27B0',
    public: '#F44336',
    open_space: '#8BC34A',
    parking: '#607D8B'
  };

  const formatNumber = (value: number | undefined, decimals = 1): string => {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString('he-IL', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    });
  };

  const getMetricTrend = (current: number, comparison?: number) => {
    if (!comparison || comparison === 0) return null;
    const change = ((current - comparison) / comparison) * 100;
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
      percentage: Math.abs(change)
    };
  };

  return (
    <motion.div 
      className="metrics-panel"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="panel-header">
        <h3>📊 מדדי תוכנית</h3>
        <div className="plan-info">
          <span className="plan-name">{plan.plan_name}</span>
          <span className="plan-type">{plan.plan_type}</span>
        </div>
      </div>
      
      <div className="metrics-grid">
        <MetricCard 
          title="יחס שטח בנוי"
          value={metrics.floor_area_ratio || 0}
          unit="FAR"
          icon="🏢"
          trend={comparisonPlan ? getMetricTrend(metrics.floor_area_ratio, comparisonPlan.metrics?.floor_area_ratio) : null}
        />
        <MetricCard 
          title="צפיפות"
          value={metrics.density || 0}
          unit="יח'/הקטר"
          icon="🏘️"
          trend={comparisonPlan ? getMetricTrend(metrics.density, comparisonPlan.metrics?.density) : null}
        />
        <MetricCard 
          title="סה״כ יחידות"
          value={metrics.total_units || 0}
          unit="יח״ד"
          icon="🏠"
          trend={comparisonPlan ? getMetricTrend(metrics.total_units, comparisonPlan.metrics?.total_units) : null}
        />
        <MetricCard 
          title="גובה ממוצע"
          value={metrics.avg_height || 0}
          unit="מ׳"
          icon="📏"
          trend={comparisonPlan ? getMetricTrend(metrics.avg_height, comparisonPlan.metrics?.avg_height) : null}
        />
        <MetricCard 
          title="מספר בניינים"
          value={metrics.total_buildings || 0}
          unit="בניינים"
          icon="🏗️"
        />
        <MetricCard 
          title="שטח רצפה כולל"
          value={metrics.total_floor_area || 0}
          unit="מ״ר"
          icon="📐"
          decimals={0}
        />
      </div>

      {landUseData.length > 0 && (
        <div className="land-use-section">
          <h4>🗺️ פילוח שימושי קרקע</h4>
          <div className="land-use-chart">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={landUseData}
                  dataKey="percentage"
                  nameKey="land_use_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={30}
                  paddingAngle={2}
                >
                  {landUseData.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={LAND_USE_COLORS[entry.land_use_type as keyof typeof LAND_USE_COLORS] || '#666'} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}%`,
                    getLandUseLabel(name)
                  ]}
                />
                <Legend 
                  formatter={(value) => getLandUseLabel(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="land-use-breakdown">
            {landUseData.map((item: any, index: number) => (
              <div key={index} className="land-use-item">
                <div 
                  className="land-use-color"
                  style={{ 
                    backgroundColor: LAND_USE_COLORS[item.land_use_type as keyof typeof LAND_USE_COLORS] || '#666'
                  }}
                />
                <span className="land-use-label">{getLandUseLabel(item.land_use_type)}</span>
                <span className="land-use-value">
                  {item.percentage.toFixed(1)}% ({formatNumber(item.area_sqm, 0)} מ״ר)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {comparisonPlan && (
        <div className="comparison-section">
          <h4>⚖️ השוואה עם {comparisonPlan.plan_name}</h4>
          <div className="comparison-metrics">
            {/* Comparison metrics implementation */}
          </div>
        </div>
      )}
    </motion.div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: number;
  unit: string;
  icon: string;
  trend?: { direction: 'up' | 'down' | 'same'; percentage: number } | null;
  decimals?: number;
}> = ({ title, value, unit, icon, trend, decimals = 1 }) => (
  <motion.div 
    className="metric-card"
    whileHover={{ scale: 1.02, y: -2 }}
    transition={{ duration: 0.2 }}
  >
    <div className="metric-header">
      <span className="metric-icon">{icon}</span>
      <span className="metric-title">{title}</span>
    </div>
    <div className="metric-value">
      <span className="value">
        {value.toLocaleString('he-IL', { 
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals 
        })}
      </span>
      <span className="unit">{unit}</span>
      {trend && trend.direction !== 'same' && (
        <span className={`trend ${trend.direction}`}>
          {trend.direction === 'up' ? '↗' : '↘'} {trend.percentage.toFixed(1)}%
        </span>
      )}
    </div>
  </motion.div>
);

const getLandUseLabel = (type: string): string => {
  const labels = {
    residential: 'מגורים',
    commercial: 'מסחר',
    industrial: 'תעשייה',
    mixed_use: 'שימוש מעורב',
    public: 'ציבורי',
    open_space: 'שטח פתוח',
    parking: 'חניות'
  };
  return labels[type as keyof typeof labels] || type;
};