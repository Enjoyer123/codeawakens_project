import { useRef, useEffect, useCallback } from 'react';
import { usePhaserGameInit } from './hooks/usePhaserGameInit';
import { usePhaserMapRenderer } from './hooks/usePhaserMapRenderer';
import { usePhaserMapInteractions } from './hooks/usePhaserMapInteractions';

const PhaserMapEditor = ({
  canvasSize,
  backgroundImageUrl,
  formData,
  currentMode,
  selectedNode,
  onFormDataChange,
  onSelectedNodeChange,
  onAddMonsterRequest,
  selectedCategory,
  coinValue = 10,
  edgeWeight = 1,
}) => {
  const gameRef = useRef(null);
  const phaserGameRef = useRef(null);
  const phaserGraphicsRef = useRef(null);
  const backgroundSpriteRef = useRef(null);
  const coinTextsRef = useRef([]); // เก็บ text objects สำหรับลบก่อนวาดใหม่

  // Refs for callbacks
  const backgroundImageUrlRef = useRef(backgroundImageUrl);
  const currentModeRef = useRef(currentMode);
  const formDataRef = useRef(formData);
  const selectedNodeRef = useRef(selectedNode);
  const coinValueRef = useRef(coinValue);
  const edgeWeightRef = useRef(edgeWeight);
  const selectedCategoryRef = useRef(selectedCategory);

  // Refs for obstacle dragging
  const obstacleDragStartRef = useRef(null);
  const obstacleDragEndRef = useRef(null);
  const isDraggingObstacleRef = useRef(false);
  const editingObstacleIndexRef = useRef(null);

  useEffect(() => {
    backgroundImageUrlRef.current = backgroundImageUrl;
  }, [backgroundImageUrl]);

  useEffect(() => {
    currentModeRef.current = currentMode;
  }, [currentMode]);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    selectedNodeRef.current = selectedNode;
  }, [selectedNode]);

  useEffect(() => {
    coinValueRef.current = coinValue;
  }, [coinValue]);

  useEffect(() => {
    edgeWeightRef.current = edgeWeight;
  }, [edgeWeight]);

  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
  }, [selectedCategory]);

  // 1. Setup Renderer Hook
  const { redrawPhaser } = usePhaserMapRenderer({
    canvasSize,
    formDataRef,
    selectedNodeRef,
    phaserGraphicsRef,
    coinTextsRef,
    backgroundSpriteRef,
    obstacleDragStartRef,
    obstacleDragEndRef,
    isDraggingObstacleRef,
    backgroundImageUrlRef
  });

  // 2. Setup Interactions Hook
  const { setupInteractionEvents } = usePhaserMapInteractions({
    formDataRef,
    selectedNodeRef,
    currentModeRef,
    backgroundImageUrlRef,
    coinValueRef,
    edgeWeightRef,
    selectedCategoryRef,
    obstacleDragStartRef,
    obstacleDragEndRef,
    isDraggingObstacleRef,
    editingObstacleIndexRef,
    onFormDataChange,
    onSelectedNodeChange,
    onAddMonsterRequest,
    redrawPhaser
  });

  // Define scene callbacks
  const createPhaserScene = useCallback((scene) => {
    setupInteractionEvents(scene, canvasSize);
  }, [setupInteractionEvents, canvasSize]);

  const updatePhaserScene = useCallback((scene) => {
    redrawPhaser();
  }, [redrawPhaser]);

  // 3. Setup Game Init Hook
  const { phaserLoaded } = usePhaserGameInit({
    gameRef,
    phaserGameRef,
    phaserGraphicsRef,
    backgroundSpriteRef,
    backgroundImageUrlRef,
    backgroundImageUrl,
    canvasSize,
    createSceneCallback: createPhaserScene,
    updateSceneCallback: updatePhaserScene,
    redrawPhaser
  });

  // Manual Trigger Redraw when data changes (to be safe, though renderer hook doesn't automatically watch data changes for redraw, it just provides the function)
  // We need to trigger redraw when props change.
  // In the original code, there was a useEffect for this.

  useEffect(() => {
    if (phaserLoaded && phaserGraphicsRef.current) {
      redrawPhaser();
    }
  }, [
    formData.nodes,
    formData.edges,
    formData.start_node_id,
    formData.goal_node_id,
    formData.obstacles,
    formData.coin_positions,
    formData.people,
    formData.treasures,
    formData.monsters, // Don't forget monsters if they were in original
    selectedNode,
    phaserLoaded,
    redrawPhaser
  ]);

  // Debug log from original
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Edges updated:', formData.edges);
    }
  }, [formData.edges]);

  return (
    <div className="relative border-2 border-gray-300 rounded-lg bg-black overflow-hidden">
      {!phaserLoaded && typeof window !== 'undefined' && !window.Phaser ? (
        <div className="w-full flex items-center justify-center text-white" style={{ height: `${canvasSize.height}px` }}>
          <div className="text-center">
            <div className="text-lg mb-2">⏳ กำลังโหลด Level Editor...</div>
            <div className="text-sm text-gray-400">กรุณารอสักครู่</div>
          </div>
        </div>
      ) : (
        <div
          ref={gameRef}
          id="phaser-game-container"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        ></div>
      )}
    </div>
  );
};

export default PhaserMapEditor;