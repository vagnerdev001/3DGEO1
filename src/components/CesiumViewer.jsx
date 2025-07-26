import { useEffect, useImperativeHandle, forwardRef, useRef } from 'react';

const CesiumViewer = forwardRef(({ 
  isDrawing, 
  activeShapePoints, 
  currentLayer,
  onDrawingStateChange, 
  onBuildingClick 
}, ref) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const handlerRef = useRef(null);
  const drawingEntitiesRef = useRef([]);
  const activePointsRef = useRef([]);
  const isDrawingRef = useRef(false);
  const activeShapeRef = useRef(null);
  const floatingPointRef = useRef(null);

  useImperativeHandle(ref, () => ({
    viewer: viewerRef.current,
    getActivePoints: () => activePointsRef.current,
    startDrawing: () => {
      console.log('=== STARTING DRAWING ===');
      isDrawingRef.current = true;
      activePointsRef.current = [];
      drawingEntitiesRef.current = [];
      
      // Clear any existing entities
      if (viewerRef.current) {
        viewerRef.current.entities.removeAll();
      }
      
      onDrawingStateChange(true, [], null, null, "Click to add points. Right-click to finish.");
      onDrawingStateChange(true, [], null, null, "לחץ להוספת נקודות. לחיצה ימנית לסיום.");
    },
    finishDrawing: () => {
      console.log('Finishing drawing with points:', activePointsRef.current.length);
      if (activePointsRef.current.length >= 3) {
        terminateShape();
      }
    },
    cancelDrawing: () => {
      console.log('Canceling drawing...');
      isDrawingRef.current = false;
      
      // Clear all drawing entities
      if (viewerRef.current) {
        viewerRef.current.entities.removeAll();
      }
      
      drawingEntitiesRef.current = [];
      activePointsRef.current = [];
      activeShapeRef.current = null;
      floatingPointRef.current = null;
      
      onDrawingStateChange(false, [], null, null, "Drawing cancelled. Click 'Start Drawing' to begin.");
      onDrawingStateChange(false, [], null, null, "הציור בוטל. לחץ על 'התחל ציור' כדי להתחיל.");
    },
    clearAll: () => {
      console.log('Clearing all...');
      if (viewerRef.current) {
        viewerRef.current.entities.removeAll();
      }
      drawingEntitiesRef.current = [];
      activePointsRef.current = [];
      activeShapeRef.current = null;
      floatingPointRef.current = null;
      isDrawingRef.current = false;
    },
    hasCompletedPolygon: () => {
      return activePointsRef.current.length >= 3 && !isDrawingRef.current;
    }
  }));

  const terminateShape = () => {
    console.log('=== TERMINATING SHAPE (RIGHT-CLICK) ===');
    console.log('Points before termination:', activePointsRef.current.length);
    
    if (activePointsRef.current.length < 3) {
      console.log('Not enough points to create shape');
      return;
    }

    // Store the completed points BEFORE any cleanup
    const completedPoints = [...activePointsRef.current];
    console.log('✅ Completed points stored:', completedPoints.length);
    
    // Stop drawing mode
    isDrawingRef.current = false;
    
    // Remove floating point and active shape
    if (floatingPointRef.current && viewerRef.current) {
      viewerRef.current.entities.remove(floatingPointRef.current);
      floatingPointRef.current = null;
    }
    
    if (activeShapeRef.current && viewerRef.current) {
      viewerRef.current.entities.remove(activeShapeRef.current);
      activeShapeRef.current = null;
    }
    
    // Create final polygon
    if (viewerRef.current) {
      const finalPolygon = viewerRef.current.entities.add({
        id: 'completed-polygon',
        polygon: {
          hierarchy: new window.Cesium.PolygonHierarchy(completedPoints),
          material: window.Cesium.Color.BLUE.withAlpha(0.3),
          outline: true,
          outlineColor: window.Cesium.Color.BLUE,
          extrudedHeight: 0
        }
      });
      console.log('Final polygon created:', finalPolygon);
    }
    
    // KEEP the points in the ref for building creation
    console.log('✅ Points preserved in activePointsRef:', activePointsRef.current.length);
    
    // Update parent with completed points
    const message = `מתאר הושלם עם ${completedPoints.length} נקודות. הכנס פקודת AI ולחץ על "צור בניין".`;
    console.log('✅ Calling onDrawingStateChange with:', completedPoints.length, 'points');
    
    onDrawingStateChange(
      false, // not drawing anymore
      completedPoints, // the completed points
      null, 
      null, 
      message
    );
    
    console.log('=== SHAPE TERMINATED SUCCESSFULLY ===');
  };

  const drawShape = (positionData) => {
    if (!viewerRef.current) return;
    
    const viewer = viewerRef.current;
    let shape;
    
    if (positionData.length < 2) {
      return;
    }
    
    // Create or update the active shape (polygon)
    if (!activeShapeRef.current) {
      activeShapeRef.current = viewer.entities.add({
        polygon: {
          hierarchy: new window.Cesium.CallbackProperty(() => {
            return new window.Cesium.PolygonHierarchy(positionData);
          }, false),
          material: window.Cesium.Color.YELLOW.withAlpha(0.3),
          outline: true,
          outlineColor: window.Cesium.Color.YELLOW
        }
      });
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('Initializing Cesium viewer...');

    // Initialize Cesium
    window.Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4MWJmN2FlOC0wZjQ2LTRlMTUtYTExYS04YzMyYWVjNmUyNzMiLCJpZCI6MjI1NDgxLCJpYXQiOjE3NDA4MzE1Mzd9.o7sSlzZ3eyDevQejh5Q3zxlVpHfM4vX-49UTlwoCJkw';

    const viewer = new window.Cesium.Viewer(containerRef.current, {
      imageryProvider: new window.Cesium.UrlTemplateImageryProvider({
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c'],
        credit: new window.Cesium.Credit('<a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>', false)
      }),
      infoBox: false,
      selectionIndicator: false,
      shouldAnimate: true,
      terrainProvider: new window.Cesium.EllipsoidTerrainProvider(),
    });

    viewerRef.current = viewer;
    console.log('Cesium viewer created');

    // Initialize scene
    const initializeScene = async () => {
      try {
        if (!viewer || viewer.isDestroyed()) return;
        
        const osmBuildings = await window.Cesium.createOsmBuildingsAsync();
        if (!viewer || viewer.isDestroyed()) return;
        
        viewer.scene.primitives.add(osmBuildings);
        osmBuildings.style = new window.Cesium.Cesium3DTileStyle({ 
          color: "color('rgba(200, 200, 200, 0.8)')" 
        });
        
        if (!viewer || viewer.isDestroyed()) return;
        
        await viewer.camera.flyTo({
          destination: window.Cesium.Cartesian3.fromDegrees(34.7818, 32.0853, 2500),
          orientation: { 
            heading: window.Cesium.Math.toRadians(0.0), 
            pitch: window.Cesium.Math.toRadians(-45.0) 
          }
        });
        
        console.log('Scene initialized successfully');
      } catch (error) {
        console.error("Failed to load scene assets: ", error);
      }
    };

    initializeScene();

    // Setup event handlers
    const handler = new window.Cesium.ScreenSpaceEventHandler(viewer.canvas);
    handlerRef.current = handler;

    // Left click handler
    handler.setInputAction((event) => {
      console.log('Left click - isDrawing:', isDrawingRef.current);
      
      if (isDrawingRef.current) {
        const earthPosition = viewer.camera.pickEllipsoid(event.position, viewer.scene.globe.ellipsoid);
        if (window.Cesium.defined(earthPosition)) {
          console.log('Adding point at:', earthPosition);
          
          // Add point to array
          activePointsRef.current.push(earthPosition);
          console.log('Total points now:', activePointsRef.current.length);
          
          // Add visual point marker
          const pointEntity = viewer.entities.add({
            position: earthPosition,
            point: {
              color: window.Cesium.Color.YELLOW,
              pixelSize: 12,
              outlineColor: window.Cesium.Color.BLACK,
              outlineWidth: 2,
              heightReference: window.Cesium.HeightReference.CLAMP_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });
          drawingEntitiesRef.current.push(pointEntity);
          
          // Draw the shape
          drawShape(activePointsRef.current);
          
          // Update status
          const message = `נוספה נקודה ${activePointsRef.current.length}. ${activePointsRef.current.length >= 3 ? 'לחיצה ימנית לסיום.' : 'המשך להוסיף נקודות.'}`;
          onDrawingStateChange(
            true, 
            [...activePointsRef.current], 
            null, 
            null, 
            message
          );
        }
      } else {
        // Handle building clicks when not drawing
        const pickedObject = viewer.scene.pick(event.position);
        console.log('Picked object:', pickedObject);
        
        if (window.Cesium.defined(pickedObject) && window.Cesium.defined(pickedObject.id)) {
          const entity = pickedObject.id;
          console.log('Clicked entity:', entity.id, 'isBuilding:', entity.isBuilding);
          
          // Check if it's a building or a floor of a building
          if (entity.isBuilding) {
            console.log('Clicked on building:', entity.id);
            onBuildingClick(entity);
          } else if (entity.parent && entity.parent.isBuilding) {
            console.log('Clicked on floor, parent building:', entity.parent.id);
            onBuildingClick(entity.parent);
          } else if (entity.id && entity.id.includes('building-')) {
            // Handle case where building ID contains 'building-'
            console.log('Clicked on building entity:', entity.id);
            onBuildingClick(entity);
          }
        }
      }
    }, window.Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Double click handler
    handler.setInputAction((event) => {
      console.log('Right click - isDrawing:', isDrawingRef.current, 'points:', activePointsRef.current.length);
      
      if (isDrawingRef.current && activePointsRef.current.length >= 3) {
        console.log('Terminating shape via right click');
        terminateShape();
      }
    }, window.Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    // Mouse move handler for floating point
    handler.setInputAction((event) => {
      if (isDrawingRef.current && activePointsRef.current.length > 0) {
        const earthPosition = viewer.camera.pickEllipsoid(event.endPosition, viewer.scene.globe.ellipsoid);
        if (window.Cesium.defined(earthPosition)) {
          if (!floatingPointRef.current) {
            floatingPointRef.current = viewer.entities.add({
              position: earthPosition,
              point: {
                color: window.Cesium.Color.YELLOW.withAlpha(0.7),
                pixelSize: 8,
                heightReference: window.Cesium.HeightReference.CLAMP_TO_GROUND
              }
            });
          } else {
            floatingPointRef.current.position = earthPosition;
          }
        }
      }
    }, window.Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    return () => {
      console.log('Cleaning up Cesium viewer...');
      if (handlerRef.current) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // Handle layer changes
  useEffect(() => {
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      const getImageryProvider = (layerType) => {
        switch (layerType) {
          case 'aerial':
            return new window.Cesium.IonImageryProvider({ assetId: 2 });
          case 'f4':
            return new window.Cesium.UrlTemplateImageryProvider({
              url: 'https://tile.f4map.com/tiles/f4_2d/{z}/{x}/{y}.png',
              credit: new window.Cesium.Credit('F4 Map', false)
            });
          default:
            return new window.Cesium.UrlTemplateImageryProvider({
              url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
              subdomains: ['a', 'b', 'c'],
              credit: new window.Cesium.Credit('<a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>', false)
            });
        }
      };

      const viewer = viewerRef.current;
      viewer.imageryLayers.removeAll();
      viewer.imageryLayers.addImageryProvider(getImageryProvider(currentLayer));
    }
  }, [currentLayer]);

  return <div ref={containerRef} id="cesiumContainer" />;
});

CesiumViewer.displayName = 'CesiumViewer';

export default CesiumViewer;