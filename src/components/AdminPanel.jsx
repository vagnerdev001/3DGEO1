import React, { useState } from 'react';
import ModelUploader from './ModelUploader';
import './AdminPanel.css';

const AdminPanel = ({ onToggle }) => {
  const [showUploader, setShowUploader] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

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
        </div>
      </div>

      {showUploader && (
        <ModelUploader onClose={() => setShowUploader(false)} />
      )}
    </>
  );
};

export default AdminPanel;