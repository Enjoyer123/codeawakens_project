import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

/**
 * Loads a background image into the scene.
 * Handles both base64 data URLs and standard HTTP URLs.
 */
const loadBackgroundImage = (scene, imageUrl, backgroundSpriteRef, redrawPhaser) => {
  // Clean up existing background
  if (backgroundSpriteRef.current) {
    backgroundSpriteRef.current.destroy();
    backgroundSpriteRef.current = null;
  }

  if (scene.textures.exists('background')) {
    scene.textures.remove('background');
  }

  // Format URL if needed (Clean up `/api` if present or double slashes)
  let finalUrl = imageUrl;
  if (!finalUrl.startsWith('data:') && !finalUrl.startsWith('http')) {
    finalUrl = finalUrl.replace('/api', '').replace('//', '/');
    if (!finalUrl.startsWith('/')) finalUrl = '/' + finalUrl;
  }

  const applySprite = () => {
    const bgSprite = scene.add.image(scene.scale.width / 2, scene.scale.height / 2, 'background');
    bgSprite.setDisplaySize(scene.scale.width, scene.scale.height);
    bgSprite.setDepth(0); // Keep background at lowest depth
    backgroundSpriteRef.current = bgSprite;
    redrawPhaser();
  };

  // Image Loading logic
  if (finalUrl.startsWith('data:')) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (scene.textures.exists('background')) scene.textures.remove('background');
      scene.textures.addImage('background', img);
      applySprite();
    };
    img.onerror = () => {
      scene.cameras.main.setBackgroundColor(0x000000);
      redrawPhaser();
    };
    img.src = finalUrl;
  } else {
    scene.load.image('background', finalUrl);
    scene.load.once('filecomplete-image-background', applySprite);
    scene.load.once('loaderror', () => {
      scene.cameras.main.setBackgroundColor(0x000000);
      redrawPhaser();
    });
    scene.load.start();
  }
};

export const usePhaserGameInit = ({
  gameRef,
  phaserGameRef,
  phaserGraphicsRef,
  backgroundSpriteRef,
  backgroundImageUrl, // Watched dependency prop
  canvasSize,
  createSceneCallback,
  updateSceneCallback,
  redrawPhaser
}) => {

  const latestBgUrlRef = useRef(backgroundImageUrl);
  latestBgUrlRef.current = backgroundImageUrl;

  // 1. Initialize Phaser Game instance
  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return;

    class EditorScene extends Phaser.Scene {
      constructor() { super({ key: 'EditorScene' }); }

      preload() {
        this.load.image('main_1', '/characters/main_1_00.png');
        this.load.image('main_2', '/characters/main_2_00.png');
        this.load.image('main_3', '/characters/main_3_00.png');
        this.load.image('vampire_1', '/enemies/vampire_1_00.png');
        this.load.image('vampire_2', '/enemies/vampire_2_00.png');
        this.load.image('vampire_3', '/enemies/vampire_3_00.png');
        this.load.image('slime_1', '/characters/Slime1.png');
        this.load.image('bot_slime1', '/characters/Slime1.png');
      }

      create() {
        const graphics = this.add.graphics();
        graphics.setDepth(1);
        phaserGraphicsRef.current = graphics;

        if (createSceneCallback) createSceneCallback(this);

        this.time.delayedCall(100, () => redrawPhaser());
        if (latestBgUrlRef.current) {
          loadBackgroundImage(this, latestBgUrlRef.current, backgroundSpriteRef, redrawPhaser);
        }
      }

      update() {
        if (updateSceneCallback) updateSceneCallback(this);
      }
    }

    const config = {
      type: Phaser.AUTO,
      width: canvasSize.width || 1200,
      height: canvasSize.height || 920,
      parent: gameRef.current,
      backgroundColor: '#000000',
      scene: EditorScene,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      physics: { default: 'arcade', arcade: { debug: false } }
    };

    phaserGameRef.current = new Phaser.Game(config);

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
      phaserGraphicsRef.current = null;
      backgroundSpriteRef.current = null;
    };
  }, [canvasSize]);

  // 2. Handle Background Image reload dynamically
  useEffect(() => {
    const game = phaserGameRef.current;
    if (!game || !game.scene || game.scene.scenes.length === 0) return;

    const scene = game.scene.scenes[0];

    // Clear background if no URL provided
    if (!backgroundImageUrl) {
      if (backgroundSpriteRef.current) {
        backgroundSpriteRef.current.destroy();
        backgroundSpriteRef.current = null;
      }
      scene.cameras.main.setBackgroundColor(0x000000);
      redrawPhaser();
      return;
    }

    // Load actual background
    setTimeout(() => {
      loadBackgroundImage(scene, backgroundImageUrl, backgroundSpriteRef, redrawPhaser);
    }, 50);

  }, [backgroundImageUrl]);

  return { phaserLoaded: true };
};
