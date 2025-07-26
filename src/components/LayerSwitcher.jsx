import React, { useState } from 'react';
import './LayerSwitcher.css';

const LayerSwitcher = ({ currentLayer, onLayerChange, onToggle }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const layers = [
    { id: 'osm', name: 'מפת רחובות' },
    { id: 'aerial', name: 'תצלום אווירי' },
    { id: 'f4', name: 'מפת F4' }
  ];

  return (
    <div className={`layer-switcher ${isMinimized ? 'minimized' : ''}`}>
      <div className="panel-header">
        <h4>🗺️ שכבות מפה</h4>
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
        {layers.map(layer => (
          <label key={layer.id} className="layer-option">
            <input
              type="radio"
              name="layer"
              value={layer.id}
              checked={currentLayer === layer.id}
              onChange={(e) => onLayerChange(e.target.value)}
            />
            <span>{layer.name}</span>
          </label>
        ))}
        
        <div className="layer-separator"></div>
        <h4>שכבות נוספות</h4>
        <label className="layer-option">
          <input
            type="checkbox"
            name="customBuildings"
            defaultChecked={true}
            onChange={(e) => onLayerChange('customBuildings', e.target.checked)}
          />
          <span>מבנים נוספים</span>
        </label>
      </div>
    </div>
  );
};

export default LayerSwitcher;