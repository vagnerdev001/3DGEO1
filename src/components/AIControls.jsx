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
      <h3>AI Building Creator</h3>
      <button 
        id="draw-button" 
        className={isDrawing ? 'drawing' : ''}
        onClick={onStartDrawing}
      >
        {isDrawing ? 'Finish Drawing' : 'Start Drawing'}
      </button>
      <p id="status-message">{statusMessage}</p>
      <input 
        type="text" 
        id="ai-command" 
        placeholder="e.g., 'Make it 15 floors high'"
        value={aiCommand}
        onChange={(e) => onAiCommandChange(e.target.value)}
      />
      <button 
        id="create-button" 
        disabled={!canCreate}
        onClick={onCreateBuilding}
      >
        Create Building
      </button>
    </div>
  );
};

export default AIControls;