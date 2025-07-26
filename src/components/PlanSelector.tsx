import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BuildingPlan } from '../types/plan.types';
import './PlanSelector.css';

interface PlanSelectorProps {
  plans: BuildingPlan[];
  selectedPlan: BuildingPlan | null;
  onPlanChange: (plan: BuildingPlan) => void;
  compareMode?: boolean;
  onCompareToggle?: () => void;
  loading?: boolean;
}

export const PlanSelector: React.FC<PlanSelectorProps> = ({
  plans,
  selectedPlan,
  onPlanChange,
  compareMode = false,
  onCompareToggle,
  loading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlans = plans.filter(plan =>
    plan.plan_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.plan_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePlanSelect = (plan: BuildingPlan) => {
    onPlanChange(plan);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getPlanTypeIcon = (type: string) => {
    switch (type) {
      case 'baseline': return '📋';
      case 'alternative': return '🔄';
      case 'proposed': return '📝';
      case 'approved': return '✅';
      default: return '📄';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#ffa726';
      case 'review': return '#42a5f5';
      case 'approved': return '#66bb6a';
      case 'archived': return '#bdbdbd';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <div className="plan-selector loading">
        <div className="selector-trigger disabled">
          <div className="loading-spinner" />
          <span>טוען תוכניות...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="plan-selector">
      <div className="selector-header">
        <button
          className="selector-trigger"
          onClick={() => setIsOpen(!isOpen)}
          disabled={plans.length === 0}
        >
          <span className="plan-icon">🏗️</span>
          <div className="selected-plan-info">
            <span className="selected-plan-name">
              {selectedPlan?.plan_name || 'בחר תוכנית'}
            </span>
            {selectedPlan && (
              <span className="selected-plan-type">
                {getPlanTypeIcon(selectedPlan.plan_type)} {selectedPlan.plan_type}
              </span>
            )}
          </div>
          <span className={`chevron ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>
        
        {onCompareToggle && plans.length > 1 && (
          <button
            className={`compare-toggle ${compareMode ? 'active' : ''}`}
            onClick={onCompareToggle}
            title="השווה תוכניות"
          >
            ⚖️ השווה
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="plan-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {plans.length > 3 && (
              <div className="plan-search-container">
                <input
                  type="text"
                  placeholder="חפש תוכניות..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="plan-search"
                  autoFocus
                />
              </div>
            )}
            
            <div className="plan-list">
              {filteredPlans.length === 0 ? (
                <div className="no-plans">
                  {searchTerm ? 'לא נמצאו תוכניות' : 'אין תוכניות זמינות'}
                </div>
              ) : (
                filteredPlans.map((plan) => (
                  <motion.button
                    key={plan.id}
                    className={`plan-item ${selectedPlan?.id === plan.id ? 'selected' : ''}`}
                    onClick={() => handlePlanSelect(plan)}
                    whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="plan-item-content">
                      <div className="plan-main-info">
                        <span className="plan-type-icon">
                          {getPlanTypeIcon(plan.plan_type)}
                        </span>
                        <div className="plan-text-info">
                          <span className="plan-name">{plan.plan_name}</span>
                          <span className="plan-type-text">{plan.plan_type}</span>
                        </div>
                      </div>
                      <div className="plan-meta">
                        <span 
                          className="plan-status"
                          style={{ color: getStatusColor(plan.status) }}
                        >
                          {plan.status}
                        </span>
                        {plan.metrics?.total_units && (
                          <span className="plan-units">
                            {plan.metrics.total_units} יח"ד
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedPlan?.id === plan.id && (
                      <span className="check-icon">✓</span>
                    )}
                  </motion.button>
                ))
              )}
            </div>
            
            {plans.length > 0 && (
              <div className="plan-dropdown-footer">
                <span className="plan-count">
                  {filteredPlans.length} מתוך {plans.length} תוכניות
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};