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
  return (
    <div id="ai-controls">
      <h3>יוצר בניינים חכם</h3>
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
  );
};

export default AIControls;