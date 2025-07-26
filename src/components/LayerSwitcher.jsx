import React from 'react';
import './LayerSwitcher.css';

const LayerSwitcher = ({ currentLayer, onLayerChange }) => {
  const layers = [
    { id: 'osm', name: 'OpenStreetMap' },
    { id: 'aerial', name: 'Aerial' },
    { id: 'f4', name: 'F4 Map' }
  ];

  return (
    <div className="layer-switcher">
      <h4>Map Layers</h4>
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
    </div>
  );
};

export default LayerSwitcher;