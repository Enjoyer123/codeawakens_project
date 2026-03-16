import { useCallback, useRef } from 'react';
import { ITEM_TYPES } from '@/constants/itemTypes';

const HIT_THRESHOLD = 20;

export const usePhaserMapInteractions = ({
  formDataRef, selectedNodeRef, currentModeRef, coinValueRef, edgeWeightRef,
  selectedCategoryRef, obstacleDragStartRef, obstacleDragEndRef, isDraggingObstacleRef,
  editingObstacleIndexRef, onFormDataChange, onSelectedNodeChange, onAddMonsterRequest,
  onEditEntityRequest, redrawPhaser, showAlert
}) => {
  const onAddMonsterReqRef = useRef(onAddMonsterRequest);
  onAddMonsterReqRef.current = onAddMonsterRequest;

  const onEditEntityReqRef = useRef(onEditEntityRequest);
  onEditEntityReqRef.current = onEditEntityRequest;

  const lastClickTimeRef = useRef(0);

  // --- Utility Helpers ---
  const isItemEnabled = (itemName) => {
    const category = selectedCategoryRef.current;
    if (!category?.item_enable) return false;

    // Handle Array of items relationship
    if (Array.isArray(category.category_items)) {
      return category.category_items.some(ci => ci.item_type === itemName);
    }

    // Legacy String parsing handling
    try {
      const parsedItems = typeof category.item === 'string' ? JSON.parse(category.item) : category.item;
      return Array.isArray(parsedItems) && parsedItems.includes(itemName);
    } catch {
      return false;
    }
  };

  const isWeightedCategory = () => {
    const category = selectedCategoryRef.current;
    const catName = (category?.category_name || '').toLowerCase();

    // Abstracting the specific algorithm string matching behind a boolean rule Check
    return catName.includes('shortest path') || catName.includes('minimum spanning tree') ||
      catName.includes('dijkstra') || catName.includes('prim') || catName.includes('kruskal');
  };

  const getEntities = (type) => (formDataRef.current.map_entities || []).filter(e => e.entity_type === type);
  const generateId = (items) => items.length > 0 ? Math.max(...items.map(i => i.id || 0)) + 1 : 0;


  // --- Hit Detection ---
  const findNodeAt = (x, y) => formDataRef.current.nodes.find(n =>
    Math.abs(n.x - x) < HIT_THRESHOLD && Math.abs(n.y - y) < HIT_THRESHOLD
  );

  const findObstacleAt = (x, y) => {
    const entities = formDataRef.current.map_entities || [];
    for (let i = 0; i < entities.length; i++) {
      const obs = entities[i];
      if (obs.entity_type !== 'OBSTACLE') continue;

      if (obs.points?.length >= 3) {
        const minX = Math.min(...obs.points.map(p => p.x)), maxX = Math.max(...obs.points.map(p => p.x));
        const minY = Math.min(...obs.points.map(p => p.y)), maxY = Math.max(...obs.points.map(p => p.y));
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) return { obstacle: obs, index: i };
      } else if (obs.x && obs.y && Math.abs(obs.x - x) < HIT_THRESHOLD && Math.abs(obs.y - y) < HIT_THRESHOLD) {
        return { obstacle: obs, index: i };
      }
    }
    return null;
  };

  const findEntityAt = (x, y) => {
    const node = findNodeAt(x, y);
    if (node) return { type: 'node', data: node, id: node.id };

    const entities = formDataRef.current.map_entities || [];
    for (let i = 0; i < entities.length; i++) {
      const ent = entities[i];
      if (ent.entity_type === 'COIN' || ent.entity_type === 'PEOPLE') {
        if (Math.abs(ent.x - x) < HIT_THRESHOLD && Math.abs(ent.y - y) < HIT_THRESHOLD) {
          return { type: ent.entity_type.toLowerCase(), data: ent, index: i };
        }
      } else if (ent.entity_type === 'MONSTER') {
        const mX = ent.x || formDataRef.current.nodes.find(n => n.id === ent.startNode)?.x || 0;
        const mY = ent.y || formDataRef.current.nodes.find(n => n.id === ent.startNode)?.y || 0;
        if (Math.abs(mX - x) < HIT_THRESHOLD && Math.abs(mY - y) < HIT_THRESHOLD) {
          return { type: 'monster', data: ent, index: i };
        }
      }
    }

    const obs = findObstacleAt(x, y);
    if (obs) return { type: 'obstacle', data: obs.obstacle, index: obs.index };

    return null;
  };

  // --- Dispatch Handlers ---
  const handlers = {
    node: (x, y, nodeAt) => {
      if (nodeAt) return; // Prevent Overlap
      const data = formDataRef.current;
      const newNode = { id: generateId(data.nodes), x: Math.round(x), y: Math.round(y) };
      onFormDataChange({ ...data, nodes: [...data.nodes, newNode] });
    },

    edge: (x, y, nodeAt, entityAt) => {
      if (!nodeAt) return;
      const data = formDataRef.current;
      const selected = selectedNodeRef.current;

      // Select first node if none active
      if (!selected) return onSelectedNodeChange(nodeAt);

      // Select second node
      if (selected.id !== nodeAt.id && !data.edges.some(e => (e.from === selected.id && e.to === nodeAt.id) || (e.from === nodeAt.id && e.to === selected.id))) {
        const val = Number(edgeWeightRef.current);
        const newEdge = { from: selected.id, to: nodeAt.id };
        if (isWeightedCategory()) newEdge.value = (!isNaN(val) && val > 0) ? val : 1;
        onFormDataChange({ ...data, edges: [...data.edges, newEdge] });
      }
      onSelectedNodeChange(null);
    },

    coin: (x, y, nodeAt, entityAt) => {
      if (entityAt?.type === 'coin') return;
      if (!isItemEnabled(ITEM_TYPES.COIN_POSITIONS)) { showAlert?.('คำเตือน', 'Coin ไม่ได้ถูก enable ใน category นี้'); return; }

      const val = Number(coinValueRef.current);
      const newCoin = { x: Math.round(x), y: Math.round(y), collected: false, id: generateId(getEntities('COIN')), value: (!isNaN(val) && val > 0) ? val : 10, entity_type: 'COIN' };
      onFormDataChange({ ...formDataRef.current, map_entities: [...(formDataRef.current.map_entities || []), newCoin] });
    },

    people: (x, y, nodeAt, entityAt) => {
      if (entityAt?.type === 'people') return;
      if (!isItemEnabled(ITEM_TYPES.PEOPLE)) { showAlert?.('คำเตือน', 'People ไม่ได้ถูก enable ใน category นี้'); return; }
      if (!nodeAt) { showAlert?.('คำเตือน', 'กรุณาคลิกที่ Node เพื่อเพิ่ม People'); return; }

      const id = generateId(getEntities('PEOPLE'));
      const newPerson = { x: Math.round(nodeAt.x), y: Math.round(nodeAt.y), id, nodeId: nodeAt.id, rescued: false, personName: `คนที่ ${id}`, entity_type: 'PEOPLE' };
      onFormDataChange({ ...formDataRef.current, map_entities: [...(formDataRef.current.map_entities || []), newPerson] });
    },

    monster: (x, y, nodeAt, entityAt) => {
      if (entityAt?.type === 'monster') return;
      if (onAddMonsterReqRef.current) return onAddMonsterReqRef.current(x, y, nodeAt);

      // Automatic Fallback setup 
      const data = formDataRef.current;
      const center = { x: Math.round(x), y: Math.round(y) };
      const patrol = [
        { x: center.x - 20, y: center.y - 22 }, { x: center.x + 20, y: center.y - 22 },
        { x: center.x + 20, y: center.y + 22 }, { x: center.x - 20, y: center.y + 22 }
      ];
      const newMonster = { id: generateId(getEntities('MONSTER')), name: '🧛 Vampire', hp: 3, damage: 100, type: 'vampire_1', x: center.x, y: center.y, startNode: nodeAt?.id || null, patrol, defeated: false, detectionRange: 60, entity_type: 'MONSTER' };
      onFormDataChange({ ...data, map_entities: [...(data.map_entities || []), newMonster] });
    },

    obstacle: (x, y, nodeAt, entityAt) => {
      isDraggingObstacleRef.current = true;
      if (entityAt?.type === 'obstacle' && entityAt?.data?.points?.length >= 3) {
        editingObstacleIndexRef.current = entityAt.index;
        const pts = entityAt.data.points;
        obstacleDragStartRef.current = { x: Math.min(...pts.map(p => p.x)), y: Math.min(...pts.map(p => p.y)) };
        obstacleDragEndRef.current = { x: Math.max(...pts.map(p => p.x)), y: Math.max(...pts.map(p => p.y)) };
      } else {
        editingObstacleIndexRef.current = null;
        obstacleDragStartRef.current = { x: Math.round(x), y: Math.round(y) };
        obstacleDragEndRef.current = { x: Math.round(x), y: Math.round(y) };
      }
    },

    delete: (x, y, nodeAt, entityAt) => {
      const data = formDataRef.current;

      // Delete free-standing Entities
      if (entityAt && entityAt.type !== 'node') {
        const name = entityAt.type === 'monster' ? entityAt.data.name : entityAt.type;
        showAlert('ยืนยันการลบ', `ลบ ${name}?`, () => {
          onFormDataChange({ ...data, map_entities: data.map_entities.filter((_, i) => i !== entityAt.index) });
        }, { showCancel: true });
        return;
      }

      // Delete Graph Nodes and bound edges/entities
      if (nodeAt) {
        showAlert('ยืนยันการลบ', `ลบ Node ${nodeAt.id}?`, () => {
          onFormDataChange({
            ...data,
            nodes: data.nodes.filter(n => n.id !== nodeAt.id),
            edges: data.edges.filter(e => e.from !== nodeAt.id && e.to !== nodeAt.id),
            start_node_id: data.start_node_id === nodeAt.id ? null : data.start_node_id,
            goal_node_id: data.goal_node_id === nodeAt.id ? null : data.goal_node_id,
            map_entities: (data.map_entities || []).filter(e => e.entity_type === 'MONSTER' || e.entity_type === 'OBSTACLE' || e.nodeId !== nodeAt.id)
          });
        }, { showCancel: true });
      }
    },

    start: (x, y, nodeAt) => { if (nodeAt) onFormDataChange({ ...formDataRef.current, start_node_id: nodeAt.id }); },
    goal: (x, y, nodeAt) => { if (nodeAt) onFormDataChange({ ...formDataRef.current, goal_node_id: nodeAt.id }); }
  };

  const setupInteractionEvents = useCallback((scene, canvasSize) => {
    const zone = scene.add.zone(canvasSize.width / 2, canvasSize.height / 2, canvasSize.width, canvasSize.height).setInteractive();

    zone.on('pointerdown', (pointer) => {
      const now = scene.time.now;
      if (now - lastClickTimeRef.current < 300) {
        // Double Click Dispatch
        const entity = findEntityAt(pointer.x, pointer.y);
        if (entity && onEditEntityReqRef.current) onEditEntityReqRef.current(entity);
      } else {
        // Single Click Dispatch Route
        const mode = currentModeRef.current;
        if (handlers[mode]) {
          handlers[mode](pointer.x, pointer.y, findNodeAt(pointer.x, pointer.y), findEntityAt(pointer.x, pointer.y));
        }
      }
      lastClickTimeRef.current = now;
    });

    scene.input.on('pointermove', (pointer) => {
      const mode = currentModeRef.current;
      if (mode === 'obstacle' && isDraggingObstacleRef.current) {
        obstacleDragEndRef.current = { x: Math.round(pointer.x), y: Math.round(pointer.y) };
        redrawPhaser();
      }
      scene.input.setDefaultCursor(mode === 'delete' ? (findEntityAt(pointer.x, pointer.y) ? 'pointer' : 'default') : mode === 'obstacle' ? 'crosshair' : 'default');
    });

    scene.input.on('pointerup', () => {
      if (currentModeRef.current === 'obstacle' && isDraggingObstacleRef.current && obstacleDragStartRef.current && obstacleDragEndRef.current) {
        const start = obstacleDragStartRef.current, end = obstacleDragEndRef.current;
        const pts = [
          { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y) },
          { x: Math.max(start.x, end.x), y: Math.min(start.y, end.y) },
          { x: Math.max(start.x, end.x), y: Math.max(start.y, end.y) },
          { x: Math.min(start.x, end.x), y: Math.max(start.y, end.y) }
        ];

        if (Math.abs(pts[1].x - pts[0].x) > 10 && Math.abs(pts[2].y - pts[0].y) > 10) {
          const data = formDataRef.current;
          if (editingObstacleIndexRef.current !== null) {
            const ents = [...data.map_entities];
            ents[editingObstacleIndexRef.current] = { ...ents[editingObstacleIndexRef.current], type: 'pit', points: pts };
            onFormDataChange({ ...data, map_entities: ents });
          } else {
            const newObs = { id: generateId(getEntities('OBSTACLE')), type: 'pit', entity_type: 'OBSTACLE', points: pts };
            onFormDataChange({ ...data, map_entities: [...(data.map_entities || []), newObs] });
          }
        }

        isDraggingObstacleRef.current = false;
        obstacleDragStartRef.current = null;
        obstacleDragEndRef.current = null;
        redrawPhaser();
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redrawPhaser]); // Handlers read from refs continuously, no deep reactivity needed here for events

  return { setupInteractionEvents };
};
