import React from 'react';
import './EmbedPopup.css';

const EmbedPopup = ({ url, onClose }) => {
  if (!url) return null;

  return (
    <div className="embed-popup-overlay">
      <div className="embed-popup">
        <div className="embed-popup-header">
          <h3>Embedded Content</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="embed-popup-content">
          <iframe src={url} title="Embedded Content" />
        </div>
      </div>
    </div>
  );
};

export default EmbedPopup;
