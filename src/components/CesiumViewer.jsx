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

  useImperativeHandle(ref, () => ({
    viewer: viewerRef.current,
    startDrawing: () => {
      console.log('Starting drawing...');
      isDrawingRef.current = true;
      activePointsRef.current = [];
      drawingEntitiesRef.current = [];
      onDrawingStateChange(true, [], null, null, "Click to add points. Double-click to finish.");
    },
    cancelDrawing: () => {
      console.log('Canceling drawing...');
      isDrawingRef.current = false;
      // Clear all drawing entities
      if (viewerRef.current) {
        drawingEntitiesRef.current.forEach(entity => {
          viewerRef.current.entities.remove(entity);
        });
      }
      drawingEntitiesRef.current = [];
      activePointsRef.current = [];
      onDrawingStateChange(false, [], null, null, "Drawing cancelled. Click 'Start Drawing' to begin.");
    },
    clearDrawing: () => {
      console.log('Clearing drawing...');
      // Clear all drawing entities including preview polygon
      if (viewerRef.current) {
        drawingEntitiesRef.current.forEach(entity => {
          viewerRef.current.entities.remove(entity);
        });
      }
      drawingEntitiesRef.current = [];
      activePointsRef.current = [];
      isDrawingRef.current = false;
    }
  }));

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
    console.log('Cesium viewer created:', viewer);

    // Check if viewer was successfully created
    if (!viewer || !viewer.scene) {
      console.error('Failed to create Cesium viewer');
      return;
    }

    // Initialize scene
    const initializeScene = async () => {
      try {
        // Check if viewer is still valid before proceeding
        if (!viewer || viewer.isDestroyed()) {
          return;
        }
        
        const osmBuildings = await window.Cesium.createOsmBuildingsAsync();
        
        // Check again after async operation
        if (!viewer || viewer.isDestroyed()) {
          return;
        }
        
        viewer.scene.primitives.add(osmBuildings);
        osmBuildings.style = new window.Cesium.Cesium3DTileStyle({ 
          color: "color('rgba(200, 200, 200, 0.8)')" 
        });
        
        // Check once more before camera operation
        if (!viewer || viewer.isDestroyed()) {
          return;
        }
        
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

    handler.setInputAction((event) => {
      console.log('Left click detected, isDrawing:', isDrawingRef.current);
      
      if (isDrawingRef.current) {
        const earthPosition = viewer.camera.pickEllipsoid(event.position, viewer.scene.globe.ellipsoid);
        if (window.Cesium.defined(earthPosition)) {
          console.log('Adding point:', earthPosition);
          activePointsRef.current.push(earthPosition);
          
          // Add visual point
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
          console.log('Point entity added:', pointEntity);

          // Add line if we have more than one point
          if (activePointsRef.current.length > 1) {
            const lineEntity = viewer.entities.add({
              polyline: {
                positions: [
                  activePointsRef.current[activePointsRef.current.length - 2], 
                  activePointsRef.current[activePointsRef.current.length - 1]
                ],
                width: 4,
                material: window.Cesium.Color.CYAN,
                clampToGround: true
              }
            });
            drawingEntitiesRef.current.push(lineEntity);
            console.log('Line entity added:', lineEntity);
          }
          
          // Update parent component with new points
          const message = `Added point ${activePointsRef.current.length}. ${activePointsRef.current.length >= 3 ? 'Double-click to finish.' : 'Continue adding points.'}`;
          console.log('Updating parent state:', message);
          onDrawingStateChange(
            true, 
            [...activePointsRef.current], 
            null, 
            null, 
            message
          );
        }
      } else {
        const pickedObject = viewer.scene.pick(event.position);
        if (window.Cesium.defined(pickedObject) && 
            window.Cesium.defined(pickedObject.id) && 
            pickedObject.id.isBuilding) {
          onBuildingClick(pickedObject.id);
        }
      }
    }, window.Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction((event) => {
      console.log('Double click detected, isDrawing:', isDrawingRef.current, 'points:', activePointsRef.current.length);
      
      if (isDrawingRef.current && activePointsRef.current.length >= 3) {
        terminateShape();
      }
    }, window.Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    const terminateShape = () => {
      console.log('Terminating shape with points:', activePointsRef.current.length);
      
      // CRITICAL: Store the points before any cleanup
      const completedPoints = [...activePointsRef.current];
      console.log('Storing completed points:', completedPoints);
      
      // Create a preview polygon
      if (activePointsRef.current.length >= 3 && viewerRef.current) {
        // Clear only the drawing aids (points and lines), keep the polygon
        drawingEntitiesRef.current.forEach(entity => {
          if (entity.point || entity.polyline) {
            viewer.entities.remove(entity);
          }
        });
        drawingEntitiesRef.current = drawingEntitiesRef.current.filter(entity => 
          !entity.point && !entity.polyline
        );
        
        const previewPolygon = viewerRef.current.entities.add({
          id: 'preview-polygon',
          polygon: {
            hierarchy: new window.Cesium.PolygonHierarchy(activePointsRef.current),
            material: window.Cesium.Color.BLUE.withAlpha(0.3),
            outline: true,
            outlineColor: window.Cesium.Color.BLUE
          }
        });
        drawingEntitiesRef.current.push(previewPolygon);
        console.log('Preview polygon created:', previewPolygon);
      }
      
      isDrawingRef.current = false;
      const message = `Footprint complete with ${activePointsRef.current.length} points. Enter AI command and click "Create Building".`;
      console.log('Shape terminated, updating parent:', message);
      
      // CRITICAL: Pass the stored points to parent, not the current ref
      onDrawingStateChange(
        false, 
        completedPoints, 
        null, 
        null, 
        message
      );
      
      // Keep the points in the ref for building creation
      activePointsRef.current = completedPoints;
      console.log('Points preserved in ref:', activePointsRef.current.length);
    };

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

  // Handle drawing state changes
  useEffect(() => {
    console.log('Drawing state changed from parent:', isDrawing);
    // Update internal drawing state
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);

  return <div ref={containerRef} id="cesiumContainer" />;
});

CesiumViewer.displayName = 'CesiumViewer';

export default CesiumViewer;