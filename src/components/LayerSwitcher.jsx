import React from 'react';
import './LayerSwitcher.css';

const LayerSwitcher = ({ currentLayer, onLayerChange }) => {
  const layers = [
    { id: 'osm', name: 'מפת רחובות' },
    { id: 'aerial', name: 'תצלום אווירי' },
    { id: 'f4', name: 'מפת F4' }
  ];

  return (
    <div className="layer-switcher">
      <h4>שכבות מפה</h4>
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
  );
};

export default LayerSwitcher;