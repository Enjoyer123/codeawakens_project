import { useCallback } from 'react';

// Depth constants to manage layering cleanly
const DEPTH = {
  BACKGROUND: 0,
  GRID_AND_EDGES: 1,
  OBSTACLES: 50,
  TEXT_OVERLAYS: 100,
  NODES: 150,
  MONSTER_SHADOW: 199,
  MONSTERS: 200,
};

export const usePhaserMapRenderer = ({
  canvasSize,
  formDataRef,
  selectedNodeRef,
  phaserGraphicsRef,
  coinTextsRef,
  obstacleDragStartRef,
  obstacleDragEndRef,
  isDraggingObstacleRef
}) => {
  // Alias coinTextsRef to a better name internally since it holds all overlays (texts/icons/shadows)
  const overlayObjectsRef = coinTextsRef;

  const clearOverlays = () => {
    overlayObjectsRef.current.forEach(obj => obj && typeof obj.destroy === 'function' && obj.destroy());
    overlayObjectsRef.current = [];
  };

  const drawGrid = (graphics, width, height) => {
    graphics.lineStyle(1, 0x4a5568, 0.3);
    for (let i = 0; i < width; i += 50) graphics.lineBetween(i, 0, i, height);
    for (let i = 0; i < height; i += 50) graphics.lineBetween(0, i, width, i);
  };

  const drawEdges = (graphics, scene, edges, nodes) => {
    graphics.lineStyle(3, 0xffd700, 1);
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      if (!fromNode || !toNode) return;

      graphics.lineBetween(fromNode.x, fromNode.y, toNode.x, toNode.y);

      // Support Edge Weights
      if (edge.value != null && !isNaN(Number(edge.value))) {
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;
        const weightText = scene.add.text(midX, midY, edge.value.toString(), {
          fontSize: '14px', color: '#000000', fontStyle: 'bold',
          backgroundColor: '#FFD700', padding: { x: 6, y: 3 }
        });
        weightText.setOrigin(0.5).setDepth(DEPTH.TEXT_OVERLAYS);
        overlayObjectsRef.current.push(weightText);
      }
    });
  };

  const drawNodes = (graphics, scene, nodes, selectedNode, startNodeId, goalNodeId) => {
    nodes.forEach(node => {
      const isStart = node.id === startNodeId;
      const isGoal = node.id === goalNodeId;
      const isSelected = selectedNode?.id === node.id;

      // Shadow
      graphics.fillStyle(0x000000, 0.3).fillCircle(node.x + 2, node.y + 2, 18);

      // Node Fill
      const nodeColor = isStart ? 0x10b981 : isGoal ? 0xf59e0b : isSelected ? 0xfbbf24 : 0x667eea;
      graphics.fillStyle(nodeColor, 1).fillCircle(node.x, node.y, 18);
      
      // Border
      graphics.lineStyle(3, 0xffffff, 1).strokeCircle(node.x, node.y, 18);

      // ID Text
      const idText = scene.add.text(node.x, node.y, node.id.toString(), {
        fontSize: '12px', color: '#ffffff', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 3, align: 'center'
      });
      idText.setOrigin(0.5, 0.5).setDepth(DEPTH.NODES);
      overlayObjectsRef.current.push(idText);
    });
  };

  const drawMonsters = (graphics, scene, monsters, nodes) => {
    monsters.forEach(monster => {
      const x = monster.x || nodes.find(n => n.id === monster.startNode)?.x;
      const y = monster.y || nodes.find(n => n.id === monster.startNode)?.y;
      if (!x || !y) return;

      const keysMap = { vampire_2: 'vampire_2', vampire_3: 'vampire_3', slime_1: 'slime_1' };
      const textureKey = keysMap[monster.type] || 'vampire_1';

      const shadow = scene.add.image(x + 2, y + 2, textureKey)
        .setDisplaySize(50, 50).setTint(0x000000).setAlpha(0.3).setDepth(DEPTH.MONSTER_SHADOW);
      const sprite = scene.add.image(x, y, textureKey)
        .setDisplaySize(50, 50).setDepth(DEPTH.MONSTERS);
      
      overlayObjectsRef.current.push(shadow, sprite);
    });
  };

  const drawCoins = (graphics, scene, coins) => {
    coins.forEach(coin => {
      if (coin.x == null || coin.y == null) return;
      
      graphics.fillStyle(0x000000, 0.3).fillCircle(coin.x + 2, coin.y + 2, 12);
      graphics.fillStyle(0xffd700, 1).fillCircle(coin.x, coin.y, 12);
      graphics.lineStyle(2, 0xffffff, 1).strokeCircle(coin.x, coin.y, 12);

      const valText = scene.add.text(coin.x, coin.y + 20, (coin.value ?? 10).toString(), {
        fontSize: '14px', color: '#000000', fontStyle: 'bold',
        backgroundColor: '#FFD700', padding: { x: 6, y: 3 }
      });
      valText.setOrigin(0.5).setDepth(DEPTH.TEXT_OVERLAYS);
      overlayObjectsRef.current.push(valText);
    });
  };

  const drawPeople = (graphics, scene, people) => {
    people.forEach(person => {
      if (person.x == null || person.y == null) return;

      const pGraph = scene.add.graphics().setDepth(DEPTH.TEXT_OVERLAYS);
      pGraph.fillStyle(0x000000, 0.3).fillCircle(person.x + 2, person.y + 2, 12);
      pGraph.fillStyle(0x3b82f6, 1).fillCircle(person.x, person.y, 12);
      pGraph.lineStyle(2, 0xffffff, 1).strokeCircle(person.x, person.y, 12);
      
      const icon = scene.add.text(person.x, person.y, '👤', { fontSize: '14px' });
      icon.setOrigin(0.5).setDepth(DEPTH.TEXT_OVERLAYS + 1);
      
      overlayObjectsRef.current.push(pGraph, icon);
    });
  };

  const drawObstacles = (graphics, obstacles) => {
    obstacles.forEach(obstacle => {
      if (obstacle.points?.length >= 3) {
        // Shadow Polygon
        graphics.fillStyle(0x000000, 0.3).beginPath().moveTo(obstacle.points[0].x + 2, obstacle.points[0].y + 2);
        for (let i = 1; i < obstacle.points.length; i++) graphics.lineTo(obstacle.points[i].x + 2, obstacle.points[i].y + 2);
        graphics.closePath().fillPath();

        // Object Fill
        graphics.fillStyle(0x000000, 0.8).beginPath().moveTo(obstacle.points[0].x, obstacle.points[0].y);
        for (let i = 1; i < obstacle.points.length; i++) graphics.lineTo(obstacle.points[i].x, obstacle.points[i].y);
        graphics.closePath().fillPath();
        
        // Settings & Corners
        graphics.lineStyle(3, 0x8b4513, 1).strokePath().fillStyle(0xffff00, 1);
        obstacle.points.forEach(p => {
          graphics.fillRect(p.x - 4, p.y - 4, 8, 8);
          graphics.lineStyle(2, 0x000000, 1).strokeRect(p.x - 4, p.y - 4, 8, 8);
        });
      } else if (obstacle.x && obstacle.y) {
        // Legacy Square
        graphics.fillStyle(0x000000, 0.3).fillRect(obstacle.x - 10, obstacle.y - 10, 24, 24);
        graphics.fillStyle(0x8b4513, 1).fillRect(obstacle.x - 12, obstacle.y - 12, 24, 24);
        graphics.lineStyle(2, 0xffffff, 1).strokeRect(obstacle.x - 12, obstacle.y - 12, 24, 24);
      }
    });
  };

  const drawPreviewSelection = (graphics) => {
    if (!isDraggingObstacleRef.current || !obstacleDragStartRef.current || !obstacleDragEndRef.current) return;
    const start = obstacleDragStartRef.current, end = obstacleDragEndRef.current;
    
    // Calculate Rect Frame
    const minX = Math.min(start.x, end.x), maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y), maxY = Math.max(start.y, end.y);

    graphics.lineStyle(2, 0x00ff00, 0.8).strokeRect(minX, minY, maxX - minX, maxY - minY);
    graphics.fillStyle(0x00ff00, 0.2).fillRect(minX, minY, maxX - minX, maxY - minY);
  };

  const redrawPhaser = useCallback(() => {
    const graphics = phaserGraphicsRef.current;
    if (!graphics || !graphics.scene) return;

    const data = formDataRef.current;
    const scene = graphics.scene;
    
    // Group Entities by type
    const entities = data.map_entities || [];
    const entityGroups = { MONSTER: [], COIN: [], PEOPLE: [], OBSTACLE: [] };
    entities.forEach(e => { if (entityGroups[e.entity_type]) entityGroups[e.entity_type].push(e); });

    // Cleanup previous overlays and wipe board
    clearOverlays();
    graphics.clear();
    
    // Render pipeline
    drawGrid(graphics, canvasSize.width, canvasSize.height);
    drawEdges(graphics, scene, data.edges, data.nodes);
    drawNodes(graphics, scene, data.nodes, selectedNodeRef.current, data.start_node_id, data.goal_node_id);
    drawObstacles(graphics, entityGroups.OBSTACLE);
    drawMonsters(graphics, scene, entityGroups.MONSTER, data.nodes);
    drawCoins(graphics, scene, entityGroups.COIN);
    drawPeople(graphics, scene, entityGroups.PEOPLE);
    drawPreviewSelection(graphics);

  }, [
    canvasSize, formDataRef, selectedNodeRef, phaserGraphicsRef, 
    isDraggingObstacleRef, obstacleDragStartRef, obstacleDragEndRef
  ]); 

  return { redrawPhaser };
};
