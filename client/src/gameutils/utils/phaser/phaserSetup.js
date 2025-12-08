// Phaser setup functions
import Phaser from "phaser";
import { playIdle } from '../../phaser/utils/playerAnimation';
import { updatePlayerArrow } from '../phaserGame';

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
  
  // Draw edges FIRST (behind nodes)
  graphics.lineStyle(3, 0xffd700, 1);
  scene.levelData.edges.forEach((edge) => {
    const fromNode = scene.levelData.nodes.find((n) => n.id === edge.from);
    const toNode = scene.levelData.nodes.find((n) => n.id === edge.to);
    if (fromNode && toNode) {
      graphics.lineBetween(fromNode.x, fromNode.y, toNode.x, toNode.y);
    }
  });

  // Initialize node labels array if it doesn't exist
  if (!scene.nodeLabels) {
    scene.nodeLabels = [];
  } else {
    // Clean up existing labels
    scene.nodeLabels.forEach(label => {
      if (label && !label.scene) {
        label.destroy();
      }
    });
    scene.nodeLabels = [];
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

  scene.monsters = [];

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
      monsterSprite.setScale(1.8); // Increase sprite size
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
    const startNode = scene.levelData.nodes.find(n => n.id === scene.levelData.startNodeId);
    if (!startNode) return;

    // Create player sprite instead of circle
    scene.player = scene.add.sprite(startNode.x, startNode.y, 'player');
    scene.player.setScale(1.8); // Increase sprite size
    scene.player.setDepth(8);

    // Set player properties for new utility functions
    scene.player.directions = ['right', 'down', 'left', 'up'];
    scene.player.directionIndex = 0;
    scene.player.currentNodeIndex = scene.levelData.startNodeId;
    scene.player.mapConfig = { tileSize: 32 }; // Default tile size
    scene.player.mapImage = null; // Will be set if needed

    // Create player arrow for direction indication - larger to match bigger sprite
    scene.playerArrow = scene.add.triangle(
      startNode.x + 30,
      startNode.y,
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
      updatePlayerArrow(scene, startNode.x, startNode.y, 0);
    }, 100);
  } catch (error) {
    console.error('❌ Error creating player:', error);
  }
}

