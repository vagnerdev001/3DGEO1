import { useEffect, useImperativeHandle, forwardRef, useRef } from 'react';

const CesiumViewer = forwardRef(({ 
  isDrawing, 
  activeShapePoints, 
  onDrawingStateChange, 
  onBuildingClick 
}, ref) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const handlerRef = useRef(null);
  const drawingEntitiesRef = useRef([]);
  const activePointsRef = useRef([]);

  useImperativeHandle(ref, () => viewerRef.current);

  useEffect(() => {
    if (!containerRef.current) return;

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
      } catch (error) {
        console.error("Failed to load scene assets: ", error);
      }
    };

    initializeScene();

    // Setup event handlers
    const handler = new window.Cesium.ScreenSpaceEventHandler(viewer.canvas);
    handlerRef.current = handler;

    handler.setInputAction((event) => {
      if (isDrawing) {
        const earthPosition = viewer.camera.pickEllipsoid(event.position, viewer.scene.globe.ellipsoid);
        if (window.Cesium.defined(earthPosition)) {
          activePointsRef.current.push(earthPosition);
          
          // Update parent component with new points
          onDrawingStateChange(
            true, 
            [...activePointsRef.current], 
            null, 
            null, 
            `Added point ${activePointsRef.current.length}. ${activePointsRef.current.length >= 3 ? 'Double-click to finish.' : 'Continue adding points.'}`
          );
          
          // Add visual point
          const pointEntity = viewer.entities.add({
            position: earthPosition,
            point: {
              color: window.Cesium.Color.RED,
              pixelSize: 5,
              heightReference: window.Cesium.HeightReference.NONE
            }
          });
          drawingEntitiesRef.current.push(pointEntity);

          // Add line if we have more than one point
          if (activePointsRef.current.length > 1) {
            const lineEntity = viewer.entities.add({
              polyline: {
                positions: [
                  activePointsRef.current[activePointsRef.current.length - 2], 
                  activePointsRef.current[activePointsRef.current.length - 1]
                ],
                width: 2,
                material: window.Cesium.Color.CORAL
              }
            });
            drawingEntitiesRef.current.push(lineEntity);
          }
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
      if (isDrawing && activePointsRef.current.length >= 3) {
        terminateShape();
      }
    }, window.Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    const terminateShape = () => {
      clearDrawingAids();
      // Create a preview polygon
      if (activePointsRef.current.length >= 3 && viewerRef.current) {
        const previewPolygon = viewerRef.current.entities.add({
          polygon: {
            hierarchy: new window.Cesium.PolygonHierarchy(activePointsRef.current),
            material: window.Cesium.Color.BLUE.withAlpha(0.3),
            outline: true,
            outlineColor: window.Cesium.Color.BLUE
          }
        });
        drawingEntitiesRef.current.push(previewPolygon);
      }
      onDrawingStateChange(
        false, 
        [...activePointsRef.current], 
        null, 
        null, 
        'Footprint complete. Enter AI command and click "Create Building".'
      );
    };

    const clearDrawingAids = () => {
      drawingEntitiesRef.current.forEach(entity => viewer.entities.remove(entity));
      drawingEntitiesRef.current = [];
    };

    return () => {
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

  // Handle drawing state changes
  useEffect(() => {
    if (!isDrawing && viewerRef.current && !viewerRef.current.isDestroyed() && activeShapePoints.length === 0) {
      // Clear drawing aids when stopping drawing
      drawingEntitiesRef.current.forEach(entity => viewerRef.current.entities.remove(entity));
      drawingEntitiesRef.current = [];
      
      activePointsRef.current = [];
    }
  }, [isDrawing, activeShapePoints.length]);

  return <div ref={containerRef} id="cesiumContainer" />;
});

CesiumViewer.displayName = 'CesiumViewer';

export default CesiumViewer;