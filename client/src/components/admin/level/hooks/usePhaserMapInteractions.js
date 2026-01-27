import { useRef, useCallback } from 'react';
import { ITEM_TYPES } from '@/constants/itemTypes';

export const usePhaserMapInteractions = ({
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
}) => {
  const onAddMonsterRequestRef = useRef(onAddMonsterRequest);

  // Update ref when prop changes
  onAddMonsterRequestRef.current = onAddMonsterRequest;

  // Phaser helper functions
  const findNodeAt = (x, y) => {
    const threshold = 20;
    const nodes = formDataRef.current.nodes;
    return nodes.find(node =>
      Math.abs(node.x - x) < threshold &&
      Math.abs(node.y - y) < threshold
    );
  };

  // Find obstacle at position (for editing)
  const findObstacleAt = (x, y) => {
    const obstacles = formDataRef.current.obstacles || [];
    for (let i = 0; i < obstacles.length; i++) {
      const obstacle = obstacles[i];
      if (obstacle.points && obstacle.points.length >= 3) {
        // Check if point is inside polygon
        const minX = Math.min(...obstacle.points.map(p => p.x));
        const maxX = Math.max(...obstacle.points.map(p => p.x));
        const minY = Math.min(...obstacle.points.map(p => p.y));
        const maxY = Math.max(...obstacle.points.map(p => p.y));

        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          return { obstacle, index: i };
        }
      } else if (obstacle.x && obstacle.y) {
        // Legacy format - check if within square
        const threshold = 20;
        if (Math.abs(obstacle.x - x) < threshold && Math.abs(obstacle.y - y) < threshold) {
          return { obstacle, index: i };
        }
      }
    }
    return null;
  };

  // ตรวจสอบว่า item enable หรือไม่
  const isItemEnabled = (itemName) => {
    const selectedCategory = selectedCategoryRef.current;
    if (!selectedCategory?.item_enable) return false;

    // ใช้ category_items ถ้ามี (ตารางใหม่)
    if (selectedCategory?.category_items && Array.isArray(selectedCategory.category_items)) {
      return selectedCategory.category_items.some(ci => ci.item_type === itemName);
    }

    // Fallback ไปใช้ item (backward compatibility)
    let itemData = selectedCategory?.item;
    if (!itemData) return false;

    // ถ้าเป็น string ให้ parse JSON
    if (typeof itemData === 'string') {
      try {
        itemData = JSON.parse(itemData);
      } catch (e) {
        return false;
      }
    }

    // แปลงเป็น array
    const enabledItems = Array.isArray(itemData) ? itemData : [itemData];
    return enabledItems.includes(itemName);
  };

  const handlePhaserClick = useCallback((x, y) => {
    const clickedNode = findNodeAt(x, y);
    const mode = currentModeRef.current;
    const currentFormData = formDataRef.current;
    const currentSelectedNode = selectedNodeRef.current;


    if (mode === 'node') {
      // Add new node
      const newNodeId = currentFormData.nodes.length > 0
        ? Math.max(...currentFormData.nodes.map(n => n.id)) + 1
        : 0;
      const newNode = {
        id: newNodeId,
        x: Math.round(x),
        y: Math.round(y),
      };
      onFormDataChange({
        ...currentFormData,
        nodes: [...currentFormData.nodes, newNode],
      });
    } else if (mode === 'edge') {
      // Handle edge creation
      if (!clickedNode) return;

      if (!currentSelectedNode) {
        // First node selection
        onSelectedNodeChange(clickedNode);
      } else {
        // Second node selection - create edge
        if (currentSelectedNode.id !== clickedNode.id) {
          const edgeExists = currentFormData.edges.some(e =>
            (e.from === currentSelectedNode.id && e.to === clickedNode.id) ||
            (e.from === clickedNode.id && e.to === currentSelectedNode.id)
          );

          if (!edgeExists) {
            // ตรวจสอบว่า category เป็น Shortest Path หรือ Minimum Spanning Tree
            // ใช้ selectedCategoryRef.current แทน selectedCategory เพื่อให้ได้ค่าล่าสุด
            const currentCategory = selectedCategoryRef.current;
            const categoryName = (currentCategory?.category_name || '').toLowerCase();
            const isWeightedGraph = categoryName.includes('shortest path') ||
              categoryName.includes('minimum spanning tree') ||
              categoryName.includes('dijkstra') ||
              categoryName.includes('prim') ||
              categoryName.includes('kruskal');

            // ใช้ edgeWeightRef.current แทน edgeWeight เพื่อให้ได้ค่าล่าสุด
            const currentEdgeWeightFromRef = edgeWeightRef.current;
            const edgeWeightNum = typeof currentEdgeWeightFromRef === 'number'
              ? currentEdgeWeightFromRef
              : parseInt(currentEdgeWeightFromRef, 10);
            const currentEdgeWeight = (!isNaN(edgeWeightNum) && edgeWeightNum > 0) ? edgeWeightNum : 1;

            const newEdge = {
              from: currentSelectedNode.id,
              to: clickedNode.id,
            };

            // เพิ่ม value field ถ้าเป็น weighted graph
            if (isWeightedGraph) {
              newEdge.value = currentEdgeWeight;
            }

            if (process.env.NODE_ENV === 'development') {
              console.log('Creating edge:', newEdge, 'isWeightedGraph:', isWeightedGraph, 'categoryName:', categoryName, 'currentCategory:', currentCategory);
            }

            onFormDataChange({
              ...currentFormData,
              edges: [...currentFormData.edges, newEdge],
            });
          }
        }
        onSelectedNodeChange(null);
      }
    } else if (mode === 'coin') {
      // เพิ่ม coin ที่ตำแหน่งที่คลิก (ต้อง enable ก่อน)
      if (!isItemEnabled(ITEM_TYPES.COIN_POSITIONS)) {
        alert('Coin ไม่ได้ถูก enable ใน category นี้');
        return;
      }
      const newCoinId = (currentFormData.coin_positions?.length || 0) > 0
        ? Math.max(...currentFormData.coin_positions.map(c => c.id || 0)) + 1
        : 1;
      // ใช้ coinValueRef.current แทน coinValue เพื่อให้ได้ค่าล่าสุด (เพราะ handlePhaserClick ถูกเรียกจาก closure)
      const currentCoinValueFromRef = coinValueRef.current;
      // แปลง coinValue เป็น number และตรวจสอบว่าเป็น valid number
      const coinValueNum = typeof currentCoinValueFromRef === 'number'
        ? currentCoinValueFromRef
        : parseInt(currentCoinValueFromRef, 10);
      const currentCoinValue = (!isNaN(coinValueNum) && coinValueNum > 0) ? coinValueNum : 10;
      const newCoin = {
        x: Math.round(x),
        y: Math.round(y),
        collected: false,
        id: newCoinId,
        value: currentCoinValue, // ใช้ค่าจาก input
      };
      onFormDataChange({
        ...currentFormData,
        coin_positions: [...(currentFormData.coin_positions || []), newCoin],
      });
    } else if (mode === 'people') {
      // เพิ่ม people ที่ตำแหน่งที่คลิก (ต้อง enable ก่อน)
      if (!isItemEnabled(ITEM_TYPES.PEOPLE)) {
        alert('People ไม่ได้ถูก enable ใน category นี้');
        return;
      }
      if (!clickedNode) {
        alert('กรุณาคลิกที่ Node เพื่อเพิ่ม People');
        return;
      }
      const newPeopleId = (currentFormData.people?.length || 0) > 0
        ? Math.max(...currentFormData.people.map(p => p.id || 0)) + 1
        : 1;
      const newPeople = {
        x: Math.round(clickedNode.x),
        y: Math.round(clickedNode.y),
        id: newPeopleId,
        nodeId: clickedNode.id,
        rescued: false,
        personName: `คนที่ ${newPeopleId}`,
      };
      onFormDataChange({
        ...currentFormData,
        people: [...(currentFormData.people || []), newPeople],
      });
    } else if (mode === 'treasure') {
      // เพิ่ม treasure ที่ตำแหน่งที่คลิก (ต้อง enable ก่อน)
      if (!isItemEnabled(ITEM_TYPES.TREASURES)) {
        alert('Treasure ไม่ได้ถูก enable ใน category นี้');
        return;
      }
      if (!clickedNode) {
        alert('กรุณาคลิกที่ Node เพื่อเพิ่ม Treasure');
        return;
      }
      const newTreasureId = (currentFormData.treasures?.length || 0) > 0
        ? Math.max(...currentFormData.treasures.map(t => t.id || 0)) + 1
        : 1;
      const newTreasure = {
        id: newTreasureId,
        x: Math.round(clickedNode.x),
        y: Math.round(clickedNode.y),
        nodeId: clickedNode.id,
        collected: false,
        name: `💎 สมบัติล้ำค่า`,
      };
      onFormDataChange({
        ...currentFormData,
        treasures: [...(currentFormData.treasures || []), newTreasure],
      });
    } else if (mode === 'start' && clickedNode) {
      // Set start node
      onFormDataChange({
        ...currentFormData,
        start_node_id: clickedNode.id,
      });
    } else if (mode === 'goal' && clickedNode) {
      // Set goal node
      onFormDataChange({
        ...currentFormData,
        goal_node_id: clickedNode.id,
      });
    } else if (mode === 'monster') {
      // If we have a request callback (e.g. to show a choice dialog), use it
      if (typeof onAddMonsterRequestRef.current === 'function') {
        onAddMonsterRequestRef.current(x, y, clickedNode);
        return;
      }

      // Add monster at clicked position (Fallback/Default behavior)
      const newMonsterId = currentFormData.monsters.length > 0
        ? Math.max(...currentFormData.monsters.map(m => m.id)) + 1
        : 1;

      const patrolWidth = 40;
      const patrolHeight = 45;
      const centerX = Math.round(x);
      const centerY = Math.round(y);

      const patrol = [
        { x: centerX - patrolWidth / 2, y: centerY - patrolHeight / 2 },
        { x: centerX + patrolWidth / 2, y: centerY - patrolHeight / 2 },
        { x: centerX + patrolWidth / 2, y: centerY + patrolHeight / 2 },
        { x: centerX - patrolWidth / 2, y: centerY + patrolHeight / 2 }
      ];

      const newMonster = {
        id: newMonsterId,
        name: '👹 Goblin',
        hp: 3,
        damage: 100,
        type: 'enemy', // Default type
        x: centerX,
        y: centerY,
        startNode: clickedNode ? clickedNode.id : null,
        patrol: patrol,
        defeated: false,
        detectionRange: 60,
      };
      onFormDataChange({
        ...currentFormData,
        monsters: [...currentFormData.monsters, newMonster],
      });
    } else if (mode === 'obstacle') {
      // Check if clicking on existing obstacle to edit
      const obstacleAt = findObstacleAt(x, y);
      if (obstacleAt && obstacleAt.obstacle.points && obstacleAt.obstacle.points.length >= 3) {
        // Start editing existing obstacle
        editingObstacleIndexRef.current = obstacleAt.index;
        const points = obstacleAt.obstacle.points;
        const minX = Math.min(...points.map(p => p.x));
        const maxX = Math.max(...points.map(p => p.x));
        const minY = Math.min(...points.map(p => p.y));
        const maxY = Math.max(...points.map(p => p.y));
        obstacleDragStartRef.current = { x: minX, y: minY };
        obstacleDragEndRef.current = { x: maxX, y: maxY };
        isDraggingObstacleRef.current = true;
      } else {
        // Start dragging to create new rectangle obstacle
        obstacleDragStartRef.current = { x: Math.round(x), y: Math.round(y) };
        obstacleDragEndRef.current = { x: Math.round(x), y: Math.round(y) };
        isDraggingObstacleRef.current = true;
        editingObstacleIndexRef.current = null;
      }
    } else if (mode === 'delete') {
      // Check if clicking on obstacle
      const obstacleAt = findObstacleAt(x, y);
      if (obstacleAt) {
        if (confirm(`ลบ Obstacle ${obstacleAt.index + 1}?`)) {
          onFormDataChange({
            ...currentFormData,
            obstacles: currentFormData.obstacles.filter((_, i) => i !== obstacleAt.index),
          });
        }
        return;
      }

      // Delete coin, people, treasure if clicked
      // ลบ coin
      const coinAt = (currentFormData.coin_positions || []).findIndex(c =>
        Math.abs(c.x - x) < 20 && Math.abs(c.y - y) < 20
      );
      if (coinAt !== -1) {
        if (confirm(`ลบ Coin ${coinAt + 1}?`)) {
          onFormDataChange({
            ...currentFormData,
            coin_positions: currentFormData.coin_positions.filter((_, i) => i !== coinAt),
          });
        }
        return;
      }

      // ลบ people (คลิกที่ตำแหน่ง)
      const peopleAt = (currentFormData.people || []).findIndex(p =>
        Math.abs(p.x - x) < 20 && Math.abs(p.y - y) < 20
      );
      if (peopleAt !== -1) {
        if (confirm(`ลบ People ${peopleAt + 1}?`)) {
          onFormDataChange({
            ...currentFormData,
            people: currentFormData.people.filter((_, i) => i !== peopleAt),
          });
        }
        return;
      }

      // ลบ treasure (คลิกที่ตำแหน่ง)
      const treasureAt = (currentFormData.treasures || []).findIndex(t =>
        Math.abs(t.x - x) < 20 && Math.abs(t.y - y) < 20
      );
      if (treasureAt !== -1) {
        if (confirm(`ลบ Treasure ${treasureAt + 1}?`)) {
          onFormDataChange({
            ...currentFormData,
            treasures: currentFormData.treasures.filter((_, i) => i !== treasureAt),
          });
        }
        return;
      }

      // ตรวจสอบการลบ Monster
      // ลบ monster (คลิกที่ตำแหน่ง)
      const monsterAt = (currentFormData.monsters || []).findIndex(m => {
        const mX = m.x || (m.startNode ? currentFormData.nodes.find(n => n.id === m.startNode)?.x : 0);
        const mY = m.y || (m.startNode ? currentFormData.nodes.find(n => n.id === m.startNode)?.y : 0);
        return Math.abs(mX - x) < 20 && Math.abs(mY - y) < 20;
      });

      if (monsterAt !== -1) {
        if (confirm(`ลบ Monster ${currentFormData.monsters[monsterAt].name}?`)) {
          onFormDataChange({
            ...currentFormData,
            monsters: currentFormData.monsters.filter((_, i) => i !== monsterAt),
          });
        }
        return;
      }

      // Delete node if clicked
      if (clickedNode) {
        if (confirm(`ลบ Node ${clickedNode.id}?`)) {
          onFormDataChange({
            ...currentFormData,
            nodes: currentFormData.nodes.filter(n => n.id !== clickedNode.id),
            edges: currentFormData.edges.filter(e =>
              e.from !== clickedNode.id && e.to !== clickedNode.id
            ),
            start_node_id: currentFormData.start_node_id === clickedNode.id ? null : currentFormData.start_node_id,
            goal_node_id: currentFormData.goal_node_id === clickedNode.id ? null : currentFormData.goal_node_id,
            // ลบ coin, people, treasure ที่เกี่ยวข้องกับ node นี้
            coin_positions: (currentFormData.coin_positions || []).filter(c => c.nodeId !== clickedNode.id),
            people: (currentFormData.people || []).filter(p => p.nodeId !== clickedNode.id),
            treasures: (currentFormData.treasures || []).filter(t => t.nodeId !== clickedNode.id),
          });
        }
      }
    }
  }, [
    formDataRef,
    selectedNodeRef,
    currentModeRef,
    onFormDataChange,
    onSelectedNodeChange,
    coinValueRef,
    selectedCategoryRef,
    edgeWeightRef,
    isDraggingObstacleRef,
    obstacleDragStartRef,
    obstacleDragEndRef,
    editingObstacleIndexRef
  ]);

  const setupInteractionEvents = useCallback((scene, canvasSize) => {
    // Make scene interactive - create a zone that covers the entire scene
    const zone = scene.add.zone(canvasSize.width / 2, canvasSize.height / 2, canvasSize.width, canvasSize.height);
    zone.setInteractive();

    // Pointer events
    zone.on('pointerdown', (pointer) => {
      handlePhaserClick(pointer.x, pointer.y);
    });

    scene.input.on('pointermove', (pointer) => {
      const mode = currentModeRef.current;

      // Handle obstacle dragging
      if (mode === 'obstacle' && isDraggingObstacleRef.current && obstacleDragStartRef.current) {
        obstacleDragEndRef.current = { x: Math.round(pointer.x), y: Math.round(pointer.y) };
        redrawPhaser(); // Redraw to show preview
      }

      // Handle cursor changes
      if (mode === 'delete') {
        const node = findNodeAt(pointer.x, pointer.y);
        const obstacleAt = findObstacleAt(pointer.x, pointer.y);
        if (node || obstacleAt) {
          scene.input.setDefaultCursor('pointer');
        } else {
          scene.input.setDefaultCursor('default');
        }
      } else if (mode === 'obstacle') {
        scene.input.setDefaultCursor('crosshair');
      } else {
        scene.input.setDefaultCursor('default');
      }
    });

    scene.input.on('pointerup', (pointer) => {
      const mode = currentModeRef.current;

      // Finish obstacle dragging
      if (mode === 'obstacle' && isDraggingObstacleRef.current && obstacleDragStartRef.current && obstacleDragEndRef.current) {
        const start = obstacleDragStartRef.current;
        const end = obstacleDragEndRef.current;

        // Calculate rectangle bounds
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);

        // Only create/update if rectangle is large enough
        if (Math.abs(maxX - minX) > 10 && Math.abs(maxY - minY) > 10) {
          const currentFormData = formDataRef.current;

          if (editingObstacleIndexRef.current !== null) {
            // Update existing obstacle
            const updatedObstacles = [...currentFormData.obstacles];
            const existingObstacle = updatedObstacles[editingObstacleIndexRef.current];
            updatedObstacles[editingObstacleIndexRef.current] = {
              ...existingObstacle,
              type: 'pit',
              points: [
                { x: minX, y: minY }, // top-left
                { x: maxX, y: minY }, // top-right
                { x: maxX, y: maxY }, // bottom-right
                { x: minX, y: maxY }  // bottom-left
              ]
            };

            onFormDataChange({
              ...currentFormData,
              obstacles: updatedObstacles,
            });
          } else {
            // Create new obstacle
            const newObstacleId = currentFormData.obstacles.length > 0
              ? Math.max(...currentFormData.obstacles.map(o => o.id || 0)) + 1
              : 1;

            // Create rectangle with 4 points (clockwise from top-left)
            const newObstacle = {
              id: newObstacleId,
              type: 'pit',
              points: [
                { x: minX, y: minY }, // top-left
                { x: maxX, y: minY }, // top-right
                { x: maxX, y: maxY }, // bottom-right
                { x: minX, y: maxY }  // bottom-left
              ]
            };

            onFormDataChange({
              ...currentFormData,
              obstacles: [...currentFormData.obstacles, newObstacle],
            });
          }
        }

        // Reset drag state
        isDraggingObstacleRef.current = false;
        obstacleDragStartRef.current = null;
        obstacleDragEndRef.current = null;
        redrawPhaser();
      }
    });

  }, [currentModeRef, isDraggingObstacleRef, obstacleDragStartRef, obstacleDragEndRef, editingObstacleIndexRef, formDataRef, onFormDataChange, redrawPhaser, handlePhaserClick]);

  return { setupInteractionEvents };
};
