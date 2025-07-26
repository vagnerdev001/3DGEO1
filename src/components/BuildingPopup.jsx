import React, { useState } from 'react';
import './BuildingPopup.css';

const BuildingPopup = ({ building, position, onEdit, onClose }) => {
  const [showEmbed, setShowEmbed] = useState(false);
  const [activePlan, setActivePlan] = useState('A');
  
  if (!building || !position) return null;

  const handleEdit = () => {
    onEdit(building);
    onClose();
  };

  const plans = [
    {
      id: 'A',
      name: 'תוכנית A',
      icon: '🏢',
      description: 'תוכנית בסיסית - מבנה קלאסי'
    },
    {
      id: 'B', 
      name: 'תוכנית B',
      icon: '🏗️',
      description: 'תוכנית מתקדמת - עיצוב מודרני'
    },
    {
      id: 'C',
      name: 'תוכנית C', 
      icon: '🌟',
      description: 'תוכנית פרימיום - טכנולוגיה ירוקה'
    }
  ];

  const renderPlanContent = (planId) => {
    const plan = plans.find(p => p.id === planId);
    return (
      <div className="plan-preview">
        <span className="plan-icon">{plan.icon}</span>
        <div>{plan.name}</div>
        <div className="plan-description">{plan.description}</div>
        <div className="coming-soon">בקרוב...</div>
      </div>
    );
  };

  return (
    <div 
      className="building-popup" 
      style={{
        left: position.x,
        top: position.y
      }}
    >
      <div className="popup-header">
        <h4>פרטי בניין</h4>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="popup-content">
        <div className="plans-carousel">
          <h5>📋 תוכניות בניין</h5>
          <div className="plans-tabs">
            {plans.map(plan => (
              <button
                key={plan.id}
                className={`plan-tab ${activePlan === plan.id ? 'active' : ''}`}
                onClick={() => setActivePlan(plan.id)}
              >
                {plan.name}
              </button>
            ))}
          </div>
          <div className="plan-content">
            {renderPlanContent(activePlan)}
          </div>
        </div>
        
        {building.weblink && (
          <div className="embed-section">
            <button 
              className="view-plans-btn"
              onClick={() => setShowEmbed(true)}
            >
              📋 צפה בתוכניות בניין
            </button>
          </div>
        )}
        
        <div className="metadata-section">
          <h5>📊 פרטי בניין</h5>
          <div className="popup-row">
            <span className="popup-label">כתובת:</span>
            <span className="popup-value">{building.full_addres_q || building.full_addresse || 'לא צוין'}</span>
          </div>
          
          <div className="popup-row">
            <span className="popup-label">מספר בניין:</span>
            <span className="popup-value">{building.bldg_num || 'לא צוין'}</span>
          </div>
          
          <div className="popup-row">
            <span className="popup-label">סוג בניין:</span>
            <span className="popup-value">{building.bldg_type || 'לא צוין'}</span>
          </div>
          
          <div className="popup-row">
            <span className="popup-label">קומות:</span>
            <span className="popup-value">{building.num_floors || building.no_floors || 'לא צוין'}</span>
          </div>
          
          <div className="popup-row">
            <span className="popup-label">גובה:</span>
            <span className="popup-value">{building.height ? `${building.height} מטר` : 'לא צוין'}</span>
          </div>
          
          {building.ai_command && (
            <div className="popup-row">
              <span className="popup-label">פקודת AI:</span>
              <span className="popup-value">{building.ai_command}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="popup-actions">
        <div style={{display: 'flex', gap: '10px'}}>
          <button className="edit-button" onClick={handleEdit}>
            ✏️ ערוך בניין
          </button>
          {building.weblink && (
            <button className="view-plans-btn" onClick={() => setShowEmbed(true)}>
              📋 צפה בתוכנית
            </button>
          )}
        </div>
      </div>
      
      {/* Embed Viewer Modal */}
      {showEmbed && building.weblink && (
        <div className="embed-overlay" onClick={() => setShowEmbed(false)}>
          <div className="embed-container" onClick={(e) => e.stopPropagation()}>
            <div className="embed-header">
              <h3>תוכניות בניין - {building.full_addres_q || 'לא צוין'}</h3>
              <button 
                className="embed-close-btn"
                onClick={() => setShowEmbed(false)}
              >
                ✕
              </button>
            </div>
            <iframe
              src={building.weblink}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              title="תוכניות בניין"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildingPopup;