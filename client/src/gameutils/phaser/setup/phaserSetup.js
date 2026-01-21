// Phaser setup functions
import Phaser from "phaser";
import { playIdle } from '../player/playerAnimation';
import { updatePlayerArrow } from '../effects/phaserGameArrow';

// Game functions (outside of scene)
export function drawLevel(scene) {
  if (!scene || !scene.levelData) {
    console.warn('⚠️ Scene or levelData is null, cannot draw level');
    return;
  }

  // ตรวจสอบว่า scene.add มีอยู่จริง
  if (!scene.add) {
    console.error('❌ Scene.add is null, scene may not be ready yet');
    return;
  }

  // 🎨 วาด Background Image ก่อน
  console.log('🎨 Drawing background image...');
  if (scene.textures && scene.textures.exists('bg')) {
    try {
      const bg = scene.add.image(600, 450, 'bg');
      bg.setDisplaySize(scene.scale.width, scene.scale.height);
      bg.setPosition(scene.scale.width / 2, scene.scale.height / 2);
      console.log('✅ Background image drawn successfully');
    } catch (error) {
      console.error('❌ Error creating background image:', error);
    }
  } else {
    console.warn('⚠️ Background texture "bg" not found!');
  }

  let graphics;
  try {
    graphics = scene.add.graphics();
  } catch (error) {
    console.error('❌ Error creating graphics:', error);
    return;
  }
  graphics.setDepth(1);

  // Initialize node labels array if it doesn't exist
  if (!scene.nodeLabels) {
    scene.nodeLabels = [];
  } else {
    // Clean up existing labels
    scene.nodeLabels.forEach(label => {
      if (label && label.destroy) {
        label.destroy();
      }
    });
    scene.nodeLabels = [];
  }

  // Initialize edge weight labels array if it doesn't exist
  if (!scene.edgeWeightLabels) {
    scene.edgeWeightLabels = [];
  } else {
    // Clean up existing edge weight labels
    scene.edgeWeightLabels.forEach(label => {
      if (label && label.destroy) {
        label.destroy();
      }
    });
    scene.edgeWeightLabels = [];
  }

  // Draw edges FIRST (behind nodes)
  if (!scene.levelData.edges || !Array.isArray(scene.levelData.edges)) {
    console.warn('⚠️ Edges is not an array:', scene.levelData.edges);
  } else {
    console.log(`🎨 Drawing ${scene.levelData.edges.length} edges...`);
  }

  graphics.lineStyle(3, 0xffd700, 1);
  if (scene.levelData.edges && Array.isArray(scene.levelData.edges)) {
    scene.levelData.edges.forEach((edge, index) => {
      try {
        const fromNode = scene.levelData.nodes.find((n) => n.id === edge.from);
        const toNode = scene.levelData.nodes.find((n) => n.id === edge.to);

        if (!fromNode || !toNode) {
          console.warn(`⚠️ Edge ${index}: Cannot find nodes for edge from ${edge.from} to ${edge.to}`);
          return;
        }

        graphics.lineBetween(fromNode.x, fromNode.y, toNode.x, toNode.y);

        // แสดง edge weight ถ้ามี
        if (edge.value !== undefined && edge.value !== null && !isNaN(Number(edge.value))) {
          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2;

          const weightText = scene.add.text(midX, midY, edge.value.toString(), {
            fontSize: '14px',
            color: '#000000',
            fontStyle: 'bold',
            backgroundColor: '#FFD700',
            padding: { x: 6, y: 3 },
          });
          weightText.setOrigin(0.5, 0.5);
          weightText.setDepth(2); // Above graphics but below player/monsters
          scene.edgeWeightLabels.push(weightText);
        }
      } catch (error) {
        console.error(`❌ Error drawing edge ${index}:`, error, edge);
      }
    });
    console.log(`✅ Drawn ${scene.levelData.edges.length} edges successfully`);
  }

  // Draw nodes AFTER edges (on top)
  scene.levelData.nodes.forEach((node) => {
    const isStart = node.id === scene.levelData.startNodeId;
    const isGoal = node.id === scene.levelData.goalNodeId;

    // Node color based on type
    let nodeColor = 0x667eea; // Blue default
    if (isStart) nodeColor = 0x10b981; // Green start
    else if (isGoal) nodeColor = 0xf59e0b; // Yellow/Orange goal

    graphics.fillStyle(nodeColor, 1);
    graphics.fillCircle(node.x, node.y, 18);
    graphics.lineStyle(3, 0xffffff, 1);
    graphics.strokeCircle(node.x, node.y, 18);

    // Add node ID label
    const nodeLabel = scene.add.text(node.x, node.y, node.id.toString(), {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    });
    nodeLabel.setOrigin(0.5, 0.5);
    nodeLabel.setDepth(2); // Above graphics but below player/monsters
    scene.nodeLabels.push(nodeLabel);
  });

  // Store graphics reference
  scene.levelGraphics = graphics;
}

export function setupObstacles(scene) {
  // เริ่มต้น obstacles array เสมอ
  scene.obstacles = [];

  if (!scene.levelData.obstacles || scene.levelData.obstacles.length === 0) {
    return;
  }

  scene.levelData.obstacles.forEach((obstacle, index) => {
    // ตรวจสอบว่า obstacle และ points มีอยู่จริง
    if (!obstacle || !obstacle.points || obstacle.points.length < 3) {
      console.warn(`Skipping obstacle ${index} - missing data or insufficient points:`, obstacle);
      return;
    }

    if (obstacle.type === "pit") {
      // ตรวจสอบว่า points[0] มีอยู่จริง
      if (!obstacle.points[0] || typeof obstacle.points[0].x === 'undefined' || typeof obstacle.points[0].y === 'undefined') {
        console.warn(`Skipping pit obstacle ${index} - invalid first point:`, obstacle.points[0]);
        return;
      }

      // Draw pit
      scene.levelGraphics.fillStyle(0x000000, 0.8);
      scene.levelGraphics.beginPath();
      scene.levelGraphics.moveTo(obstacle.points[0].x, obstacle.points[0].y);

      for (let i = 1; i < obstacle.points.length; i++) {
        // ตรวจสอบว่า point มีอยู่จริง
        if (obstacle.points[i] && typeof obstacle.points[i].x !== 'undefined' && typeof obstacle.points[i].y !== 'undefined') {
          scene.levelGraphics.lineTo(obstacle.points[i].x, obstacle.points[i].y);
        }
      }
      scene.levelGraphics.closePath();
      scene.levelGraphics.fillPath();

      // Border
      scene.levelGraphics.lineStyle(3, 0x8b4513);
      scene.levelGraphics.strokePath();

      scene.obstacles.push({
        type: "pit",
        points: obstacle.points,
      });
    }
  });
}

export function setupCoins(scene) {
  if (!scene.levelData.coinPositions) return;

  scene.coins = [];

  // Reset all coins to not collected
  scene.levelData.coinPositions.forEach(coinData => {
    coinData.collected = false;
  });

  scene.levelData.coinPositions.forEach((coinData, index) => {
    // Use pixel coordinates directly
    const worldX = coinData.x;
    const worldY = coinData.y;

    // Create coin sprite
    const coinSprite = scene.add.circle(worldX, worldY, 12, 0xffd700, 1);
    coinSprite.setStrokeStyle(3, 0xffaa00);
    coinSprite.setDepth(5);

    // Add coin value text
    const valueText = scene.add.text(worldX, worldY, coinData.value.toString(), {
      fontSize: '10px',
      color: '#000000',
      fontStyle: 'bold'
    });
    valueText.setOrigin(0.5);
    valueText.setDepth(6);

    // Add glow effect
    const glowCircle = scene.add.circle(worldX, worldY, 18, 0xffd700, 0.3);
    glowCircle.setDepth(4);

    // Set coin properties
    coinSprite.setData('collected', false);
    coinSprite.setData('value', coinData.value);
    coinSprite.setData('id', coinData.id);
    coinSprite.setData('valueText', valueText);
    coinSprite.setData('glow', glowCircle);

    // Add pulsing animation
    scene.tweens.add({
      targets: [coinSprite, glowCircle],
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    scene.coins.push({
      id: coinData.id,
      sprite: coinSprite,
      value: coinData.value,
      collected: false,
      x: coinData.x,
      y: coinData.y
    });
  });

  console.log(`Setup ${scene.coins.length} coins`);
}

// Function to setup people in the scene
export function setupPeople(scene) {
  if (!scene.levelData.people) return;

  scene.people = [];

  scene.levelData.people.forEach((personData) => {
    // ใช้ตำแหน่งเดิมของคน (บน node) และขยับลงมา 10 พิกเซล
    const personX = personData.x;
    const personY = personData.y + 10;

    // Create person sprite as green rectangle (เล็กลงจาก 30x30 เป็น 20x20)
    const person = scene.add.rectangle(personX, personY, 20, 20, 0x00ff00);
    person.setStrokeStyle(2, 0xffffff);
    person.setDepth(10);

    // Add person data
    person.setData({
      nodeId: personData.nodeId,
      personName: personData.personName,
      rescued: false
    });

    // Create person name label
    const nameLabel = scene.add.text(personX, personY - 20, personData.personName, {
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 3, y: 1 }
    });
    nameLabel.setOrigin(0.5, 0.5);
    nameLabel.setDepth(11);

    // Create rescue effect
    const rescueEffect = scene.add.circle(personX, personY, 25, 0x00ff00, 0.3);
    rescueEffect.setStrokeStyle(1, 0x00ff00);
    rescueEffect.setDepth(9);
    rescueEffect.setVisible(false);

    // Store references
    person.nameLabel = nameLabel;
    person.rescueEffect = rescueEffect;
    person.setData('rescueEffect', rescueEffect);

    scene.people.push(person);
  });

  console.log(`Setup ${scene.people.length} people`);
}

// Function to setup treasures in the scene
export function setupTreasures(scene) {
  if (!scene.levelData.treasures) return;

  scene.treasures = [];

  scene.levelData.treasures.forEach((treasureData) => {
    // ใช้ตำแหน่งเดิมของสมบัติ
    const treasureX = treasureData.x;
    const treasureY = treasureData.y;

    // Create treasure sprite as diamond shape
    const treasure = scene.add.polygon(treasureX, treasureY, [
      0, -15,  // top
      10, 0,   // right
      0, 15,   // bottom
      -10, 0   // left
    ], 0xffd700, 1);
    treasure.setStrokeStyle(3, 0xffaa00);
    treasure.setDepth(8);

    // Add treasure data
    treasure.setData({
      nodeId: treasureData.nodeId,
      treasureName: treasureData.name,
      collected: false,
      id: treasureData.id
    });

    // Create treasure name label
    const nameLabel = scene.add.text(treasureX, treasureY - 25, treasureData.name, {
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 3, y: 1 }
    });
    nameLabel.setOrigin(0.5, 0.5);
    nameLabel.setDepth(9);

    // Create glow effect
    const glowEffect = scene.add.circle(treasureX, treasureY, 25, 0xffd700, 0.3);
    glowEffect.setStrokeStyle(2, 0xffd700);
    glowEffect.setDepth(7);

    // Add pulsing animation
    scene.tweens.add({
      targets: [treasure, glowEffect],
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Store references
    treasure.nameLabel = nameLabel;
    treasure.glowEffect = glowEffect;
    treasure.setData('glowEffect', glowEffect);

    scene.treasures.push(treasure);
  });

  console.log(`Setup ${scene.treasures.length} treasures`);
}

export function setupMonsters(scene) {
  if (!scene || !scene.levelData || !scene.levelData.monsters) {
    console.warn('⚠️ Scene, levelData, or monsters is null, cannot setup monsters');
    return;
  }

  // ตรวจสอบว่า scene ยังมีชีวิตอยู่
  if (scene.sys && scene.sys.isDestroyed) {
    console.error('❌ Scene has been destroyed or is invalid');
    return;
  }

  if (!scene.add) {
    console.error('❌ Scene.add is null, scene may not be ready yet');
    return;
  }

  if (!scene.add.sprite || !scene.add.circle || !scene.add.rectangle) {
    console.error('❌ Scene.add methods not available:', {
      hasSprite: !!scene.add.sprite,
      hasCircle: !!scene.add.circle,
      hasRectangle: !!scene.add.rectangle
    });
    return;
  }

  if (!scene.monsters) scene.monsters = [];

  scene.levelData.monsters.forEach((monsterData, index) => {
    try {
      if (!scene.add) {
        console.error(`❌ Scene.add is null when creating monster ${index}`);
        return;
      }

      if (!scene.add.sprite) {
        console.error(`❌ Scene.add.sprite is null when creating monster ${index}`);
        return;
      }

      if (!scene.add.circle) {
        console.error(`❌ Scene.add.circle is null when creating monster ${index}`);
        return;
      }

      if (!scene.add.rectangle) {
        console.error(`❌ Scene.add.rectangle is null when creating monster ${index}`);
        return;
      }

      const startPos = monsterData.patrol && monsterData.patrol.length > 0
        ? monsterData.patrol[0]
        : scene.levelData.nodes.find(n => n.id === monsterData.startNode);

      if (!startPos) return;

      // Create vampire sprite instead of circle
      const monsterSprite = scene.add.sprite(startPos.x, startPos.y, 'vampire');
      monsterSprite.setScale(1.8); // Restored to standard size
      monsterSprite.setData('defaultScale', 1.8);
      monsterSprite.setDepth(8);

      // Create glow effect - larger to match bigger sprite
      const glowCircle = scene.add.circle(startPos.x, startPos.y, 35, 0xff0000, 0.2);
      glowCircle.setDepth(7);

      // Set monster properties for new utility functions
      monsterSprite.isDefeated = false;
      monsterSprite.currentHealth = monsterData.hp || 50;
      monsterSprite.maxHealth = monsterData.hp || 50;
      monsterSprite.detectionRange = monsterData.detectionRange || 60;
      monsterSprite.attackRange = monsterData.attackRange || 30;
      monsterSprite.attackDamage = monsterData.damage || 60;
      monsterSprite.attackCooldownTime = 2000; // 2 seconds
      monsterSprite.lastAttackTime = 0;

      // Create health bar - larger to match bigger sprite
      const healthBarBg = scene.add.rectangle(startPos.x, startPos.y - 40, 50, 6, 0x000000, 0.8);
      healthBarBg.setDepth(9);
      const healthBar = scene.add.rectangle(startPos.x, startPos.y - 40, 50, 6, 0x00ff00, 1);
      healthBar.setDepth(10);
      healthBar.setOrigin(0, 0.5);

      monsterSprite.setData('healthBar', healthBar);
      monsterSprite.setData('healthBarBg', healthBarBg);
      monsterSprite.setData('health', monsterSprite.currentHealth);
      monsterSprite.setData('defeated', false);

      const monster = {
        id: monsterData.id,
        sprite: monsterSprite,
        glow: glowCircle,
        data: {
          ...monsterData,
          currentPatrolIndex: 0,
          isChasing: false,
          name: monsterData.name || 'Vampire',
          maxHp: monsterData.hp || 50,
          hp: monsterData.hp || 50,
          defeated: monsterData.defeated || false,
          inBattle: false
        },
      };

      // Play idle animation
      if (monsterSprite.anims) {
        monsterSprite.anims.play('vampire-idle', true);
      }

      scene.monsters.push(monster);
    } catch (error) {
      console.error(`❌ Error creating monster ${index}:`, error);
    }
  });
}

export function drawPlayer(scene) {
  if (!scene || !scene.levelData) {
    console.warn('⚠️ Scene or levelData is null, cannot draw player');
    return;
  }

  if (!scene.add) {
    console.error('❌ Scene.add is null, scene may not be ready yet');
    return;
  }

  try {
    // ตรวจสอบว่ามี nodes หรือไม่
    const hasNodes = scene.levelData.nodes && scene.levelData.nodes.length > 0;
    const startNode = hasNodes ? scene.levelData.nodes.find(n => n.id === scene.levelData.startNodeId) : null;

    // ถ้าไม่มี nodes หรือไม่มี startNode ให้แสดงตัวละครที่มุมล่างซ้าย
    let playerX, playerY;
    if (!hasNodes || !startNode) {
      // ตำแหน่งมุมล่างซ้าย (ห่างจากขอบ 100px, 100px)
      playerX = 100;
      playerY = (scene.scale && scene.scale.height) ? scene.scale.height - 100 : 600;
      console.log('⚠️ No nodes found, displaying player at bottom-left corner:', playerX, playerY);
    } else {
      playerX = startNode.x;
      playerY = startNode.y;
    }

    // Create player sprite instead of circle
    scene.player = scene.add.sprite(playerX, playerY, 'player');
    const playerScale = 1.8; // Restored to standard size
    scene.player.setScale(playerScale);
    scene.player.setData('defaultScale', 1.8);
    scene.player.setDepth(8);

    // Set player properties for new utility functions
    scene.player.directions = ['right', 'down', 'left', 'up'];
    scene.player.directionIndex = 0;
    scene.player.currentNodeIndex = hasNodes && startNode ? scene.levelData.startNodeId : null;
    scene.player.mapConfig = { tileSize: 32 }; // Default tile size
    scene.player.mapImage = null; // Will be set if needed
    scene.player.hasNodes = hasNodes; // เพิ่ม flag เพื่อระบุว่ามี nodes หรือไม่

    // Create player arrow for direction indication - larger to match bigger sprite
    scene.playerArrow = scene.add.triangle(
      playerX + 30,
      playerY,
      0,
      15,
      12,
      -8,
      -12,
      -8,
      0x00ff00
    );
    scene.playerArrow.setDepth(15);

    // Play idle animation using playIdle function
    if (scene.player.anims) {
      playIdle(scene.player);
    }

    // Update arrow position to match initial direction (direction 0 = right)
    // Use setTimeout to ensure game state is ready
    setTimeout(() => {
      updatePlayerArrow(scene, playerX, playerY, 0);
    }, 100);
  } catch (error) {
    console.error('❌ Error creating player:', error);
  }
}

// Function to draw cinematic monster (idle state) for no-node levels
export function drawCinematicMonster(scene) {
  if (!scene || !scene.levelData) return;
  if (!scene.add) return;

  // Check condition: Only draw if level has no nodes (same logic as drawPlayer for cinematic placement)
  // FIX: Also check startNode. If nodes exist but no startNode, drawPlayer falls back to cinematic, so we should too.
  const hasNodes = scene.levelData.nodes && scene.levelData.nodes.length > 0;
  const startNode = hasNodes ? scene.levelData.nodes.find(n => n.id === scene.levelData.startNodeId) : null;

  const isCinematic = !hasNodes || !startNode;
  console.log('DEBUG: drawCinematicMonster checking:', { hasNodes, hasStartNode: !!startNode, isCinematic });

  if (!isCinematic) return; // Skip for normal node-based levels

  const width = scene.scale.width;
  const height = scene.scale.height;
  // Match the specific height used in drawPlayer fallback (bottom-left)
  // drawPlayer uses: scene.scale.height - 100
  // So we use same Y for alignment
  const monsterY = height - 100;
  const monsterX = width - 100;

  console.log('🎬 Drawing Cinematic Monster at', monsterX, monsterY);

  try {
    const monster = scene.add.sprite(monsterX, monsterY, 'vampire');
    monster.setScale(1.8); // Restored to standard size
    monster.setData('defaultScale', 1.8);
    monster.setDepth(8);
    monster.setFlipX(true); // Face left towards player

    // Play idle animation
    if (monster.anims && scene.anims.exists('vampire-idle')) {
      monster.play('vampire-idle');
    }

    // Add to scene.monsters so it gets cleaned up properly
    if (!scene.monsters) scene.monsters = [];

    // Wrap it in a structure compatible with updateMonsters loop to avoid crashes
    // but mark it as 'cinematic' so it doesn't try to patrol/chase
    scene.monsters.push({
      sprite: monster,
      isCinematic: true,
      data: { hp: 100, maxHp: 100, defeated: false }
    });

  } catch (err) {
    console.error('❌ Error drawing cinematic monster:', err);
  }
}

// Function to setup Knapsack problem display
export function setupKnapsack(scene) {
  console.log('🔍 setupKnapsack called');
  console.log('🔍 scene.levelData:', scene.levelData);
  console.log('🔍 scene.levelData.knapsackData:', scene.levelData?.knapsackData);

  if (!scene.levelData || !scene.levelData.knapsackData) {
    console.log('⚠️ No knapsackData found, skipping setup');
    return;
  }

  const knapsackData = scene.levelData.knapsackData;
  console.log('✅ Knapsack data found:', knapsackData);
  scene.knapsack = {
    bag: null,
    items: []
  };

  // Setup bag (กระเป๋า) - สี่เหลี่ยม
  if (knapsackData.bag) {
    const bagX = knapsackData.bag.x || 400;
    const bagY = knapsackData.bag.y || 450;
    const bagLabel = knapsackData.bag.label || 'กระเป๋า';

    // Create bag as rectangle (สี่เหลี่ยม)
    const bag = scene.add.rectangle(bagX, bagY, 200, 150, 0x8B4513, 1); // สีน้ำตาล
    bag.setStrokeStyle(3, 0x654321);
    bag.setDepth(5);

    // Add bag label
    const bagLabelText = scene.add.text(bagX, bagY - 80, bagLabel, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 5, y: 3 }
    });
    bagLabelText.setOrigin(0.5, 0.5);
    bagLabelText.setDepth(6);

    // Add capacity label if available
    if (knapsackData.capacity) {
      const capacityText = scene.add.text(bagX, bagY, `${knapsackData.capacity} kg`, {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 5, y: 3 }
      });
      capacityText.setOrigin(0.5, 0.5);
      capacityText.setDepth(6);
      bag.capacityText = capacityText;
    }

    bag.labelText = bagLabelText;
    scene.knapsack.bag = bag;

    console.log(`Setup knapsack bag at (${bagX}, ${bagY})`);
  }

  // Setup items (สมบัติ) - รูปเพชร
  if (knapsackData.items && Array.isArray(knapsackData.items)) {
    knapsackData.items.forEach((itemData) => {
      const itemX = itemData.x || 200;
      const itemY = itemData.y || 150;

      // Create item as diamond shape (รูปเพชร) - เหมือน treasure
      const item = scene.add.polygon(itemX, itemY, [
        0, -20,  // top
        15, 0,   // right
        0, 20,   // bottom
        -15, 0   // left
      ], 0xffd700, 1); // สีทอง
      item.setStrokeStyle(3, 0xffaa00);
      item.setDepth(7);

      // Add item data
      item.setData({
        id: itemData.id,
        weight: itemData.weight,
        price: itemData.price,
        label: itemData.label,
        selected: false // สำหรับเก็บว่า item ถูกเลือกแล้วหรือยัง
      });

      // Create item label
      const itemLabel = itemData.label || `${itemData.weight} kg, ${itemData.price} baht`;
      const itemLabelText = scene.add.text(itemX, itemY - 35, itemLabel, {
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 }
      });
      itemLabelText.setOrigin(0.5, 0.5);
      itemLabelText.setDepth(8);

      // Add weight and price text
      const itemInfoText = scene.add.text(itemX, itemY, `${itemData.weight}kg / ${itemData.price}฿`, {
        fontSize: '10px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 3, y: 1 }
      });
      itemInfoText.setOrigin(0.5, 0.5);
      itemInfoText.setDepth(8);

      // Create glow effect
      const glowEffect = scene.add.circle(itemX, itemY, 30, 0xffd700, 0.3);
      glowEffect.setStrokeStyle(2, 0xffd700);
      glowEffect.setDepth(6);

      // Add pulsing animation
      scene.tweens.add({
        targets: [item, glowEffect],
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Store references
      item.labelText = itemLabelText;
      item.infoText = itemInfoText;
      item.glowEffect = glowEffect;
      item.setData('glowEffect', glowEffect);

      scene.knapsack.items.push({
        id: itemData.id,
        sprite: item,
        weight: itemData.weight,
        price: itemData.price,
        label: itemData.label,
        x: itemX,
        y: itemY
      });
    });

    console.log(`Setup ${scene.knapsack.items.length} knapsack items`);
  }
}

export function setupSubsetSum(scene) {
  console.log('🔍 setupSubsetSum called');
  console.log('🔍 scene.levelData:', scene.levelData);
  console.log('🔍 scene.levelData.subsetSumData:', scene.levelData?.subsetSumData);

  if (!scene.levelData || !scene.levelData.subsetSumData) {
    console.log('⚠️ No subsetSumData found, skipping setup');
    return;
  }

  const subsetSumData = scene.levelData.subsetSumData;
  console.log('✅ Subset Sum data found:', subsetSumData);
  scene.subsetSum = {
    side1: null,
    side2: null,
    warriors: []
  };

  // Setup side1 (ฝั่งที่ 1) - สี่เหลี่ยมโปร่งใสเส้นสีเหลือง
  if (subsetSumData.side1) {
    const side1X = subsetSumData.side1.x || 200;
    const side1Y = subsetSumData.side1.y || 400;
    const side1Label = subsetSumData.side1.label || 'ฝั่ง 1';
    const side1Width = 150;
    const side1Height = 100;
    const targetSum = subsetSumData.target_sum !== undefined ? subsetSumData.target_sum : 0;

    // สร้าง label ที่รวม target_sum
    const side1LabelWithTarget = `${side1Label}\n${targetSum}`;

    // Create side1 as rectangle with transparent fill and yellow stroke
    const side1 = scene.add.rectangle(side1X, side1Y, side1Width, side1Height);
    side1.setFillStyle(0x000000, 0); // fill โปร่งใส (alpha = 0)
    side1.setStrokeStyle(3, 0xffd700); // เส้นสีเหลือง
    side1.setDepth(5);

    // Add side1 label with target_sum
    const side1LabelText = scene.add.text(side1X, side1Y - 60, side1LabelWithTarget, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 5, y: 3 },
      align: 'center'
    });
    side1LabelText.setOrigin(0.5, 0.5);
    side1LabelText.setDepth(6);

    side1.labelText = side1LabelText;
    scene.subsetSum.side1 = side1;

    console.log(`Setup subset sum side1 at (${side1X}, ${side1Y})`);
  }

  // Setup side2 (ฝั่งที่ 2) - สี่เหลี่ยมโปร่งใสเส้นสีเหลือง
  if (subsetSumData.side2) {
    const side2X = subsetSumData.side2.x || 600;
    const side2Y = subsetSumData.side2.y || 400;
    const side2Label = subsetSumData.side2.label || 'ฝั่ง 2';
    const side2Width = 150;
    const side2Height = 100;
    const targetSum = subsetSumData.target_sum !== undefined ? subsetSumData.target_sum : 0;

    // สร้าง label ที่รวม target_sum
    const side2LabelWithTarget = `${side2Label}\n${targetSum}`;

    // Create side2 as rectangle with transparent fill and yellow stroke
    const side2 = scene.add.rectangle(side2X, side2Y, side2Width, side2Height);
    side2.setFillStyle(0x000000, 0); // fill โปร่งใส (alpha = 0)
    side2.setStrokeStyle(3, 0xffd700); // เส้นสีเหลือง
    side2.setDepth(5);

    // Add side2 label with target_sum
    const side2LabelText = scene.add.text(side2X, side2Y - 60, side2LabelWithTarget, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 5, y: 3 },
      align: 'center'
    });
    side2LabelText.setOrigin(0.5, 0.5);
    side2LabelText.setDepth(6);

    side2.labelText = side2LabelText;
    scene.subsetSum.side2 = side2;

    console.log(`Setup subset sum side2 at (${side2X}, ${side2Y})`);
  }

  // Setup warriors (นักรบ) - วงกลมสีแดง
  if (subsetSumData.warriors_display && Array.isArray(subsetSumData.warriors_display)) {
    subsetSumData.warriors_display.forEach((warriorData) => {
      const warriorX = warriorData.x || 200;
      const warriorY = warriorData.y || 150;
      const warriorPower = warriorData.power || 0;
      const warriorLabel = warriorData.label || `${warriorPower}`;

      // Create warrior as circle (วงกลมสีแดง)
      const warrior = scene.add.circle(warriorX, warriorY, 25, 0xff0000, 1); // สีแดง
      warrior.setStrokeStyle(2, 0xcc0000); // เส้นขอบสีแดงเข้ม
      warrior.setDepth(7);

      // Add warrior data
      warrior.setData({
        id: warriorData.id,
        power: warriorPower,
        label: warriorLabel,
        selected: false, // สำหรับเก็บว่านักรบถูกเลือกแล้วหรือยัง
        side: null // เก็บว่าอยู่ฝั่งไหน (1 หรือ 2)
      });

      // Create warrior label (แสดงพลัง)
      const warriorLabelText = scene.add.text(warriorX, warriorY - 40, warriorLabel, {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 }
      });
      warriorLabelText.setOrigin(0.5, 0.5);
      warriorLabelText.setDepth(8);

      // Add power text inside circle
      const powerText = scene.add.text(warriorX, warriorY, warriorPower.toString(), {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 3, y: 2 }
      });
      powerText.setOrigin(0.5, 0.5);
      powerText.setDepth(8);

      // Store references
      warrior.labelText = warriorLabelText;
      warrior.powerText = powerText;

      scene.subsetSum.warriors.push({
        id: warriorData.id,
        sprite: warrior,
        power: warriorPower,
        label: warriorLabel,
        x: warriorX,
        y: warriorY,
        originalX: warriorX, // Store original position for reset
        originalY: warriorY
      });
    });

    console.log(`Setup ${scene.subsetSum.warriors.length} subset sum warriors`);
  } else if (subsetSumData.warriors && Array.isArray(subsetSumData.warriors)) {
    // ถ้าไม่มี warriors_display ให้ใช้ warriors array มาสร้างเอง
    const spacing = 150;
    const startX = 200;
    const startY = 150;

    subsetSumData.warriors.forEach((power, index) => {
      const warriorX = startX + (index * spacing);
      const warriorY = startY;
      const warriorLabel = power.toString();

      // Create warrior as circle (วงกลมสีแดง)
      const warrior = scene.add.circle(warriorX, warriorY, 25, 0xff0000, 1); // สีแดง
      warrior.setStrokeStyle(2, 0xcc0000); // เส้นขอบสีแดงเข้ม
      warrior.setDepth(7);

      // Add warrior data
      warrior.setData({
        id: index + 1,
        power: power,
        label: warriorLabel,
        selected: false,
        side: null
      });

      // Create warrior label
      const warriorLabelText = scene.add.text(warriorX, warriorY - 40, warriorLabel, {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 }
      });
      warriorLabelText.setOrigin(0.5, 0.5);
      warriorLabelText.setDepth(8);

      // Add power text inside circle
      const powerText = scene.add.text(warriorX, warriorY, power.toString(), {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 3, y: 2 }
      });
      powerText.setOrigin(0.5, 0.5);
      powerText.setDepth(8);

      // Store references
      warrior.labelText = warriorLabelText;
      warrior.powerText = powerText;

      scene.subsetSum.warriors.push({
        id: index + 1,
        sprite: warrior,
        power: power,
        label: warriorLabel,
        x: warriorX,
        y: warriorY,
        originalX: warriorX, // Store original position for reset
        originalY: warriorY
      });
    });

    console.log(`Setup ${scene.subsetSum.warriors.length} subset sum warriors from warriors array`);
  }
}

export function setupCoinChange(scene) {
  console.log('🔍 setupCoinChange called');
  console.log('🔍 scene.levelData:', scene.levelData);
  console.log('🔍 scene.levelData.coinChangeData:', scene.levelData?.coinChangeData);

  if (!scene.levelData || !scene.levelData.coinChangeData) {
    console.log('⚠️ No coinChangeData found, skipping setup');
    return;
  }

  const coinChangeData = scene.levelData.coinChangeData;
  console.log('✅ Coin Change data found:', coinChangeData);

  const monsterPower = coinChangeData.monster_power || 32;
  const warriors = coinChangeData.warriors || [1, 5, 10, 25]; // Default warriors levels

  scene.coinChange = {
    monster: null,
    warriors: [],
    selectedBox: null
  };

  // Setup warriors (นักรบ 4 ระดับ) - แสดงด้านบน
  // แต่ละชุดมี: square ด้านบน (dotted outline) + blue circle ด้านล่าง
  const warriorStartX = 150;
  const warriorY = 150;
  const warriorSpacing = 150;

  warriors.forEach((power, index) => {
    const warriorX = warriorStartX + (index * warriorSpacing);
    const warriorNumber = index + 1; // 1, 2, 3, 4

    // Square ด้านบน (dotted outline) - แสดงพลัง
    // ใช้ rectangle ที่มี fill โปร่งใสและ stroke แทน (เพื่อความง่าย)
    const powerSquare = scene.add.rectangle(warriorX, warriorY, 50, 50);
    powerSquare.setFillStyle(0xffffff, 0); // fill โปร่งใส
    powerSquare.setStrokeStyle(2, 0x000000, 0.8); // stroke สีดำ (ใช้ alpha ต่ำเพื่อดูเหมือน dotted)
    powerSquare.setDepth(7);

    // Text แสดงพลังใน square
    const powerText = scene.add.text(warriorX, warriorY, power.toString(), {
      fontSize: '20px',
      color: '#000000',
      fontStyle: 'bold'
    });
    powerText.setOrigin(0.5, 0.5);
    powerText.setDepth(8);

    // Blue circle ด้านล่าง (solid outline) - แสดงหมายเลข
    const warriorCircle = scene.add.circle(warriorX, warriorY + 60, 30, 0x0066ff, 1); // สีฟ้า
    warriorCircle.setStrokeStyle(3, 0x0044cc); // เส้นขอบสีฟ้าเข้ม
    warriorCircle.setDepth(7);

    // Text แสดงหมายเลขใน circle
    const numberText = scene.add.text(warriorX, warriorY + 60, warriorNumber.toString(), {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    numberText.setOrigin(0.5, 0.5);
    numberText.setDepth(8);

    scene.coinChange.warriors.push({
      power: power,
      index: index,
      number: warriorNumber,
      powerSquare: powerSquare,
      powerText: powerText,
      circle: warriorCircle,
      numberText: numberText,
      x: warriorX,
      y: warriorY,
      originalX: warriorX,
      originalY: warriorY
    });
  });

  // Setup monster (มอนสเตอร์) - ด้านขวา
  const monsterX = 900; // ขยับไปทางขวา
  const monsterY = 150;

  // Square ด้านบน (dotted outline) - แสดงพลัง
  // ใช้ rectangle ที่มี fill โปร่งใสและ stroke แทน (เพื่อความง่าย)
  const monsterPowerSquare = scene.add.rectangle(monsterX, monsterY, 50, 50);
  monsterPowerSquare.setFillStyle(0xffffff, 0); // fill โปร่งใส
  monsterPowerSquare.setStrokeStyle(2, 0x000000, 0.8); // stroke สีดำ (ใช้ alpha ต่ำเพื่อดูเหมือน dotted)
  monsterPowerSquare.setDepth(7);

  // Text แสดงพลังใน square
  const monsterPowerText = scene.add.text(monsterX, monsterY, monsterPower.toString(), {
    fontSize: '20px',
    color: '#000000',
    fontStyle: 'bold'
  });
  monsterPowerText.setOrigin(0.5, 0.5);
  monsterPowerText.setDepth(8);

  // Red circle ด้านล่าง (solid outline, filled light red) - แสดงคำว่า "Monster"
  const monsterCircle = scene.add.circle(monsterX, monsterY + 60, 40, 0xff6666, 1); // สีแดงอ่อน
  monsterCircle.setStrokeStyle(3, 0xff0000); // เส้นขอบสีแดงเข้ม
  monsterCircle.setDepth(7);

  // Text แสดงคำว่า "Monster" ใน circle
  const monsterLabelText = scene.add.text(monsterX, monsterY + 60, 'Monster', {
    fontSize: '14px',
    color: '#ffffff',
    fontStyle: 'bold'
  });
  monsterLabelText.setOrigin(0.5, 0.5);
  monsterLabelText.setDepth(8);

  scene.coinChange.monster = {
    power: monsterPower,
    powerSquare: monsterPowerSquare,
    powerText: monsterPowerText,
    circle: monsterCircle,
    labelText: monsterLabelText,
    x: monsterX,
    y: monsterY
  };

  // Setup large rectangular box (ด้านล่างซ้าย) - สำหรับแสดงผลนักรบที่เลือก
  const boxX = 400; // ขยับไปทางขวา
  const boxY = 500; // ขยับขึ้นมาอีก
  const boxWidth = 400;
  const boxHeight = 200;

  const selectedBox = scene.add.graphics();
  selectedBox.lineStyle(4, 0x000000, 1);
  selectedBox.strokeRoundedRect(boxX - boxWidth / 2, boxY - boxHeight / 2, boxWidth, boxHeight, 10);
  selectedBox.setDepth(5);

  scene.coinChange.selectedBox = {
    graphics: selectedBox,
    x: boxX,
    y: boxY,
    width: boxWidth,
    height: boxHeight
  };

  console.log(`Setup Coin Change: ${warriors.length} warriors, monster power: ${monsterPower}`);
}

/**
 * Setup N-Queen board and queens
 * @param {Phaser.Scene} scene - Phaser scene
 */
export function setupNQueen(scene) {
  console.log('🔍 setupNQueen called');
  console.log('🔍 scene.levelData:', scene.levelData);
  console.log('🔍 scene.levelData.nqueenData:', scene.levelData?.nqueenData);

  if (!scene.levelData || !scene.levelData.nqueenData) {
    console.log('⚠️ No nqueenData found, skipping setup');
    return;
  }

  const nqueenData = scene.levelData.nqueenData;
  console.log('✅ N-Queen data found:', nqueenData);

  const n = nqueenData.n || 4; // Board size (n×n)

  scene.nqueen = {
    n: n,
    board: null,
    queens: [],
    cellSize: 60, // Size of each cell in pixels
    boardStartX: 400, // Center of the board
    boardStartY: 300, // Center of the board
    labels: []
  };

  const cellSize = scene.nqueen.cellSize;
  const boardStartX = scene.nqueen.boardStartX;
  const boardStartY = scene.nqueen.boardStartY;
  const boardWidth = n * cellSize;
  const boardHeight = n * cellSize;
  const labelOffset = 25; // Offset for row/column labels

  // Create board graphics container
  const boardGraphics = scene.add.graphics();
  boardGraphics.setDepth(5);

  // Draw grid lines
  boardGraphics.lineStyle(2, 0x000000, 1);

  // Draw vertical lines
  for (let i = 0; i <= n; i++) {
    const x = boardStartX - boardWidth / 2 + (i * cellSize);
    const y1 = boardStartY - boardHeight / 2;
    const y2 = boardStartY + boardHeight / 2;
    boardGraphics.moveTo(x, y1);
    boardGraphics.lineTo(x, y2);
  }

  // Draw horizontal lines
  for (let i = 0; i <= n; i++) {
    const y = boardStartY - boardHeight / 2 + (i * cellSize);
    const x1 = boardStartX - boardWidth / 2;
    const x2 = boardStartX + boardWidth / 2;
    boardGraphics.moveTo(x1, y);
    boardGraphics.lineTo(x2, y);
  }

  boardGraphics.strokePath();

  // Draw column labels (0, 1, 2, 3, ...)
  for (let col = 0; col < n; col++) {
    const x = boardStartX - boardWidth / 2 + (col * cellSize) + cellSize / 2;
    const y = boardStartY - boardHeight / 2 - labelOffset;

    const label = scene.add.text(x, y, col.toString(), {
      fontSize: '18px',
      color: '#000000',
      fontStyle: 'bold'
    });
    label.setOrigin(0.5, 0.5);
    label.setDepth(6);

    scene.nqueen.labels.push(label);
  }

  // Draw row labels (0, 1, 2, 3, ...)
  for (let row = 0; row < n; row++) {
    const x = boardStartX - boardWidth / 2 - labelOffset;
    const y = boardStartY - boardHeight / 2 + (row * cellSize) + cellSize / 2;

    const label = scene.add.text(x, y, row.toString(), {
      fontSize: '18px',
      color: '#000000',
      fontStyle: 'bold'
    });
    label.setOrigin(0.5, 0.5);
    label.setDepth(6);

    scene.nqueen.labels.push(label);
  }

  scene.nqueen.board = boardGraphics;

  // Initialize overlays Map for highlights and previews
  scene.nqueen.overlays = {}; // key: `${row}_${col}` -> { rectGraphics, previewGraphics }

  // Helper to compute cell bounds and center
  const cellBounds = (row, col) => {
    const x1 = boardStartX - boardWidth / 2 + (col * cellSize);
    const y1 = boardStartY - boardHeight / 2 + (row * cellSize);
    const x2 = x1 + cellSize;
    const y2 = y1 + cellSize;
    const cx = x1 + cellSize / 2;
    const cy = y1 + cellSize / 2;
    return { x1, y1, x2, y2, cx, cy };
  };

  // Create or update overlay for a cell (color: hex, alpha: number)
  scene.nqueen.setCellOverlay = (row, col, color = 0xffff00, alpha = 0.35) => {
    const key = `${row}_${col}`;
    try {
      if (!scene.nqueen.overlays[key]) scene.nqueen.overlays[key] = {};

      // Create rectangle if not exists
      if (!scene.nqueen.overlays[key].rectGraphics) {
        const g = scene.add.graphics();
        g.setDepth(8);
        scene.nqueen.overlays[key].rectGraphics = g;
      }
      const g = scene.nqueen.overlays[key].rectGraphics;
      const b = cellBounds(row, col);
      g.clear();
      g.fillStyle(color, alpha);
      g.fillRect(b.x1 + 1, b.y1 + 1, cellSize - 2, cellSize - 2);

    } catch (e) {
      console.warn('Error setting cell overlay', e);
    }
  };

  scene.nqueen.clearCellOverlay = (row, col) => {
    const key = `${row}_${col}`;
    const entry = scene.nqueen.overlays[key];
    if (entry && entry.rectGraphics) {
      try { entry.rectGraphics.destroy(); } catch (e) { }
      delete scene.nqueen.overlays[key];
    }
  };

  scene.nqueen.clearAllOverlays = () => {
    Object.keys(scene.nqueen.overlays).forEach(k => {
      const e = scene.nqueen.overlays[k];
      try { if (e.rectGraphics) e.rectGraphics.destroy(); } catch (er) { }
    });
    scene.nqueen.overlays = {};
  };

  // Visual API exposed to sandboxed solver/runtime
  const registerVisualApi = () => {
    // Ensure configurable flash duration for placed cell (ms)
    try { if (typeof globalThis !== 'undefined' && typeof globalThis.__nqueenVisual_placeFlashDuration === 'undefined') globalThis.__nqueenVisual_placeFlashDuration = 140; } catch (e) { }
    // Default: do NOT accumulate overlays (keeps board clean). We still flash rejected cells briefly.
    try { if (typeof globalThis !== 'undefined' && typeof globalThis.__nqueenVisual_accumulate === 'undefined') globalThis.__nqueenVisual_accumulate = false; } catch (e) { }
    // If not accumulating, keep rejected cell visible for a bit (ms)
    try { if (typeof globalThis !== 'undefined' && typeof globalThis.__nqueenVisual_rejectFlashMs === 'undefined') globalThis.__nqueenVisual_rejectFlashMs = 650; } catch (e) { }
    // Optional: keep rejected cells persistent (debugging). Default false.
    try { if (typeof globalThis !== 'undefined' && typeof globalThis.__nqueenVisual_persistReject === 'undefined') globalThis.__nqueenVisual_persistReject = false; } catch (e) { }

    // Attach helpers to globalThis so injected user code can call them via capture shim
    try {
      globalThis.__nqueenVisual_api = {
        onConsider: (r, c, canPlace) => {
          try {
            console.log('🔍 [nqueenVisual] onConsider called:', { r, c, canPlace });
            // Be tolerant: solver/runtime may pass numeric strings
            const rr = typeof r === 'number' ? r : Number(r);
            const cc = typeof c === 'number' ? c : Number(c);
            if (!Number.isFinite(rr) || !Number.isFinite(cc)) return;

            // Mark that we have real-time consider events (used to avoid "replay from output" overwriting the run)
            try { if (typeof globalThis !== 'undefined') globalThis.__nqueenVisual_seenConsider = true; } catch (e) { }

            const accumulate = !!(typeof globalThis !== 'undefined' && globalThis.__nqueenVisual_accumulate);
            const persistReject = !!(typeof globalThis !== 'undefined' && globalThis.__nqueenVisual_persistReject);
            // Clear previous overlays ONLY for "focus mode" and only on safe/thinking.
            // If unsafe (red), keep it visible (flash) even in focus mode.
            try {
              if (!accumulate && canPlace && scene.nqueen && typeof scene.nqueen.clearAllOverlays === 'function') {
                scene.nqueen.clearAllOverlays();
              }
            } catch (e) { }

            // Visual Logic:
            // canPlace = true  -> "Thinking" / "Safe-so-far" -> ORANGE (0xFFA500)
            // canPlace = false -> "Unsafe" / "Rejected"      -> RED (0xFF0000)

            const color = canPlace ? 0xFFA500 : 0xFF0000;
            const alpha = 0.7; // High visibility

            scene.nqueen.setCellOverlay(rr, cc, color, alpha);

            // Auto-clear rejected cells after a short delay so the board doesn't stay fully red.
            try {
              if (!persistReject && !canPlace) {
                const ms = (typeof globalThis !== 'undefined' && Number.isFinite(Number(globalThis.__nqueenVisual_rejectFlashMs)))
                  ? Number(globalThis.__nqueenVisual_rejectFlashMs)
                  : 650;
                setTimeout(() => {
                  try { scene.nqueen.clearCellOverlay(rr, cc); } catch (e) { }
                }, Math.max(0, ms));
              }
            } catch (e) { }

          } catch (e) { console.warn('nqueenVisual onConsider error', e); }
        },

        onPlace: (r, c) => {
          try {
            console.log('🔍 [nqueenVisual] onPlace called:', { r, c });
            const rr = typeof r === 'number' ? r : Number(r);
            const cc = typeof c === 'number' ? c : Number(c);
            if (!Number.isFinite(rr) || !Number.isFinite(cc)) return;

            // Placement -> GREEN flash before Queen
            const color = 0x00FF00;
            const alpha = 0.8;

            try { scene.nqueen.setCellOverlay(rr, cc, color, alpha); } catch (e) { }
            try {
              setTimeout(() => {
                try { scene.nqueen.clearCellOverlay(rr, cc); } catch (e) { }
                try { drawQueenOnBoard(scene, rr, cc); } catch (e) { }
              }, Math.max(0, (globalThis.__nqueenVisual_placeFlashDuration || 140)));
            } catch (e) { /* swallow */ }
          } catch (e) { console.warn('nqueenVisual onPlace error', e); }
        },
        onRemove: (r, c) => {
          try {
            console.log('🔍 [nqueenVisual] onRemove called:', { r, c });
            const rr = typeof r === 'number' ? r : Number(r);
            const cc = typeof c === 'number' ? c : Number(c);
            if (!Number.isFinite(rr) || !Number.isFinite(cc)) return;
            // Remove queen graphics if present
            const qIndex = scene.nqueen.queens.findIndex(q => q.row === rr && q.col === cc);
            if (qIndex !== -1) {
              try { scene.nqueen.queens[qIndex].graphics.destroy(); } catch (e) { }
              scene.nqueen.queens.splice(qIndex, 1);
            }
            // Add a transient red flash to indicate removal
            const b = cellBounds(rr, cc);
            const flash = scene.add.rectangle(b.cx, b.cy, cellSize - 6, cellSize - 6, 0xff0000, 0.5);
            flash.setDepth(9);
            scene.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => { try { flash.destroy(); } catch (e) { } } });
          } catch (e) { console.warn('nqueenVisual onRemove error', e); }
        },
        clear: () => { try { scene.nqueen.clearAllOverlays(); } catch (e) { } }
      };
    } catch (e) {
      console.warn('Could not register nqueen visual api:', e);
    }

    // Cleanup on scene shutdown
    try {
      scene.events.once('shutdown', () => { try { delete globalThis.__nqueenVisual_api; } catch (e) { } });
    } catch (e) { }
  };

  registerVisualApi();

  console.log(`Setup N-Queen: ${n}×${n} board`);
}

/**
 * Setup Applied Dynamic (Ant) DP board in Phaser (grid with sugar + dp value)
 * This is the "main visual" for the applied dynamic Ant level, similar to N-Queen.
 * @param {Phaser.Scene} scene
 */
export function setupAntDp(scene) {
  try {
    const level = scene?.levelData;
    const applied = level?.appliedData || null;
    if (!applied) {
      try { console.warn('setupAntDp: no appliedData on levelData', { hasLevel: !!level, levelId: level?.level_id, keys: level ? Object.keys(level) : null }); } catch (e) { }
      return;
    }

    const appliedType = String(applied.type || '').toUpperCase();
    const isAnt = appliedType === 'APPLIED_DYNAMIC_ANT'
      || appliedType === 'ANT_SUGAR_PATH'
      || appliedType === 'APPLIED_ANT'
      || appliedType.includes('ANT');
    if (!isAnt) {
      try { console.warn('setupAntDp: appliedData.type not ANT', { appliedType, applied }); } catch (e) { }
      return;
    }

    const payload = applied.payload || {};
    const sugarGrid = Array.isArray(payload.sugarGrid) ? payload.sugarGrid : [];
    const rows = Number(payload.rows ?? sugarGrid.length ?? 0) || (Array.isArray(sugarGrid) ? sugarGrid.length : 0) || 1;
    const cols = Number(payload.cols ?? (Array.isArray(sugarGrid?.[0]) ? sugarGrid[0].length : 0) ?? 0) || (Array.isArray(sugarGrid?.[0]) ? sugarGrid[0].length : 0) || 1;
    const start = payload.start || { r: 0, c: 0 };
    const goal = payload.goal || { r: rows - 1, c: cols - 1 };

    // Clean up previous ant dp visuals if reloading
    if (scene.antDp && scene.antDp.destroy) {
      try { scene.antDp.destroy(); } catch (e) { }
    }

    // Match N-Queen look & placement (fixed cell size like a board)
    const cellSize = 60;
    const boardWidth = cols * cellSize;
    const boardHeight = rows * cellSize;

    // Same anchor as N-Queen
    const boardStartX = 400;
    const boardStartY = 300;
    const labelOffset = 25;

    const boardGraphics = scene.add.graphics();
    boardGraphics.setDepth(5);

    // Visible debug badge (helps confirm the board is active even if the grid is offscreen or background is dark)
    const debugBadge = scene.add.text(12, 10, `🐜 ANT DP ACTIVE (${rows}×${cols})`, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#111827',
      padding: { x: 8, y: 6 },
      stroke: '#000000',
      strokeThickness: 3,
    });
    debugBadge.setDepth(10000);
    debugBadge.setScrollFactor(0);

    // No panel / alternating background — keep it identical to N-Queen grid style

    // Grid lines
    // Use white lines so the board is visible on dark backgrounds too.
    boardGraphics.lineStyle(2, 0xffffff, 1);
    for (let i = 0; i <= cols; i++) {
      const x = boardStartX - boardWidth / 2 + (i * cellSize);
      const y1 = boardStartY - boardHeight / 2;
      const y2 = boardStartY + boardHeight / 2;
      boardGraphics.moveTo(x, y1);
      boardGraphics.lineTo(x, y2);
    }
    for (let i = 0; i <= rows; i++) {
      const y = boardStartY - boardHeight / 2 + (i * cellSize);
      const x1 = boardStartX - boardWidth / 2;
      const x2 = boardStartX + boardWidth / 2;
      boardGraphics.moveTo(x1, y);
      boardGraphics.lineTo(x2, y);
    }
    boardGraphics.strokePath();

    const labels = [];
    // Column labels
    for (let c = 0; c < cols; c++) {
      const x = boardStartX - boardWidth / 2 + (c * cellSize) + cellSize / 2;
      const y = boardStartY - boardHeight / 2 - labelOffset;
      const t = scene.add.text(x, y, c.toString(), { fontSize: '18px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 });
      t.setOrigin(0.5, 0.5);
      t.setDepth(6);
      labels.push(t);
    }
    // Row labels
    for (let r = 0; r < rows; r++) {
      const x = boardStartX - boardWidth / 2 - labelOffset;
      const y = boardStartY - boardHeight / 2 + (r * cellSize) + cellSize / 2;
      const t = scene.add.text(x, y, r.toString(), { fontSize: '18px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 });
      t.setOrigin(0.5, 0.5);
      t.setDepth(6);
      labels.push(t);
    }

    const overlays = {}; // key -> graphics
    const dpTexts = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
    const sugarTexts = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));

    const cellBounds = (r, c) => {
      const x1 = boardStartX - boardWidth / 2 + (c * cellSize);
      const y1 = boardStartY - boardHeight / 2 + (r * cellSize);
      const cx = x1 + cellSize / 2;
      const cy = y1 + cellSize / 2;
      return { x1, y1, cx, cy };
    };

    // Color Start/Goal cells (instead of showing S/G text)
    const startGoalBg = scene.add.graphics();
    startGoalBg.setDepth(4.5); // behind grid lines, above background
    try {
      const sr = Math.max(0, Math.min(rows - 1, Number(start?.r ?? 0)));
      const sc = Math.max(0, Math.min(cols - 1, Number(start?.c ?? 0)));
      const sB = cellBounds(sr, sc);
      startGoalBg.fillStyle(0x10B981, 0.35); // green
      startGoalBg.fillRect(sB.x1 + 1, sB.y1 + 1, cellSize - 2, cellSize - 2);
    } catch (e) { }
    try {
      const gr = Math.max(0, Math.min(rows - 1, Number(goal?.r ?? (rows - 1))));
      const gc = Math.max(0, Math.min(cols - 1, Number(goal?.c ?? (cols - 1))));
      const gB = cellBounds(gr, gc);
      startGoalBg.fillStyle(0xEF4444, 0.35); // red
      startGoalBg.fillRect(gB.x1 + 1, gB.y1 + 1, cellSize - 2, cellSize - 2);
    } catch (e) { }

    // Create per-cell texts
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const b = cellBounds(r, c);
        const sugar = (sugarGrid?.[r] && typeof sugarGrid[r][c] !== 'undefined') ? sugarGrid[r][c] : null;

        const st = scene.add.text(
          b.cx,
          b.cy - 12,
          sugar === null ? '' : `s:${sugar}`,
          { fontSize: '12px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }
        );
        st.setOrigin(0.5, 0.5);
        st.setDepth(6);
        sugarTexts[r][c] = st;

        const dt = scene.add.text(b.cx, b.cy + 10, '·', { fontSize: '18px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 });
        dt.setOrigin(0.5, 0.5);
        dt.setDepth(6);
        dpTexts[r][c] = dt;
      }
    }

    // Ant placeholder (square) at Start cell (future: swap to pixel ant sprite)
    const clampCell = (r, c) => ({
      r: Math.max(0, Math.min(rows - 1, Number(r))),
      c: Math.max(0, Math.min(cols - 1, Number(c))),
    });
    const startCell = clampCell(start?.r ?? 0, start?.c ?? 0);
    const startB = cellBounds(startCell.r, startCell.c);
    // Smaller than the cell so it reads as an "ant" placeholder (future sprite)
    const antSize = Math.max(14, Math.floor(cellSize * 0.42));
    const antRect = scene.add.rectangle(startB.cx, startB.cy, antSize, antSize, 0x111827, 0.95);
    antRect.setDepth(9);
    antRect.setStrokeStyle(2, 0xFBBF24, 1); // yellow outline

    // Sequential animation queue so visuals can be awaited before Victory.
    let pendingAnimations = 0;
    let queue = Promise.resolve();
    const enqueue = (fn) => {
      queue = queue.then(() => fn()).catch(() => { /* swallow */ });
      return queue;
    };

    const tweenMoveAntToCell = (r, c, durationMs = 180) => {
      return new Promise((resolve) => {
        try {
          const cc = clampCell(r, c);
          const b = cellBounds(cc.r, cc.c);
          pendingAnimations += 1;
          scene.tweens.add({
            targets: antRect,
            x: b.cx,
            y: b.cy,
            duration: Math.max(0, Number(durationMs) || 0),
            ease: 'Sine.easeInOut',
            onComplete: () => {
              pendingAnimations = Math.max(0, pendingAnimations - 1);
              resolve(true);
            }
          });
        } catch (e) {
          pendingAnimations = Math.max(0, pendingAnimations - 1);
          resolve(false);
        }
      });
    };

    const moveAntToCell = (r, c) => {
      try {
        const cc = clampCell(r, c);
        const b = cellBounds(cc.r, cc.c);
        antRect.setPosition(b.cx, b.cy);
      } catch (e) { /* ignore */ }
    };

    const setCellOverlay = (r, c, color = 0xfbbf24, alpha = 0.35) => {
      const key = `${r}_${c}`;
      if (!overlays[key]) {
        overlays[key] = scene.add.graphics();
        overlays[key].setDepth(8);
      }
      const g = overlays[key];
      const b = cellBounds(r, c);
      g.clear();
      g.fillStyle(color, alpha);
      g.fillRect(b.x1 + 1, b.y1 + 1, cellSize - 2, cellSize - 2);
    };

    const clearAllOverlays = () => {
      Object.keys(overlays).forEach(k => {
        try { overlays[k].destroy(); } catch (e) { }
        delete overlays[k];
      });
    };

    scene.antDp = {
      rows,
      cols,
      cellSize,
      boardStartX,
      boardStartY,
      boardWidth,
      boardHeight,
      startGoalBg,
      ant: {
        rect: antRect,
        moveToCell: moveAntToCell,
        tweenToCell: tweenMoveAntToCell
      },
      board: boardGraphics,
      debugBadge,
      labels,
      overlays,
      dpTexts,
      sugarTexts,
      setCellOverlay,
      clearAllOverlays,
      getPendingAnimations: () => pendingAnimations,
      waitForIdle: async ({ timeoutMs = 600000, pollMs = 40 } = {}) => {
        const start = Date.now();
        // Wait for queue chain and pending tweens
        while (Date.now() - start < timeoutMs) {
          try { await Promise.race([queue, new Promise(r => setTimeout(r, pollMs))]); } catch (e) { }
          if ((pendingAnimations || 0) <= 0) return true;
          await new Promise(r => setTimeout(r, pollMs));
        }
        return false;
      },
      destroy: () => {
        try { clearAllOverlays(); } catch (e) { }
        try { debugBadge.destroy(); } catch (e) { }
        try { startGoalBg.destroy(); } catch (e) { }
        try { antRect.destroy(); } catch (e) { }
        try { boardGraphics.destroy(); } catch (e) { }
        try { labels.forEach(t => t && t.destroy && t.destroy()); } catch (e) { }
        try {
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              try { if (dpTexts[r][c]) dpTexts[r][c].destroy(); } catch (e) { }
              try { if (sugarTexts[r][c]) sugarTexts[r][c].destroy(); } catch (e) { }
            }
          }
        } catch (e) { }
      }
    };

    // Expose visual API to runtime (useCodeExecution / state manager)
    try {
      globalThis.__antDpVisual_api = {
        onUpdate: (i, j, value, meta) => {
          // Queue everything so we can await completion before Victory.
          return enqueue(async () => {
            try {
              const rr = Math.max(0, Math.min(rows - 1, Number(i)));
              const cc = Math.max(0, Math.min(cols - 1, Number(j)));
              const kind = String(meta?.kind ?? meta?.type ?? '').toLowerCase();
              const isChosen = !!meta?.chosen || kind === 'chosen' || kind === 'choose' || kind === 'path' || !!meta?.moveAnt;
              const keepTrail = !!meta?.keepTrail || kind === 'path' || kind === 'chosen' || kind === 'choose';

              // Colors: considered = yellow, chosen/path = green
              const color = isChosen ? 0x10B981 : 0xFBBF24;
              const alpha = (kind === 'path' || kind === 'chosen') ? 0.8 : (isChosen ? 0.4 : 0.35);

              // Highlight cell
              if (!keepTrail) {
                try { scene.antDp.clearAllOverlays(); } catch (e) { }
              }
              setCellOverlay(rr, cc, color, alpha);

              // Update dp text if value is concrete
              if (value !== null && typeof value !== 'undefined' && scene.antDp.dpTexts?.[rr]?.[cc]) {
                scene.antDp.dpTexts[rr][cc].setText(String(value));
              }

              // Optional: animate ant movement
              if (meta?.moveAnt) {
                const dur = Number(meta?.moveMs ?? meta?.durationMs ?? 180);
                await tweenMoveAntToCell(rr, cc, dur);
              }
            } catch (e) { /* ignore */ }
          });
        },
        moveAnt: (r, c, opts = {}) => {
          try {
            return globalThis.__antDpVisual_api.onUpdate(r, c, null, { moveAnt: true, kind: 'path', keepTrail: true, ...(opts || {}) });
          } catch (e) { }
        },
        getPending: () => {
          try { return scene?.antDp?.getPendingAnimations?.() ?? 0; } catch (e) { return 0; }
        },
        waitForIdle: (opts = {}) => {
          try { return scene?.antDp?.waitForIdle?.(opts) ?? Promise.resolve(true); } catch (e) { return Promise.resolve(true); }
        },
        clear: () => { try { clearAllOverlays(); } catch (e) { } }
      };
    } catch (e) {
      console.warn('Could not register antDp visual api:', e);
    }

    // Cleanup on scene shutdown
    try {
      scene.events.once('shutdown', () => { try { delete globalThis.__antDpVisual_api; } catch (e) { } });
    } catch (e) { }

    console.log('✅ setupAntDp complete:', { rows, cols, cellSize });
  } catch (e) {
    console.warn('setupAntDp error:', e);
  }
}



/**
 * Draw queen on the board at position (row, col)
 * @param {Phaser.Scene} scene - Phaser scene
 * @param {number} row - Row index (0-based)
 * @param {number} col - Column index (0-based)
 */
export function drawQueenOnBoard(scene, row, col) {
  if (!scene.nqueen) {
    console.warn('⚠️ N-Queen board not initialized');
    return;
  }

  const cellSize = scene.nqueen.cellSize;
  const boardStartX = scene.nqueen.boardStartX;
  const boardStartY = scene.nqueen.boardStartY;
  const boardWidth = scene.nqueen.n * cellSize;

  // Calculate center position of the cell
  const x = boardStartX - boardWidth / 2 + (col * cellSize) + cellSize / 2;
  const y = boardStartY - boardWidth / 2 + (row * cellSize) + cellSize / 2;

  // Draw star-like symbol (queen) - using graphics to create 8-pointed star
  const queenGraphics = scene.add.graphics();
  queenGraphics.setDepth(7);

  // Draw 8-pointed star pattern
  // Outer points
  const outerRadius = 18;
  const innerRadius = 8;
  const points = [];

  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4; // 8 points = 360/8 = 45 degrees each
    if (i % 2 === 0) {
      // Outer point
      points.push({
        x: x + Math.cos(angle) * outerRadius,
        y: y + Math.sin(angle) * outerRadius
      });
    } else {
      // Inner point
      points.push({
        x: x + Math.cos(angle) * innerRadius,
        y: y + Math.sin(angle) * innerRadius
      });
    }
  }

  // Draw filled star
  queenGraphics.fillStyle(0x000000, 1);
  queenGraphics.beginPath();
  queenGraphics.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    queenGraphics.lineTo(points[i].x, points[i].y);
  }
  queenGraphics.closePath();
  queenGraphics.fillPath();

  // Draw center circle
  queenGraphics.fillCircle(x, y, 3);

  // Store queen reference
  const queen = {
    graphics: queenGraphics,
    row: row,
    col: col,
    x: x,
    y: y
  };

  scene.nqueen.queens.push(queen);

  console.log(`✅ Queen drawn at position (${row}, ${col})`);
}

