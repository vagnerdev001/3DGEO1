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
    console.log('🔄 APP: Drawing state change:', { 
      drawing, 
      pointsCount: points.length, 
      message,
      isDrawingNow: drawing
    });
    setIsDrawing(drawing);
    setActiveShapePoints(points);
    setExtrudedBuilding(building);
    setCurrentBuildingId(buildingId);
    setStatusMessage(message);
  };

  const handleStartDrawing = () => {
    console.log('🔘 BUTTON: Start/Finish drawing clicked');
    console.log('Current state - isDrawing:', isDrawing, 'activeShapePoints:', activeShapePoints.length);
    
    if (viewerRef.current) {
      if (isDrawing) {
        console.log('🔴 Finishing current drawing...');
        viewerRef.current.finishDrawing();
      } else {
        console.log('🟢 Starting new drawing session...');
        viewerRef.current.startDrawing();
        // Reset local state when starting new drawing
        setActiveShapePoints([]);
        setAiCommand('');
      }
    }
  };

  const handleBuildingClick = (buildingEntity) => {
    console.log('Building clicked:', buildingEntity.id);
    setCurrentBuildingId(buildingEntity.id);
    setShowDataForm(true);
  };
    console.log('Viewer points:', viewerPoints.length);
    console.log('🏗️ CREATE BUILDING CLICKED');
    const pointsToUse = activeShapePoints.length > 0 ? activeShapePoints : viewerPoints;
    console.log('✅ Points to use for building:', pointsToUse.length);

    if (activeShapePoints.length < 3) {
      console.error('❌ Not enough points for building creation');
      alert('Please draw a valid building footprint first.');
      return;
    }
    
    if (!aiCommand.trim()) {
      console.error('❌ No AI command provided');
      alert('Please enter a command for the AI.');
      return;
    }

    setStatusMessage('AI is thinking...');

    try {
      console.log('Calling AI with command:', aiCommand);
      const height = await getExtrusionHeightFromAI(aiCommand);
      console.log('AI returned height:', height);
      
      if (height !== null && viewerRef.current) {
        const viewer = viewerRef.current.viewer;
        
        // Remove existing building if any
        if (extrudedBuilding) {
          viewer.entities.remove(extrudedBuilding);
        }
        
        const buildingId = `building-${new Date().getTime()}`;
        console.log('Creating building with ID:', buildingId);

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

        console.log('Building entity created:', building);
        setExtrudedBuilding(building);
        setCurrentBuildingId(buildingId);
        
        // Save building geometry and AI command to database
        console.log('Saving to database...');
        const geometryPoints = activeShapePoints.map(point => ({
          longitude: window.Cesium.Math.toDegrees(window.Cesium.Cartographic.fromCartesian(point).longitude),
          latitude: window.Cesium.Math.toDegrees(window.Cesium.Cartographic.fromCartesian(point).latitude),
          height: window.Cesium.Cartographic.fromCartesian(point).height
        }));
        
        const saveResult = await buildingService.saveBuilding(
          buildingId, 
          {
            height: height,
            ai_command: aiCommand
          },
          geometryPoints,
          aiCommand,
          height
        );
        
        if (saveResult.success) {
          console.log('Building saved successfully');
          setStatusMessage(`Building created and saved! Height: ${height}m`);
        } else {
          console.error('Save failed:', saveResult.error);
          setStatusMessage(`Building created but save failed: ${saveResult.error}`);
        }
        
        // Clear drawing state and show data form
        viewerRef.current.clearAll();
        setActiveShapePoints([]);
        setAiCommand('');
        setIsDrawing(false);
        setShowDataForm(true);
        
      } else {
        console.error('Failed to create building - no height or viewer');
        setStatusMessage('AI could not determine a height or viewer not available.');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setStatusMessage('Error communicating with AI.');
    }
  };

  const getExtrusionHeightFromAI = async (userCommand) => {
    console.log('Calling Gemini API with command:', userCommand);
    const geminiApiKey = 'AIzaSyD7he1t-eLRUPOjUvbSfImIBLhKelaoQbw';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    const prompt = `You are an assistant for a 3D mapping application. The user has provided an instruction to create a building. Your task is to determine the final height of the building in meters. Assume a standard floor is 3.5 meters high if the user specifies floors. Respond with ONLY the numerical value for the total height in meters. For example, if the user says 'make it 10 stories tall', you should respond with '35'. If the user says 'extrude to 100 feet', you should respond with '30.48'. If the user says 'build it 50 meters high', you should respond with '50'. User instruction: '${userCommand}'`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        return null;
      }
      
      const result = await response.json();
      console.log('Gemini API response:', result);
      
      if (result.candidates && result.candidates[0]?.content?.parts[0]) {
        const text = result.candidates[0].content.parts[0].text;
        const height = parseFloat(text.trim());
        console.log('Parsed height:', height);
        return isNaN(height) ? null : height;
      }
      return null;
    } catch (error) {
      console.error('Fetch error:', error);
      return null;
    }
  };

  // Debug: Log state changes
  useEffect(() => {
    const hasPolygon = activeShapePoints.length >= 3;
    const hasCommand = aiCommand.trim().length > 0;
    const canCreate = hasPolygon && !isDrawing && hasCommand;
    
    console.log('=== APP STATE UPDATE ===');
    console.log('- isDrawing:', isDrawing);
    console.log('- activeShapePoints:', activeShapePoints.length);
    console.log('- hasPolygon:', hasPolygon);
    console.log('- hasCommand:', hasCommand);
    console.log('- canCreate:', canCreate);
    console.log('========================');
  }, [isDrawing, activeShapePoints, aiCommand]);

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
        canCreate={activeShapePoints.length >= 3 && !isDrawing && aiCommand.trim().length > 0}
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