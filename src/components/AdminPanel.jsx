import React, { useState } from 'react';
import ModelUploader from './ModelUploader';
import './AdminPanel.css';

const AdminPanel = () => {
  const [showUploader, setShowUploader] = useState(false);

  return (
    <>
      <div className="admin-panel">
        <h3>🔧 ניהול מערכת</h3>
        <button 
          className="admin-btn upload-btn"
          onClick={() => setShowUploader(true)}
        >
          📦 העלה דגם 3D
        </button>
      </div>

      {showUploader && (
        <ModelUploader onClose={() => setShowUploader(false)} />
      )}
    </>
  );
};

export default AdminPanel;