import React from 'react';
import './BuildingPopup.css';

const BuildingPopup = ({ building, position, onEdit, onClose, onEmbed }) => {
  if (!building || !position) return null;

  const handleEdit = () => {
    onEdit(building);
    onClose();
  };

  const handleEmbed = () => {
    onEmbed(building);
    onClose();
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
      
      <div className="popup-actions">
        <button className="edit-button" onClick={handleEdit}>
          ✏️ ערוך בניין
        </button>
        <button className="embed-button" onClick={handleEmbed}>
          🖼️ הצג הטמעה
        </button>
      </div>
    </div>
  );
};

export default BuildingPopup;