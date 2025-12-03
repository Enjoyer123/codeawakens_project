import { useState, useEffect, useRef } from 'react';
import { ITEM_TYPES } from '@/constants/itemTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const PhaserMapEditor = ({
  canvasSize,
  backgroundImageUrl,
  formData,
  currentMode,
  selectedNode,
  onFormDataChange,
  onSelectedNodeChange,
  selectedCategory,
  coinValue = 10,
}) => {
  const gameRef = useRef(null);
  const phaserGameRef = useRef(null);
  const phaserGraphicsRef = useRef(null);
  const backgroundSpriteRef = useRef(null);
  const [phaserLoaded, setPhaserLoaded] = useState(false);
  const coinTextsRef = useRef([]); // เก็บ text objects สำหรับลบก่อนวาดใหม่
  
  // Refs for callbacks
  const backgroundImageUrlRef = useRef(backgroundImageUrl);
  const currentModeRef = useRef(currentMode);
  const formDataRef = useRef(formData);
  const selectedNodeRef = useRef(selectedNode);
  const coinValueRef = useRef(coinValue);
  
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

  const handlePhaserClick = (x, y) => {
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
            onFormDataChange({
              ...currentFormData,
              edges: [...currentFormData.edges, { from: currentSelectedNode.id, to: clickedNode.id }],
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
      // Add monster at clicked position
      const newMonsterId = currentFormData.monsters.length > 0 
        ? Math.max(...currentFormData.monsters.map(m => m.id)) + 1 
        : 1;
      
      // คำนวณ patrol path เป็นสี่เหลี่ยมรอบตำแหน่งที่วาง
      // ใช้ขนาด patrol area: width 40px, height 45px (จากตัวอย่าง)
      const patrolWidth = 40;
      const patrolHeight = 45;
      const centerX = Math.round(x);
      const centerY = Math.round(y);
      
      // คำนวณ 4 มุมของสี่เหลี่ยม (เริ่มจาก top-left, วนตามเข็มนาฬิกา)
      const patrol = [
        { x: centerX - patrolWidth / 2, y: centerY - patrolHeight / 2 }, // top-left
        { x: centerX + patrolWidth / 2, y: centerY - patrolHeight / 2 }, // top-right
        { x: centerX + patrolWidth / 2, y: centerY + patrolHeight / 2 }, // bottom-right
        { x: centerX - patrolWidth / 2, y: centerY + patrolHeight / 2 }  // bottom-left
      ];
      
      const newMonster = {
        id: newMonsterId,
        name: '👹 Goblin',
        hp: 3,
        damage: 100,
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
      if (mode === 'delete') {
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
  };

  const redrawPhaser = () => {
    const currentGraphics = phaserGraphicsRef.current;
    if (!currentGraphics || !currentGraphics.scene) {
      return;
    }
    
    const currentFormData = formDataRef.current;
    const currentSelectedNode = selectedNodeRef.current;
    
    // ลบ text objects เก่าก่อน
    coinTextsRef.current.forEach(text => {
      if (text && text.destroy) {
        text.destroy();
      }
    });
    coinTextsRef.current = [];
    
    currentGraphics.clear();
    
    // Draw grid
    currentGraphics.lineStyle(1, 0x4a5568, 0.3);
    for (let i = 0; i < canvasSize.width; i += 50) {
      currentGraphics.lineBetween(i, 0, i, canvasSize.height);
    }
    for (let i = 0; i < canvasSize.height; i += 50) {
      currentGraphics.lineBetween(0, i, canvasSize.width, i);
    }
    
    // Draw edges
    currentGraphics.lineStyle(3, 0xffd700, 1); // Yellow
    currentFormData.edges.forEach(edge => {
      const fromNode = currentFormData.nodes.find(n => n.id === edge.from);
      const toNode = currentFormData.nodes.find(n => n.id === edge.to);
      if (fromNode && toNode) {
        currentGraphics.lineBetween(fromNode.x, fromNode.y, toNode.x, toNode.y);
      }
    });
    
    // Draw nodes
    currentFormData.nodes.forEach(node => {
      const isStart = node.id === currentFormData.start_node_id;
      const isGoal = node.id === currentFormData.goal_node_id;
      const isSelected = currentSelectedNode && currentSelectedNode.id === node.id;
      
      // Shadow
      currentGraphics.fillStyle(0x000000, 0.3);
      currentGraphics.fillCircle(node.x + 2, node.y + 2, 18);
      
      // Node color
      let nodeColor = 0x667eea; // Blue default
      if (isStart) nodeColor = 0x10b981; // Green start
      else if (isGoal) nodeColor = 0xf59e0b; // Yellow goal
      else if (isSelected) nodeColor = 0xfbbf24; // Light yellow selected
      
      currentGraphics.fillStyle(nodeColor, 1);
      currentGraphics.fillCircle(node.x, node.y, 18);
      
      // Border
      currentGraphics.lineStyle(3, 0xffffff, 1);
      currentGraphics.strokeCircle(node.x, node.y, 18);
    });
    
    // Draw monsters
    if (currentFormData.monsters && currentFormData.monsters.length > 0) {
      currentGraphics.fillStyle(0xff0000, 1);
      currentFormData.monsters.forEach(monster => {
        // Draw monster at x, y position
        const monsterX = monster.x || (monster.startNode ? currentFormData.nodes.find(n => n.id === monster.startNode)?.x : 0);
        const monsterY = monster.y || (monster.startNode ? currentFormData.nodes.find(n => n.id === monster.startNode)?.y : 0);
        
        if (monsterX && monsterY) {
          // Shadow
          currentGraphics.fillStyle(0x000000, 0.3);
          currentGraphics.fillCircle(monsterX + 2, monsterY + 2, 15);
          
          // Monster circle
          currentGraphics.fillStyle(0xff0000, 1);
          currentGraphics.fillCircle(monsterX, monsterY, 15);
          
          // Border
          currentGraphics.lineStyle(2, 0xffffff, 1);
          currentGraphics.strokeCircle(monsterX, monsterY, 15);
          
          // Monster emoji text
          if (currentGraphics.scene) {
            const text = currentGraphics.scene.add.text(monsterX, monsterY, '👹', {
              fontSize: '16px',
            });
            text.setOrigin(0.5);
          }
        }
      });
    }
    
    // Draw coins
    if (currentFormData.coin_positions && currentFormData.coin_positions.length > 0) {
      currentFormData.coin_positions.forEach(coin => {
        const coinX = coin.x;
        const coinY = coin.y;
        
        if (coinX !== undefined && coinY !== undefined) {
          // Shadow
          currentGraphics.fillStyle(0x000000, 0.3);
          currentGraphics.fillCircle(coinX + 2, coinY + 2, 12);
          
          // Coin circle (gold)
          currentGraphics.fillStyle(0xffd700, 1);
          currentGraphics.fillCircle(coinX, coinY, 12);
          
          // Border
          currentGraphics.lineStyle(2, 0xffffff, 1);
          currentGraphics.strokeCircle(coinX, coinY, 12);
          
          // Value text - แสดงมูลค่าเหรียญ (แสดงด้านล่างเหรียญ)
          const coinValueToDisplay = coin.value !== undefined && coin.value !== null ? coin.value : 10;
          if (currentGraphics.scene) {
            const text = currentGraphics.scene.add.text(coinX, coinY + 20, coinValueToDisplay.toString(), {
              fontSize: '14px',
              color: '#000000',
              fontStyle: 'bold',
              backgroundColor: '#FFD700',
              padding: { x: 6, y: 3 },
            });
            text.setOrigin(0.5);
            text.setDepth(100); // ให้อยู่บนสุด
            coinTextsRef.current.push(text); // เก็บไว้เพื่อลบทีหลัง
          }
        }
      });
    }

    // Draw people
    if (currentFormData.people && currentFormData.people.length > 0) {
      currentFormData.people.forEach(person => {
        const personX = person.x;
        const personY = person.y;
        
        if (personX !== undefined && personY !== undefined) {
          // Shadow
          currentGraphics.fillStyle(0x000000, 0.3);
          currentGraphics.fillCircle(personX + 2, personY + 2, 10);
          
          // Person circle (green)
          currentGraphics.fillStyle(0x10b981, 1);
          currentGraphics.fillCircle(personX, personY, 10);
          
          // Border
          currentGraphics.lineStyle(2, 0xffffff, 1);
          currentGraphics.strokeCircle(personX, personY, 10);
          
          // Person emoji
          if (currentGraphics.scene) {
            const text = currentGraphics.scene.add.text(personX, personY, '👤', {
              fontSize: '12px',
            });
            text.setOrigin(0.5);
          }
        }
      });
    }

    // Draw treasures
    if (currentFormData.treasures && currentFormData.treasures.length > 0) {
      currentFormData.treasures.forEach(treasure => {
        const treasureX = treasure.x;
        const treasureY = treasure.y;
        
        if (treasureX !== undefined && treasureY !== undefined) {
          // Shadow
          currentGraphics.fillStyle(0x000000, 0.3);
          currentGraphics.fillCircle(treasureX + 2, treasureY + 2, 10);
          
          // Treasure circle (purple)
          currentGraphics.fillStyle(0x9333ea, 1);
          currentGraphics.fillCircle(treasureX, treasureY, 10);
          
          // Border
          currentGraphics.lineStyle(2, 0xffffff, 1);
          currentGraphics.strokeCircle(treasureX, treasureY, 10);
          
          // Treasure emoji
          if (currentGraphics.scene) {
            const text = currentGraphics.scene.add.text(treasureX, treasureY, '💎', {
              fontSize: '12px',
            });
            text.setOrigin(0.5);
          }
        }
      });
    }

    // Draw obstacles
    if (currentFormData.obstacles && currentFormData.obstacles.length > 0) {
      currentFormData.obstacles.forEach((obstacle, index) => {
        if (obstacle.points && obstacle.points.length >= 3) {
          // Draw polygon obstacle (pit)
          // Shadow
          currentGraphics.fillStyle(0x000000, 0.3);
          currentGraphics.beginPath();
          currentGraphics.moveTo(obstacle.points[0].x + 2, obstacle.points[0].y + 2);
          for (let i = 1; i < obstacle.points.length; i++) {
            currentGraphics.lineTo(obstacle.points[i].x + 2, obstacle.points[i].y + 2);
          }
          currentGraphics.closePath();
          currentGraphics.fillPath();
          
          // Obstacle fill
          currentGraphics.fillStyle(0x000000, 0.8); // Black with transparency
          currentGraphics.beginPath();
          currentGraphics.moveTo(obstacle.points[0].x, obstacle.points[0].y);
          for (let i = 1; i < obstacle.points.length; i++) {
            currentGraphics.lineTo(obstacle.points[i].x, obstacle.points[i].y);
          }
          currentGraphics.closePath();
          currentGraphics.fillPath();
          
          // Border
          currentGraphics.lineStyle(3, 0x8b4513, 1); // Brown border
          currentGraphics.strokePath();
          
          // Draw corner handles for editing (small squares)
          currentGraphics.fillStyle(0xffff00, 1); // Yellow handles
          obstacle.points.forEach(point => {
            currentGraphics.fillRect(point.x - 4, point.y - 4, 8, 8);
            currentGraphics.lineStyle(2, 0x000000, 1);
            currentGraphics.strokeRect(point.x - 4, point.y - 4, 8, 8);
          });
        } else if (obstacle.x && obstacle.y) {
          // Legacy format - draw as square
          // Shadow
          currentGraphics.fillStyle(0x000000, 0.3);
          currentGraphics.fillRect(obstacle.x - 12 + 2, obstacle.y - 12 + 2, 24, 24);
          
          // Obstacle square
          currentGraphics.fillStyle(0x8b4513, 1); // Brown
          currentGraphics.fillRect(obstacle.x - 12, obstacle.y - 12, 24, 24);
          
          // Border
          currentGraphics.lineStyle(2, 0xffffff, 1);
          currentGraphics.strokeRect(obstacle.x - 12, obstacle.y - 12, 24, 24);
        }
      });
    }
    
    // Draw preview rectangle while dragging
    if (isDraggingObstacleRef.current && obstacleDragStartRef.current && obstacleDragEndRef.current) {
      const start = obstacleDragStartRef.current;
      const end = obstacleDragEndRef.current;
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const maxY = Math.max(start.y, end.y);
      
      // Draw preview rectangle with dashed line effect
      currentGraphics.lineStyle(2, 0x00ff00, 0.8); // Green dashed preview
      currentGraphics.strokeRect(minX, minY, maxX - minX, maxY - minY);
      
      // Fill preview
      currentGraphics.fillStyle(0x00ff00, 0.2); // Light green fill
      currentGraphics.fillRect(minX, minY, maxX - minX, maxY - minY);
    }
  };

  const createPhaserScene = (scene) => {
    try {
      if (!scene || !scene.add) {
        return;
      }
      
      const phaserGraphics = scene.add.graphics();
      phaserGraphicsRef.current = phaserGraphics;
      
      // Load background image if exists
      const loadBackground = () => {
        // Get current backgroundImageUrl from ref (always up-to-date)
        const currentBgUrl = backgroundImageUrlRef.current;
        
        if (currentBgUrl) {
          let imageUrl = currentBgUrl;
          if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('http')) {
            imageUrl = `${API_BASE_URL}${currentBgUrl}`;
          }
          
          // Remove old sprite first
          const oldSprite = backgroundSpriteRef.current;
          if (oldSprite) {
            oldSprite.destroy();
            backgroundSpriteRef.current = null;
          }
          
          // Wait a frame before removing texture
          setTimeout(() => {
            // Check if image already loaded
            if (scene.textures.exists('background')) {
              scene.textures.remove('background');
            }
            
            // For data URLs, we need to use a different approach
            if (imageUrl.startsWith('data:')) {
              // Create image element and load it
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => {
                try {
                  // Check if texture exists before adding
                  if (scene.textures.exists('background')) {
                    scene.textures.remove('background');
                  }
                  // Add image to texture manager
                  scene.textures.addImage('background', img);
                  const newSprite = scene.add.image(
                    scene.scale.width / 2, 
                    scene.scale.height / 2, 
                    'background'
                  );
                  backgroundSpriteRef.current = newSprite;
                  newSprite.setDisplaySize(scene.scale.width, scene.scale.height);
                  newSprite.setDepth(0);
                  newSprite.setVisible(true);
                  if (phaserGraphicsRef.current) {
                    phaserGraphicsRef.current.setDepth(1);
                  }
                  redrawPhaser();
                } catch (err) {
                  // Error creating background sprite
                }
              };
              img.onerror = () => {
                scene.cameras.main.setBackgroundColor(0x000000);
                redrawPhaser();
              };
              img.src = imageUrl;
            } else {
              // For regular URLs
              scene.load.image('background', imageUrl);
              scene.load.once('filecomplete-image-background', () => {
                const newSprite = scene.add.image(
                  scene.scale.width / 2, 
                  scene.scale.height / 2, 
                  'background'
                );
                backgroundSpriteRef.current = newSprite;
                newSprite.setDisplaySize(scene.scale.width, scene.scale.height);
                newSprite.setDepth(0);
                newSprite.setVisible(true);
                if (phaserGraphicsRef.current) {
                    phaserGraphicsRef.current.setDepth(1);
                  }
                redrawPhaser();
              });
              scene.load.once('loaderror', () => {
                scene.cameras.main.setBackgroundColor(0x000000);
                redrawPhaser();
              });
              scene.load.start();
            }
          }, 50);
        } else {
          // Black background
          scene.cameras.main.setBackgroundColor(0x000000);
          redrawPhaser();
        }
      };
      
      // Load background after a short delay to ensure scene is ready
      setTimeout(() => {
        loadBackground();
      }, 200);
      
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
      
      // Initial draw
      setTimeout(() => {
        redrawPhaser();
      }, 100);
    } catch (error) {
      // Error in createPhaserScene
    }
  };

  const updatePhaserScene = (scene) => {
    redrawPhaser();
  };

  // Redraw when formData changes
  useEffect(() => {
    if (phaserLoaded && phaserGraphicsRef.current) {
      redrawPhaser();
    }
  }, [formData.nodes, formData.edges, formData.start_node_id, formData.goal_node_id, formData.obstacles, formData.coin_positions, formData.people, formData.treasures, selectedNode, phaserLoaded]);

  // Reload background image when it changes
  useEffect(() => {
    const game = phaserGameRef.current;
    if (!phaserLoaded || !game || !game.scene || game.scene.scenes.length === 0) {
      return;
    }
    
    const scene = game.scene.scenes[0];
    const currentGraphics = phaserGraphicsRef.current;
    const currentSprite = backgroundSpriteRef.current;
    const currentBgUrl = backgroundImageUrl;
    
    if (scene && currentBgUrl) {
      let imageUrl = currentBgUrl;
      if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('http')) {
        imageUrl = `${API_BASE_URL}${currentBgUrl}`;
      }
      
      // Remove old sprite FIRST before removing texture
      if (currentSprite) {
        currentSprite.destroy();
        backgroundSpriteRef.current = null;
      }
      
      // Wait a frame to ensure sprite is destroyed
      setTimeout(() => {
        // Remove old texture after sprite is destroyed
        if (scene.textures.exists('background')) {
          scene.textures.remove('background');
        }
        
        // For data URLs, use Image element
        if (imageUrl.startsWith('data:')) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            try {
              // Check if texture exists before adding
              if (scene.textures.exists('background')) {
                scene.textures.remove('background');
              }
              scene.textures.addImage('background', img);
              const newSprite = scene.add.image(
                scene.scale.width / 2, 
                scene.scale.height / 2, 
                'background'
              );
              backgroundSpriteRef.current = newSprite;
              newSprite.setDisplaySize(scene.scale.width, scene.scale.height);
              newSprite.setDepth(0);
              newSprite.setVisible(true);
              if (currentGraphics) {
                currentGraphics.setDepth(1);
              }
              redrawPhaser();
            } catch (err) {
              // Error creating background sprite
            }
          };
          img.onerror = () => {
            scene.cameras.main.setBackgroundColor(0x000000);
            redrawPhaser();
          };
          img.src = imageUrl;
        } else {
          // For regular URLs
          scene.load.image('background', imageUrl);
          scene.load.once('filecomplete-image-background', () => {
            const newSprite = scene.add.image(
              scene.scale.width / 2, 
              scene.scale.height / 2, 
              'background'
            );
            backgroundSpriteRef.current = newSprite;
            newSprite.setDisplaySize(scene.scale.width, scene.scale.height);
            newSprite.setDepth(0);
            newSprite.setVisible(true);
            if (currentGraphics) {
              currentGraphics.setDepth(1);
            }
            redrawPhaser();
          });
          scene.load.once('loaderror', () => {
            scene.cameras.main.setBackgroundColor(0x000000);
            redrawPhaser();
          });
          scene.load.start();
        }
      }, 50);
    } else if (scene && !currentBgUrl) {
      // Remove background if no image
      if (backgroundSpriteRef.current) {
        backgroundSpriteRef.current.destroy();
        backgroundSpriteRef.current = null;
      }
      scene.cameras.main.setBackgroundColor(0x000000);
      redrawPhaser();
    }
  }, [backgroundImageUrl, phaserLoaded]);

  // Initialize Phaser
  useEffect(() => {
    if (!phaserLoaded || !gameRef.current) {
      return;
    }
    
    // Check if game already exists
    if (phaserGameRef.current) {
      return;
    }
    
    const initializePhaser = () => {
      if (typeof window !== 'undefined' && window.Phaser && window.Phaser.Game) {
        if (gameRef.current) {
          class EditorScene extends window.Phaser.Scene {
            constructor() {
              super({ key: 'EditorScene' });
            }
            
            create() {
              createPhaserScene(this);
            }
            
            update() {
              updatePhaserScene(this);
            }
          }

          const config = {
            type: window.Phaser.AUTO,
            width: canvasSize.width,
            height: canvasSize.height,
            parent: gameRef.current,
            backgroundColor: '#000000',
            scene: EditorScene,
            physics: {
              default: 'arcade',
              arcade: {
                debug: false
              }
            }
          };

          try {
            const phaserGame = new window.Phaser.Game(config);
            phaserGameRef.current = phaserGame;
          } catch (error) {
            // Error creating Phaser game
          }
        }
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      initializePhaser();
    }, 100);

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
        phaserGraphicsRef.current = null;
        backgroundSpriteRef.current = null;
      }
    };
  }, [phaserLoaded, gameRef.current, canvasSize]);

  // Load Phaser script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Phaser) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.55.2/phaser.min.js';
      script.onload = () => {
        setPhaserLoaded(true);
      };
      script.onerror = () => {
        // Failed to load Phaser script
      };
      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    } else if (typeof window !== 'undefined' && window.Phaser) {
      setPhaserLoaded(true);
    }
  }, []);

  return (
    <div className="relative border-2 border-gray-300 rounded-lg bg-black overflow-hidden">
      {!phaserLoaded && typeof window !== 'undefined' && !window.Phaser ? (
        <div className="w-full h-[900px] flex items-center justify-center text-white">
          <div className="text-center">
            <div className="text-lg mb-2">⏳ กำลังโหลด Level Editor...</div>
            <div className="text-sm text-gray-400">กรุณารอสักครู่</div>
          </div>
        </div>
      ) : (
        <div ref={gameRef} id="phaser-game-container" style={{ width: '100%', height: '900px', display: 'flex', justifyContent: 'center' }}></div>
      )}
    </div>
  );
};

export default PhaserMapEditor;

