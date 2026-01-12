import { useState, useEffect, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export const usePhaserGameInit = ({
  gameRef,
  phaserGameRef,
  phaserGraphicsRef,
  backgroundSpriteRef,
  backgroundImageUrlRef, // Use Ref for latest value in callbacks
  backgroundImageUrl,    // Use value for useEffect dependency
  canvasSize,
  createSceneCallback,
  updateSceneCallback,
  redrawPhaser
}) => {
  const [phaserLoaded, setPhaserLoaded] = useState(false);

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
              // Store graphics ref here to ensure it's available
               const phaserGraphics = this.add.graphics();
               phaserGraphicsRef.current = phaserGraphics;
               
               // Load initial background
               const loadBackground = () => {
                const currentBgUrl = backgroundImageUrlRef.current;
                
                if (currentBgUrl) {
                  let imageUrl = currentBgUrl;
                  if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('http')) {
                    imageUrl = `${API_BASE_URL}${currentBgUrl}`;
                  }
                  
                  // For data URLs
                  if (imageUrl.startsWith('data:')) {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                      try {
                        if (this.textures.exists('background')) {
                          this.textures.remove('background');
                        }
                        this.textures.addImage('background', img);
                        const newSprite = this.add.image(
                          this.scale.width / 2, 
                          this.scale.height / 2, 
                          'background'
                        );
                        backgroundSpriteRef.current = newSprite;
                        newSprite.setDisplaySize(this.scale.width, this.scale.height);
                        newSprite.setDepth(0);
                        newSprite.setVisible(true);
                        if (phaserGraphicsRef.current) {
                          phaserGraphicsRef.current.setDepth(1);
                        }
                        redrawPhaser();
                      } catch (err) { }
                    };
                    img.onerror = () => {
                      this.cameras.main.setBackgroundColor(0x000000);
                      redrawPhaser();
                    };
                    img.src = imageUrl;
                  } else {
                    // For regular URLs
                    this.load.image('background', imageUrl);
                    this.load.once('filecomplete-image-background', () => {
                      const newSprite = this.add.image(
                        this.scale.width / 2, 
                        this.scale.height / 2, 
                        'background'
                      );
                      backgroundSpriteRef.current = newSprite;
                      newSprite.setDisplaySize(this.scale.width, this.scale.height);
                      newSprite.setDepth(0);
                      newSprite.setVisible(true);
                      if (phaserGraphicsRef.current) {
                        phaserGraphicsRef.current.setDepth(1);
                      }
                      redrawPhaser();
                    });
                    this.load.once('loaderror', () => {
                      this.cameras.main.setBackgroundColor(0x000000);
                      redrawPhaser();
                    });
                    this.load.start();
                  }
                } else {
                   this.cameras.main.setBackgroundColor(0x000000);
                   redrawPhaser();
                }
              };
               
              if (createSceneCallback) {
                  createSceneCallback(this);
              }
              
              // Load background after a short delay
              setTimeout(() => {
                loadBackground();
              }, 200);
              
              // Initial draw
              setTimeout(() => {
                redrawPhaser();
              }, 100);
            }
            
            update() {
              if (updateSceneCallback) {
                  updateSceneCallback(this);
              }
            }
          }

          const config = {
            type: window.Phaser.AUTO,
            width: 1200,
            height: 920,
            parent: gameRef.current,
            backgroundColor: '#000000',
            scene: EditorScene,
            scale: {
              mode: window.Phaser.Scale.FIT,
              autoCenter: window.Phaser.Scale.CENTER_BOTH
            },
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
  }, [phaserLoaded, gameRef.current, canvasSize]); // Removed gameRef.current from dependency to avoid re-renders loop if ref changes? No, ref shouldn't trigger re-render.

  // Reload background image when it changes
  useEffect(() => {
    const game = phaserGameRef.current;
    if (!phaserLoaded || !game || !game.scene || game.scene.scenes.length === 0) {
      return;
    }
    
    const scene = game.scene.scenes[0];
    const currentGraphics = phaserGraphicsRef.current;
    const currentSprite = backgroundSpriteRef.current;
    const currentBgUrl = backgroundImageUrl; // Use the prop value here
    
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
  }, [backgroundImageUrl, phaserLoaded]); // Only rerun when URL changes

  return { phaserLoaded };
};
