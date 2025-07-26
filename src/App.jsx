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
  const [savedBuildings, setSavedBuildings] = useState([]);

  // Load saved buildings when component mounts
  useEffect(() => {
    loadSavedBuildings();
  }, []);

  const loadSavedBuildings = async () => {
    try {
      const result = await buildingService.getAllBuildings();
      if (result.success && result.data) {
        console.log('טוען בניינים שמורים:', result.data.length);
        setSavedBuildings(result.data);
        
        // Display buildings on the map
        if (viewerRef.current && viewerRef.current.viewer) {
          displaySavedBuildings(result.data);
        }
      }
    } catch (error) {
      console.error('שגיאה בטעינת בניינים:', error);
    }
  };

  const displaySavedBuildings = (buildings) => {
    if (!viewerRef.current || !viewerRef.current.viewer) return;
    
    const viewer = viewerRef.current.viewer;
    
    // Clear existing building entities to prevent duplicates - but preserve currently edited building
    const currentlyEditingId = currentBuildingId;
    const existingEntities = viewer.entities.values.filter(entity => 
      entity.id && entity.id.startsWith('building-') && entity.id !== currentlyEditingId
    );
    existingEntities.forEach(entity => {
      viewer.entities.remove(entity);
    });
    
    buildings.forEach(building => {
      if (building.geometry_points && building.geometry_points.length >= 3) {
        console.log('מציג בניין:', building.id);
        
        // If this is the currently edited building, remove it first to refresh with new colors
        if (building.id === currentlyEditingId) {
          const existingBuilding = viewer.entities.getById(building.id);
          if (existingBuilding) {
            viewer.entities.remove(existingBuilding);
          }
          // Also remove all floor entities for this building
          const floorEntities = viewer.entities.values.filter(entity => 
            entity.id && entity.id.startsWith(`${building.id}-floor-`)
          );
          floorEntities.forEach(entity => {
            viewer.entities.remove(entity);
          });
        }
        
        // Convert geometry points back to Cartesian3
        const points = building.geometry_points.map(point => 
          window.Cesium.Cartesian3.fromDegrees(
            point.longitude, 
            point.latitude, 
            point.height || 0
          )
        );
        
        const height = parseFloat(building.height) || 30;
        const floors = parseInt(building.num_floors) || parseInt(building.no_floors) || Math.max(1, Math.floor(height / 3.5));
        const floorColors = building.floor_colors || [];
        const transparency = 0.9; // Default transparency since it's not stored in DB
        
        createSavedBuilding(viewer, building.id, points, height, floors, floorColors, transparency);
      }
    });
  };

  const createSavedBuilding = (viewer, buildingId, points, totalHeight, numFloors, savedFloorColors, transparency = 0.9) => {
    console.log(`יוצר בניין שמור עם ${numFloors} קומות, גובה כולל: ${totalHeight}מ`);
    
    // Create rounded corners for the building footprint
    const roundedPoints = createRoundedCorners(points, 2.0);
    
    const floorHeight = totalHeight / numFloors;
    const building = viewer.entities.add({
      id: buildingId,
      isBuilding: true
    });
    
    // Use saved colors or generate new ones
    let floorColors;
    if (savedFloorColors && savedFloorColors.length === numFloors) {
      // Apply transparency to saved colors
      floorColors = savedFloorColors.map(colorHex => 
        window.Cesium.Color.fromCssColorString(colorHex).withAlpha(transparency)
      );
    } else {
      // Generate new colors with transparency
      floorColors = generateFloorColors(numFloors, transparency);
    }
    
    // Create each floor as a separate polygon
    for (let floor = 0; floor < numFloors; floor++) {
      const floorBottom = floor * floorHeight;
      const floorTop = (floor + 1) * floorHeight;
      
      viewer.entities.add({
        id: `${buildingId}-floor-${floor}`,
        parent: building,
        polygon: {
          hierarchy: new window.Cesium.PolygonHierarchy(roundedPoints),
          height: floorBottom,
          extrudedHeight: floorTop,
          material: floorColors[floor],
          outline: true,
          outlineColor: window.Cesium.Color.BLACK.withAlpha(0.3),
          outlineWidth: 1
        }
      });
    }
    
    return building;
  };

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
    console.log('🏢 Building clicked:', buildingEntity.id);
    setCurrentBuildingId(buildingEntity.id);
    setShowDataForm(true);
  };

  const handleCreateBuilding = async (viewerPoints) => {
    console.log('🏗️ CREATE BUILDING CLICKED');
    const pointsToUse = activeShapePoints.length > 0 ? activeShapePoints : viewerPoints;
    console.log('✅ Points to use for building:', pointsToUse.length);

    if (activeShapePoints.length < 3) {
      console.error('❌ Not enough points for building creation');
      alert('אנא צייר תחילה מתאר בניין תקין.');
      return;
    }
    
    if (!aiCommand.trim()) {
      console.error('❌ No AI command provided');
      alert('אנא הכנס פקודה עבור הבינה המלאכותית.');
      return;
    }

    setStatusMessage('הבינה המלאכותית חושבת...');

    try {
      console.log('Calling AI with command:', aiCommand);
      const buildingData = await getExtrusionHeightFromAI(aiCommand);
      console.log('AI returned building data:', buildingData);
      
      if (buildingData !== null && viewerRef.current) {
        const viewer = viewerRef.current.viewer;
        const { height, floors } = buildingData;
        
        // Remove existing building if any
        if (extrudedBuilding) {
          viewer.entities.remove(extrudedBuilding);
        }
        
        const buildingId = `building-${new Date().getTime()}`;
        console.log('Creating building with ID:', buildingId);

        const building = createMultiFloorBuilding(viewer, buildingId, activeShapePoints, height, floors, 0.9);

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
        
        // Generate default floor colors
        const defaultFloorColors = generateFloorColors(floors, 0.9).map(color => 
          `#${Math.round(color.red * 255).toString(16).padStart(2, '0')}${Math.round(color.green * 255).toString(16).padStart(2, '0')}${Math.round(color.blue * 255).toString(16).padStart(2, '0')}`
        );
        
        const saveResult = await buildingService.saveBuilding(
          buildingId, 
          {
            num_floors: floors.toString(),
            ai_command: aiCommand
          },
          geometryPoints,
          aiCommand,
          height,
          defaultFloorColors
        );
        
        if (saveResult.success) {
          console.log('Building saved successfully');
          setStatusMessage(`בניין נוצר ונשמר! גובה: ${height}מ', קומות: ${floors}`);
          
          // Reload saved buildings to include the new one
          loadSavedBuildings();
        } else {
          console.error('Save failed:', saveResult.error);
          setStatusMessage(`בניין נוצר אך השמירה נכשלה: ${saveResult.error}`);
        }
        
        // Clear drawing state and show data form
        setActiveShapePoints([]);
        setAiCommand('');
        setIsDrawing(false);
        setShowDataForm(true);
        
      } else {
        console.error('Failed to create building - no height or viewer');
        setStatusMessage('הבינה המלאכותית לא הצליחה לקבוע פרמטרי בניין או הצופה אינו זמין.');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setStatusMessage('שגיאה בתקשורת עם הבינה המלאכותית.');
    }
  };

  const getExtrusionHeightFromAI = async (userCommand) => {
    console.log('Calling Gemini API with command:', userCommand);
    const geminiApiKey = 'AIzaSyD7he1t-eLRUPOjUvbSfImIBLhKelaoQbw';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    const prompt = `You are an assistant for a 3D mapping application. The user has provided an instruction to create a building. Your task is to determine both the final height of the building in meters AND the number of floors. Assume a standard floor is 3.5 meters high if the user specifies floors. Respond with ONLY a JSON object in this format: {"height": 35, "floors": 10}. For example, if the user says 'make it 10 stories tall', you should respond with '{"height": 35, "floors": 10}'. If the user says 'extrude to 100 feet', you should respond with '{"height": 30.48, "floors": 9}'. If the user says 'build it 50 meters high', you should respond with '{"height": 50, "floors": 14}'. User instruction: '${userCommand}'`;
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
        console.log('Raw AI response:', text);
        try {
          // Remove markdown code block delimiters if present
          const cleanedText = text.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
          const parsed = JSON.parse(cleanedText);
          console.log('Parsed response:', parsed);
          return {
            height: parseFloat(parsed.height) || 0,
            floors: parseInt(parsed.floors) || 1
          };
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          // Fallback to old behavior
          const height = parseFloat(text.trim());
          return isNaN(height) ? null : { height, floors: Math.max(1, Math.floor(height / 3.5)) };
        }
      }
      return null;
    } catch (error) {
      console.error('Fetch error:', error);
      return null;
    }
  };

  // Create a multi-floor building with different colors per floor
  const createMultiFloorBuilding = (viewer, buildingId, points, totalHeight, numFloors, transparency = 0.9) => {
    console.log(`Creating building with ${numFloors} floors, total height: ${totalHeight}m`);
    
    // Create rounded corners for the building footprint
    const roundedPoints = createRoundedCorners(points, 2.0); // 2 meter radius for corners
    
    const floorHeight = totalHeight / numFloors;
    const building = viewer.entities.add({
      id: buildingId,
      isBuilding: true
    });
    
    // Generate colors for each floor (gradient from bottom to top)
    const floorColors = generateFloorColors(numFloors, transparency);
    
    // Create each floor as a separate polygon
    for (let floor = 0; floor < numFloors; floor++) {
      const floorBottom = floor * floorHeight;
      const floorTop = (floor + 1) * floorHeight;
      
      viewer.entities.add({
        id: `${buildingId}-floor-${floor}`,
        parent: building,
        polygon: {
          hierarchy: new window.Cesium.PolygonHierarchy(roundedPoints),
          height: floorBottom,
          extrudedHeight: floorTop,
          material: floorColors[floor],
          outline: true,
          outlineColor: window.Cesium.Color.BLACK.withAlpha(0.3),
          outlineWidth: 1
        }
      });
    }
    
    return building;
  };
  
  // Generate colors for floors (gradient from warm bottom to cool top)
  const generateFloorColors = (numFloors, transparency = 0.9) => {
    const colors = [];
    for (let i = 0; i < numFloors; i++) {
      const ratio = i / Math.max(1, numFloors - 1);
      
      // Create a gradient from warm colors (bottom) to cool colors (top)
      const hue = 0.15 - (ratio * 0.4); // From yellow-orange to blue-purple
      const saturation = 0.7 - (ratio * 0.3); // Slightly less saturated at top
      const brightness = 0.8 + (ratio * 0.2); // Slightly brighter at top
      
      const color = window.Cesium.Color.fromHsl(hue, saturation, brightness, transparency);
      colors.push(color);
    }
    return colors;
  };
  
  // Create rounded corners for building footprint
  const createRoundedCorners = (points, radius) => {
    if (points.length < 3) return points;
    
    const roundedPoints = [];
    const numSegments = 8; // Number of segments per rounded corner
    
    for (let i = 0; i < points.length; i++) {
      const prevPoint = points[(i - 1 + points.length) % points.length];
      const currentPoint = points[i];
      const nextPoint = points[(i + 1) % points.length];
      
      // Convert to cartographic for easier calculation
      const prevCarto = window.Cesium.Cartographic.fromCartesian(prevPoint);
      const currentCarto = window.Cesium.Cartographic.fromCartesian(currentPoint);
      const nextCarto = window.Cesium.Cartographic.fromCartesian(nextPoint);
      
      // Calculate vectors
      const vec1Lon = prevCarto.longitude - currentCarto.longitude;
      const vec1Lat = prevCarto.latitude - currentCarto.latitude;
      const vec2Lon = nextCarto.longitude - currentCarto.longitude;
      const vec2Lat = nextCarto.latitude - currentCarto.latitude;
      
      // Normalize vectors
      const len1 = Math.sqrt(vec1Lon * vec1Lon + vec1Lat * vec1Lat);
      const len2 = Math.sqrt(vec2Lon * vec2Lon + vec2Lat * vec2Lat);
      
      if (len1 > 0 && len2 > 0) {
        const norm1Lon = vec1Lon / len1;
        const norm1Lat = vec1Lat / len1;
        const norm2Lon = vec2Lon / len2;
        const norm2Lat = vec2Lat / len2;
        
        // Calculate the angle between vectors
        const dot = norm1Lon * norm2Lon + norm1Lat * norm2Lat;
        const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
        
        // Only round if angle is sharp enough
        if (angle < Math.PI * 0.9) {
          const radiusInRadians = radius / 6371000; // Convert to radians (Earth radius)
          
          // Create rounded corner
          for (let j = 0; j < numSegments; j++) {
            const t = j / (numSegments - 1);
            const cornerAngle = angle * (t - 0.5);
            
            const offsetLon = radiusInRadians * Math.cos(cornerAngle) * norm1Lon + 
                             radiusInRadians * Math.sin(cornerAngle) * norm2Lon;
            const offsetLat = radiusInRadians * Math.cos(cornerAngle) * norm1Lat + 
                             radiusInRadians * Math.sin(cornerAngle) * norm2Lat;
            
            const roundedCarto = new window.Cesium.Cartographic(
              currentCarto.longitude + offsetLon,
              currentCarto.latitude + offsetLat,
              currentCarto.height
            );
            
            roundedPoints.push(window.Cesium.Cartesian3.fromRadians(
              roundedCarto.longitude,
              roundedCarto.latitude,
              roundedCarto.height
            ));
          }
        } else {
          // Keep original point for obtuse angles
          roundedPoints.push(currentPoint);
        }
      } else {
        // Keep original point if vectors are invalid
        roundedPoints.push(currentPoint);
      }
    }
    
    return roundedPoints.length > 0 ? roundedPoints : points;
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

  // Load buildings when viewer is ready
  useEffect(() => {
    if (viewerRef.current && savedBuildings.length > 0) {
      displaySavedBuildings(savedBuildings);
    }
  }, [viewerRef.current, savedBuildings]);

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
          onSave={(message, shouldRefresh, transparency) => {
            setStatusMessage(message);
            if (shouldRefresh && transparency !== undefined) {
              // Refresh the specific building with new transparency
              const building = savedBuildings.find(b => b.id === currentBuildingId);
              if (building && viewerRef.current && viewerRef.current.viewer) {
                const viewer = viewerRef.current.viewer;
                
                // Remove existing building and floors
                const existingBuilding = viewer.entities.getById(currentBuildingId);
                if (existingBuilding) {
                  viewer.entities.remove(existingBuilding);
                }
                const floorEntities = viewer.entities.values.filter(entity => 
                  entity.id && entity.id.startsWith(`${currentBuildingId}-floor-`)
                );
                floorEntities.forEach(entity => {
                  viewer.entities.remove(entity);
                });
                
                // Recreate with new transparency
                if (building.geometry_points && building.geometry_points.length >= 3) {
                  const points = building.geometry_points.map(point => 
                    window.Cesium.Cartesian3.fromDegrees(
                      point.longitude, 
                      point.latitude, 
                      point.height || 0
                    )
                  );
                  
                  const height = parseFloat(building.height) || 30;
                  const floors = parseInt(building.num_floors) || parseInt(building.no_floors) || Math.max(1, Math.floor(height / 3.5));
                  
                  // Get updated floor colors from form data
                  const updatedBuilding = savedBuildings.find(b => b.id === currentBuildingId);
                  const floorColors = updatedBuilding ? updatedBuilding.floor_colors || [] : [];
                  
                  createSavedBuilding(viewer, building.id, points, height, floors, floorColors, transparency);
                }
              }
            } else {
              // Just reload all buildings to get the updated data
              loadSavedBuildings();
            }
          }}
        />
      )}
    </div>
  );
}

export default App;