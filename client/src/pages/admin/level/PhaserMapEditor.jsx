import { useState, useEffect, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const PhaserMapEditor = ({
  canvasSize,
  backgroundImageUrl,
  formData,
  currentMode,
  selectedNode,
  onFormDataChange,
  onSelectedNodeChange,
}) => {
  const gameRef = useRef(null);
  const phaserGameRef = useRef(null);
  const phaserGraphicsRef = useRef(null);
  const backgroundSpriteRef = useRef(null);
  const [phaserLoaded, setPhaserLoaded] = useState(false);
  
  // Refs for callbacks
  const backgroundImageUrlRef = useRef(backgroundImageUrl);
  const currentModeRef = useRef(currentMode);
  const formDataRef = useRef(formData);
  const selectedNodeRef = useRef(selectedNode);

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

  // Phaser helper functions
  const findNodeAt = (x, y) => {
    const threshold = 20;
    const nodes = formDataRef.current.nodes;
    return nodes.find(node => 
      Math.abs(node.x - x) < threshold && 
      Math.abs(node.y - y) < threshold
    );
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
      const newMonster = {
        id: newMonsterId,
        name: '👹 Goblin',
        hp: 2,
        damage: 100,
        x: Math.round(x),
        y: Math.round(y),
        startNode: clickedNode ? clickedNode.id : null,
        patrol: [],
        defeated: false,
        detectionRange: 50,
      };
      onFormDataChange({
        ...currentFormData,
        monsters: [...currentFormData.monsters, newMonster],
      });
    } else if (mode === 'obstacle') {
      // Add obstacle at clicked position
      const newObstacleId = currentFormData.obstacles.length > 0 
        ? Math.max(...currentFormData.obstacles.map(o => o.id)) + 1 
        : 1;
      const newObstacle = {
        id: newObstacleId,
        x: Math.round(x),
        y: Math.round(y),
        type: 'wall',
      };
      onFormDataChange({
        ...currentFormData,
        obstacles: [...currentFormData.obstacles, newObstacle],
      });
    } else if (mode === 'delete' && clickedNode) {
      // Delete node
      if (confirm(`ลบ Node ${clickedNode.id}?`)) {
        onFormDataChange({
          ...currentFormData,
          nodes: currentFormData.nodes.filter(n => n.id !== clickedNode.id),
          edges: currentFormData.edges.filter(e => 
            e.from !== clickedNode.id && e.to !== clickedNode.id
          ),
          start_node_id: currentFormData.start_node_id === clickedNode.id ? null : currentFormData.start_node_id,
          goal_node_id: currentFormData.goal_node_id === clickedNode.id ? null : currentFormData.goal_node_id,
        });
      }
    }
  };

  const redrawPhaser = () => {
    const currentGraphics = phaserGraphicsRef.current;
    if (!currentGraphics) {
      return;
    }
    
    const currentFormData = formDataRef.current;
    const currentSelectedNode = selectedNodeRef.current;
    
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
    
    // Draw obstacles
    if (currentFormData.obstacles && currentFormData.obstacles.length > 0) {
      currentFormData.obstacles.forEach(obstacle => {
        if (obstacle.x && obstacle.y) {
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
                  const newSprite = scene.add.image(0, 0, 'background');
                  backgroundSpriteRef.current = newSprite;
                  newSprite.setOrigin(0, 0);
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
                const newSprite = scene.add.image(0, 0, 'background');
                backgroundSpriteRef.current = newSprite;
                newSprite.setOrigin(0, 0);
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
        if (currentModeRef.current === 'delete') {
          const node = findNodeAt(pointer.x, pointer.y);
          if (node) {
            scene.input.setDefaultCursor('pointer');
          } else {
            scene.input.setDefaultCursor('default');
          }
        } else {
          scene.input.setDefaultCursor('default');
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
  }, [formData.nodes, formData.edges, formData.start_node_id, formData.goal_node_id, selectedNode, phaserLoaded]);

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
              const newSprite = scene.add.image(0, 0, 'background');
              backgroundSpriteRef.current = newSprite;
              newSprite.setOrigin(0, 0);
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
            const newSprite = scene.add.image(0, 0, 'background');
            backgroundSpriteRef.current = newSprite;
            newSprite.setOrigin(0, 0);
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
        <div className="w-full h-[600px] flex items-center justify-center text-white">
          <div className="text-center">
            <div className="text-lg mb-2">⏳ กำลังโหลด Level Editor...</div>
            <div className="text-sm text-gray-400">กรุณารอสักครู่</div>
          </div>
        </div>
      ) : (
        <div ref={gameRef} id="phaser-game-container" style={{ width: '100%', height: '600px', display: 'flex', justifyContent: 'center' }}></div>
      )}
    </div>
  );
};

export default PhaserMapEditor;

