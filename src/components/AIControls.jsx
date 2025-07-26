import { useState } from 'react';
import './AIControls.css';

const AIControls = ({ 
  isDrawing, 
  statusMessage, 
  aiCommand, 
  onAiCommandChange, 
  onStartDrawing, 
  onCreateBuilding, 
  canCreate 
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div id="ai-controls" className={isMinimized ? 'minimized' : ''}>
      <div className="panel-header">
        <h3>🏗️ יוצר בניינים חכם</h3>
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
            onClick={() => setIsVisible(false)}
            title="הסתר"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="panel-content">
        <button 
          id="draw-button" 
          className={isDrawing ? 'drawing' : ''}
          onClick={onStartDrawing}
        >
          {isDrawing ? 'סיים ציור' : 'התחל ציור'}
        </button>
        <p id="status-message">{statusMessage}</p>
        <input 
          type="text" 
          id="ai-command" 
          placeholder="לדוגמה: 'תעשה אותו בגובה 15 קומות'"
          value={aiCommand}
          onChange={(e) => onAiCommandChange(e.target.value)}
        />
        <button 
          id="create-button" 
          disabled={!canCreate}
          onClick={onCreateBuilding}
        >
          צור בניין
        </button>
      </div>
    </div>
  );
};

export default AIControls;