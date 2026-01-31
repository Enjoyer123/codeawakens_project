import { useRef, useCallback } from 'react';

import { API_BASE_URL } from '../../../../config/apiConfig';

export const usePhaserMapRenderer = ({
  canvasSize,
  formDataRef,
  selectedNodeRef,
  phaserGraphicsRef,
  coinTextsRef,
  backgroundSpriteRef,
  obstacleDragStartRef,
  obstacleDragEndRef,
  isDraggingObstacleRef,
  backgroundImageUrlRef // Add this ref
}) => {

  const redrawPhaser = useCallback(() => {
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

        // แสดง edge weight ถ้ามี
        if (edge.value !== undefined && edge.value !== null && !isNaN(Number(edge.value))) {
          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2;
          if (currentGraphics.scene) {
            const weightText = currentGraphics.scene.add.text(midX, midY, edge.value.toString(), {
              fontSize: '14px',
              color: '#000000',
              fontStyle: 'bold',
              backgroundColor: '#FFD700',
              padding: { x: 6, y: 3 },
            });
            weightText.setOrigin(0.5);
            weightText.setDepth(100);
            coinTextsRef.current.push(weightText); // เก็บไว้เพื่อลบทีหลัง

            if (process.env.NODE_ENV === 'development') {
              console.log('Drawing edge weight:', edge.value, 'at', midX, midY);
            }
          }
        }
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

      // Node ID Text
      if (currentGraphics.scene) {
        const idText = currentGraphics.scene.add.text(node.x, node.y, node.id.toString(), {
          fontSize: '12px',
          color: '#ffffff',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3,
          align: 'center'
        });
        idText.setOrigin(0.5, 0.5);
        idText.setDepth(150);
        coinTextsRef.current.push(idText);
      }
    });

    // Draw monsters
    if (currentFormData.monsters && currentFormData.monsters.length > 0) {
      currentGraphics.fillStyle(0xff0000, 1);
      currentFormData.monsters.forEach(monster => {
        // Draw monster at x, y position
        const monsterX = monster.x || (monster.startNode ? currentFormData.nodes.find(n => n.id === monster.startNode)?.x : 0);
        const monsterY = monster.y || (monster.startNode ? currentFormData.nodes.find(n => n.id === monster.startNode)?.y : 0);

        if (monsterX && monsterY) {
          const mType = monster.type || 'vampire_1';
          const isVampire = mType === 'vampire_1';
          const isVampire2 = mType === 'vampire_2';
          const isVampire3 = mType === 'vampire_3';

          // Shadow
          currentGraphics.fillStyle(0x000000, 0.3);
          currentGraphics.fillCircle(monsterX + 2, monsterY + 2, 15);

          // Monster circle - Green for Goblin, Purple for Vampire (or red for enemy)
          let mColor = 0xff0000; // Red for default/goblin
          let mEmoji = '👹';

          if (isVampire) {
            mColor = 0x9333ea; // Purple
            mEmoji = '🧛';
          } else if (isVampire2) {
            mColor = 0x8B0000;
            mEmoji = '🧛';
          } else if (isVampire3) {
            mColor = 0x8B0000;
            mEmoji = '🧛';
          } else if (mType === 'slime_1') {
            mColor = 0x00ff00; // Green
            mEmoji = '💧';
          }

          currentGraphics.fillStyle(mColor, 1);
          currentGraphics.fillCircle(monsterX, monsterY, 15);

          // Border
          currentGraphics.lineStyle(2, 0xffffff, 1);
          currentGraphics.strokeCircle(monsterX, monsterY, 15);

          // Monster emoji text
          if (currentGraphics.scene) {
            const text = currentGraphics.scene.add.text(monsterX, monsterY, mEmoji, {
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
  }, [
    canvasSize,
    formDataRef,
    selectedNodeRef,
    phaserGraphicsRef,
    coinTextsRef,
    obstacleDragStartRef,
    obstacleDragEndRef,
    isDraggingObstacleRef
  ]);

  return { redrawPhaser };
};
