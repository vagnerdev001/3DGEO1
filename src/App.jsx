import { useEffect, useRef, useState } from 'react';
import CesiumViewer from './components/CesiumViewer';
import AIControls from './components/AIControls';
import DataFormModal from './components/DataFormModal';
import LayerSwitcher from './components/LayerSwitcher';
import { buildingService } from './services/supabase';
import './App.css';

function App() {
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeShapePoints, setActiveShapePoints] = useState([]);
  const [extrudedBuilding, setExtrudedBuilding] = useState(null);
  const [currentBuildingId, setCurrentBuildingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Click 'Start Drawing' to create a building footprint.");
  const [showDataForm, setShowDataForm] = useState(false);
  const [aiCommand, setAiCommand] = useState('');
  const [currentLayer, setCurrentLayer] = useState('osm');
  const viewerRef = useRef(null);

  const handleDrawingStateChange = (drawing, points, building, buildingId, message) => {
    setIsDrawing(drawing);
    setActiveShapePoints(points);
    setExtrudedBuilding(building);
    setCurrentBuildingId(buildingId);
    setStatusMessage(message);
  };

  const handleStartDrawing = () => {
    if (viewerRef.current) {
      if (isDrawing) {
        // Stop/Cancel drawing
        viewerRef.current.cancelDrawing();
      } else {
        // Start drawing
        viewerRef.current.startDrawing();
      }
    }
  };

  const handleBuildingClick = (buildingEntity) => {
    setCurrentBuildingId(buildingEntity.id);
    setShowDataForm(true);
  };

  const handleCreateBuilding = async () => {
    if (activeShapePoints.length < 3) {
      alert('Please draw a valid building footprint first.');
      return;
    }
    if (!aiCommand) {
      alert('Please enter a command for the AI.');
      return;
    }

    setStatusMessage('AI is thinking...');

    try {
      const height = await getExtrusionHeightFromAI(aiCommand);
      if (height !== null && viewerRef.current) {
        const viewer = viewerRef.current;
        
        if (extrudedBuilding) {
          viewer.entities.remove(extrudedBuilding);
        }
        
        const buildingId = `building-${new Date().getTime()}`;

        const building = viewer.entities.add({
          id: buildingId,
          isBuilding: true,
          polygon: {
            hierarchy: new window.Cesium.PolygonHierarchy(activeShapePoints),
            extrudedHeight: height,
            material: window.Cesium.Color.YELLOW.withAlpha(0.9),
            outline: true,
            outlineColor: window.Cesium.Color.BLACK
          }
        });

        setExtrudedBuilding(building);
        setCurrentBuildingId(buildingId);
        setStatusMessage(`Building created with height: ${height}m.`);
        
        // Save building geometry and AI command to database
        await buildingService.saveBuilding(
          buildingId, 
          {
            height: height,
            ai_command: aiCommand
          },
          activeShapePoints.map(point => ({
            longitude: window.Cesium.Math.toDegrees(window.Cesium.Cartographic.fromCartesian(point).longitude),
            latitude: window.Cesium.Math.toDegrees(window.Cesium.Cartographic.fromCartesian(point).latitude),
            height: window.Cesium.Cartographic.fromCartesian(point).height
          })),
          aiCommand,
          height
        );
        
        setShowDataForm(true);
        setActiveShapePoints([]);
        setAiCommand('');
      } else {
        setStatusMessage('AI could not determine a height.');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setStatusMessage('Error communicating with AI.');
    }
  };

  const getExtrusionHeightFromAI = async (userCommand) => {
    const geminiApiKey = 'AIzaSyD7he1t-eLRUPOjUvbSfImIBLhKelaoQbw';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    const prompt = `You are an assistant for a 3D mapping application. The user has provided an instruction to create a building. Your task is to determine the final height of the building in meters. Assume a standard floor is 3.5 meters high if the user specifies floors. Respond with ONLY the numerical value for the total height in meters. For example, if the user says 'make it 10 stories tall', you should respond with '35'. If the user says 'extrude to 100 feet', you should respond with '30.48'. If the user says 'build it 50 meters high', you should respond with '50'. User instruction: '${userCommand}'`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.error("API Error Response:", await response.text());
      return null;
    }
    
    const result = await response.json();
    if (result.candidates && result.candidates[0]?.content?.parts[0]) {
      const text = result.candidates[0].content.parts[0].text;
      const height = parseFloat(text.trim());
      return isNaN(height) ? null : height;
    }
    return null;
  };

  return (
    <div className="app">
      <CesiumViewer
        ref={viewerRef}
        isDrawing={isDrawing}
        activeShapePoints={activeShapePoints}
        currentLayer={currentLayer}
        onDrawingStateChange={handleDrawingStateChange}
        onBuildingClick={handleBuildingClick}
      />
      <AIControls
        isDrawing={isDrawing}
        statusMessage={statusMessage}
        aiCommand={aiCommand}
        onAiCommandChange={setAiCommand}
        onStartDrawing={handleStartDrawing}
        onCreateBuilding={handleCreateBuilding}
        canCreate={activeShapePoints.length >= 3 && !isDrawing}
      />
      <LayerSwitcher
        currentLayer={currentLayer}
        onLayerChange={setCurrentLayer}
      />
      {showDataForm && (
        <DataFormModal
          buildingId={currentBuildingId}
          onClose={() => {
            setShowDataForm(false);
            setCurrentBuildingId(null);
          }}
          onSave={(message) => setStatusMessage(message)}
        />
      )}
    </div>
  );
}

export default App;