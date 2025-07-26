import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimePlans } from '../hooks/useRealtimePlans';
import { PlanSelector } from './PlanSelector';
import { MetricsPanel } from './MetricsPanel';
import { BuildingPlan } from '../types/plan.types';
import { planService } from '../services/planService';
import './UrbanPlansDashboard.css';

interface UrbanPlansDashboardProps {
  projectId: string;
  onClose?: () => void;
}

export const UrbanPlansDashboard: React.FC<UrbanPlansDashboardProps> = ({ 
  projectId,
  onClose 
}) => {
  const { plans, selectedPlan, selectPlan, syncStatus, loading } = useRealtimePlans({ 
    projectId 
  });
  const [compareMode, setCompareMode] = useState(false);
  const [comparisonPlans, setComparisonPlans] = useState<string[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [showCreatePlan, setShowCreatePlan] = useState(false);

  const handlePlanSelection = (plan: BuildingPlan) => {
    if (compareMode) {
      setComparisonPlans(prev => {
        if (prev.includes(plan.id)) {
          return prev.filter(id => id !== plan.id);
        }
        return [...prev, plan.id].slice(-2); // Max 2 plans for comparison
      });
    } else {
      selectPlan(plan);
    }
  };

  const handleCreatePlan = async (planData: Partial<BuildingPlan>) => {
    try {
      const result = await planService.createPlan({
        ...planData,
        project_id: projectId
      });
      
      if (result.success && result.data) {
        selectPlan(result.data);
        setShowCreatePlan(false);
      }
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  const getComparisonPlan = (): BuildingPlan | undefined => {
    if (compareMode && comparisonPlans.length > 0) {
      return plans.find(p => p.id === comparisonPlans[0]);
    }
    return undefined;
  };

  return (
    <div className="urban-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🏗️ לוח בקרת תוכניות עירוניות</h1>
          <div className={`sync-status ${syncStatus}`}>
            <span className="status-indicator" />
            <span className="status-text">
              {syncStatus === 'connected' ? 'מחובר' : 
               syncStatus === 'connecting' ? 'מתחבר...' : 'לא מחובר'}
            </span>
          </div>
        </div>
        
        <div className="header-controls">
          <PlanSelector
            plans={plans}
            selectedPlan={selectedPlan}
            onPlanChange={handlePlanSelection}
            compareMode={compareMode}
            onCompareToggle={() => setCompareMode(!compareMode)}
            loading={loading}
          />
          
          <button
            className="create-plan-btn"
            onClick={() => setShowCreatePlan(true)}
          >
            ➕ תוכנית חדשה
          </button>
          
          {onClose && (
            <button
              className="close-dashboard-btn"
              onClick={onClose}
            >
              ✕
            </button>
          )}
        </div>
      </header>

      <div className="dashboard-layout">
        <aside className="left-panel">
          <MetricsPanel 
            plan={selectedPlan} 
            comparisonPlan={getComparisonPlan()}
          />
          
          {selectedBuilding && (
            <div className="building-details-panel">
              <h4>פרטי בניין</h4>
              <button onClick={() => setSelectedBuilding(null)}>✕</button>
              {/* Building details implementation */}
            </div>
          )}
        </aside>

        <main className="main-content">
          {loading ? (
            <div className="loading-main">
              <div className="loading-spinner-large" />
              <p>טוען תוכניות...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="empty-main">
              <div className="empty-state-large">
                <span className="empty-icon-large">🏗️</span>
                <h2>אין תוכניות זמינות</h2>
                <p>צור תוכנית חדשה כדי להתחיל</p>
                <button
                  className="create-first-plan-btn"
                  onClick={() => setShowCreatePlan(true)}
                >
                  צור תוכנית ראשונה
                </button>
              </div>
            </div>
          ) : compareMode && comparisonPlans.length > 0 ? (
            <div className="comparison-view">
              <h3>השוואת תוכניות</h3>
              <div className="comparison-grid">
                {comparisonPlans.map(planId => {
                  const plan = plans.find(p => p.id === planId);
                  return plan ? (
                    <div key={planId} className="comparison-item">
                      <h4>{plan.plan_name}</h4>
                      <MetricsPanel plan={plan} />
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          ) : selectedPlan ? (
            <div className="plan-view">
              <div className="plan-header">
                <h2>{selectedPlan.plan_name}</h2>
                <div className="plan-meta">
                  <span className="plan-type">{selectedPlan.plan_type}</span>
                  <span className="plan-status">{selectedPlan.status}</span>
                </div>
              </div>
              
              <div className="plan-content">
                <div className="plan-visualization">
                  {/* 3D visualization will be integrated here */}
                  <div className="visualization-placeholder">
                    <span>🗺️</span>
                    <p>תצוגת תוכנית תלת-ממדית</p>
                    <small>יוטמע עם מפת Cesium הקיימת</small>
                  </div>
                </div>
                
                {selectedPlan.description && (
                  <div className="plan-description">
                    <h4>תיאור התוכנית</h4>
                    <p>{selectedPlan.description}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <div className="no-selection-state">
                <span className="no-selection-icon">👆</span>
                <h3>בחר תוכנית</h3>
                <p>בחר תוכנית מהרשימה למעלה כדי לראות את הפרטים</p>
              </div>
            </div>
          )}
        </main>

        <aside className="right-panel">
          <div className="tools-panel">
            <h4>🛠️ כלים</h4>
            <div className="tool-buttons">
              <button className="tool-btn">📏 מדידות</button>
              <button className="tool-btn">📊 דוחות</button>
              <button className="tool-btn">💾 ייצא נתונים</button>
              <button className="tool-btn">🔄 סנכרן</button>
            </div>
          </div>
          
          <div className="recent-activity">
            <h4>📋 פעילות אחרונה</h4>
            <div className="activity-list">
              <div className="activity-item">
                <span className="activity-time">לפני 5 דקות</span>
                <span className="activity-text">תוכנית עודכנה</span>
              </div>
              <div className="activity-item">
                <span className="activity-time">לפני שעה</span>
                <span className="activity-text">מדדים חושבו מחדש</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Create Plan Modal */}
      <AnimatePresence>
        {showCreatePlan && (
          <CreatePlanModal
            onClose={() => setShowCreatePlan(false)}
            onCreate={handleCreatePlan}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Create Plan Modal Component
const CreatePlanModal: React.FC<{
  onClose: () => void;
  onCreate: (planData: Partial<BuildingPlan>) => void;
}> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    plan_name: '',
    plan_type: 'alternative' as const,
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.plan_name.trim()) {
      onCreate(formData);
    }
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>צור תוכנית חדשה</h3>
          <button onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="create-plan-form">
          <div className="form-group">
            <label>שם התוכנית</label>
            <input
              type="text"
              value={formData.plan_name}
              onChange={(e) => setFormData(prev => ({ ...prev, plan_name: e.target.value }))}
              placeholder="הכנס שם לתוכנית..."
              required
            />
          </div>
          
          <div className="form-group">
            <label>סוג תוכנית</label>
            <select
              value={formData.plan_type}
              onChange={(e) => setFormData(prev => ({ ...prev, plan_type: e.target.value as any }))}
            >
              <option value="baseline">תוכנית בסיס</option>
              <option value="alternative">תוכנית חלופית</option>
              <option value="proposed">תוכנית מוצעת</option>
              <option value="approved">תוכנית מאושרת</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>תיאור (אופציונלי)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="תאר את התוכנית..."
              rows={3}
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" className="create-btn">
              צור תוכנית
            </button>
            <button type="button" onClick={onClose} className="cancel-btn">
              ביטול
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};