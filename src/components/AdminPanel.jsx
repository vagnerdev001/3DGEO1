import React, { useState } from 'react';
import ModelUploader from './ModelUploader';
import './AdminPanel.css';

const AdminPanel = ({ onToggle, onWidgetVisibilityChange, widgetVisibility }) => {
  const [showUploader, setShowUploader] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleWidgetToggle = (widgetName, isVisible) => {
    onWidgetVisibilityChange(widgetName, isVisible);
  };

  return (
    <>
      <div className={`admin-panel ${isMinimized ? 'minimized' : ''}`}>
        <div className="panel-header">
          <h3>🔧 ניהול מערכת</h3>
          <div className="panel-controls">
            <button 
              className="panel-btn minimize-btn"
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? 'הרחב' : 'הקטן'}
            >
              ▼
            </button>
            <button 
              className="panel-btn"
              onClick={() => onToggle && onToggle(false)}
              title="הסתר"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="panel-content">
          <button 
            className="admin-btn upload-btn"
            onClick={() => setShowUploader(true)}
          >
            📦 העלה דגם 3D
          </button>
          
          <div className="widget-controls">
            <h4>בקרת חלונות</h4>
            
            <label className="widget-checkbox">
              <input
                type="checkbox"
                checked={widgetVisibility.objectPlacer}
                onChange={(e) => handleWidgetToggle('objectPlacer', e.target.checked)}
              />
              <span>🎯 מציב אובייקטים</span>
            </label>
            
            <label className="widget-checkbox">
              <input
                type="checkbox"
                checked={widgetVisibility.layerSwitcher}
                onChange={(e) => handleWidgetToggle('layerSwitcher', e.target.checked)}
              />
              <span>🗺️ שכבות מפה</span>
            </label>
            
            <label className="widget-checkbox">
              <input
                type="checkbox"
                checked={widgetVisibility.plansDashboard}
                onChange={(e) => handleWidgetToggle('plansDashboard', e.target.checked)}
              />
              <span>🏗️ לוח תוכניות</span>
            </label>
          </div>
        </div>
      </div>

      {showUploader && (
        <ModelUploader onClose={() => setShowUploader(false)} />
      )}
    </>
  );
};

export default AdminPanel;