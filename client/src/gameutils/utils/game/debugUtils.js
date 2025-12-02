// Debug mode functions
import { getCurrentScene } from './gameState';

// Debug mode variables
let debugMode = false;
let debugGraphics = null;

export function toggleDebugMode() {
  debugMode = !debugMode;

  const currentScene = getCurrentScene();
  if (currentScene) {
    if (debugMode) {
      enableDebugVisuals();
    } else {
      disableDebugVisuals();
    }
  }

  return debugMode;
}

export function isDebugMode() {
  return debugMode;
}

function enableDebugVisuals() {
  const currentScene = getCurrentScene();
  if (!currentScene) return;

  // Create debug graphics layer
  debugGraphics = currentScene.add.graphics();
  debugGraphics.setDepth(1000); // Always on top

  // Draw player hitbox
  drawPlayerHitbox();

  // Draw obstacle hitboxes
  drawObstacleHitboxes();

  // Update debug visuals every frame
  currentScene.events.on('update', updateDebugVisuals);
}

function disableDebugVisuals() {
  if (debugGraphics) {
    debugGraphics.destroy();
    debugGraphics = null;
  }

  const currentScene = getCurrentScene();
  if (currentScene) {
    currentScene.events.off('update', updateDebugVisuals);
  }

  clearDebugLabels();
}

function drawPlayerHitbox() {
  const currentScene = getCurrentScene();
  if (!currentScene || !currentScene.player || !debugGraphics) return;

  // Draw player hitbox (circle) with better visibility
  debugGraphics.lineStyle(3, 0x00ff00, 1.0); // Thicker green outline
  debugGraphics.fillStyle(0x00ff00, 0.1); // More transparent fill
  debugGraphics.fillCircle(currentScene.player.x, currentScene.player.y, 20);
  debugGraphics.strokeCircle(currentScene.player.x, currentScene.player.y, 20);

  // Add label with better contrast
  const label = currentScene.add.text(
    currentScene.player.x,
    currentScene.player.y - 40,
    "Player Hitbox (r=20)",
    {
      fontSize: "11px",
      fill: "#ffffff",
      fontFamily: "Arial",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2
    }
  );
  label.setOrigin(0.5);
  label.setDepth(1001);

  // Store label reference for cleanup
  if (!currentScene.debugLabels) currentScene.debugLabels = [];
  currentScene.debugLabels.push(label);
}

function drawObstacleHitboxes() {
  const currentScene = getCurrentScene();
  if (!currentScene || !debugGraphics) return;

  if (!currentScene.obstacles || currentScene.obstacles.length === 0) {
    const noObstaclesLabel = currentScene.add.text(
      currentScene.cameras.main.centerX,
      50,
      "No Obstacles",
      {
        fontSize: "16px",
        fill: "#ffff00",
        fontFamily: "Arial",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3
      }
    );
    noObstaclesLabel.setOrigin(0.5);
    noObstaclesLabel.setDepth(1001);

    if (!currentScene.debugLabels) currentScene.debugLabels = [];
    currentScene.debugLabels.push(noObstaclesLabel);
    return;
  }

  currentScene.obstacles.forEach((obstacle, index) => {
    // Handle different obstacle types
    if (obstacle.type === "pit" && obstacle.points && obstacle.points.length >= 3) {
      // Calculate bounding box
      const minX = Math.min(...obstacle.points.map(p => p.x));
      const maxX = Math.max(...obstacle.points.map(p => p.x));
      const minY = Math.min(...obstacle.points.map(p => p.y));
      const maxY = Math.max(...obstacle.points.map(p => p.y));
      const width = maxX - minX;
      const height = maxY - minY;

      // Draw bounding box (กล่อง obstacle) - Yellow box
      debugGraphics.lineStyle(4, 0xffff00, 1.0); // Yellow thick outline for bounding box
      debugGraphics.strokeRect(minX - 2, minY - 2, width + 4, height + 4);

      // Draw pit hitbox (polygon) with better visibility
      debugGraphics.lineStyle(3, 0xff0000, 1.0); // Thicker red outline
      debugGraphics.fillStyle(0xff0000, 0.2); // More visible fill

      debugGraphics.beginPath();
      debugGraphics.moveTo(obstacle.points[0].x, obstacle.points[0].y);

      for (let i = 1; i < obstacle.points.length; i++) {
        debugGraphics.lineTo(obstacle.points[i].x, obstacle.points[i].y);
      }
      debugGraphics.closePath();
      debugGraphics.fillPath();
      debugGraphics.strokePath();

      // Draw each point of the obstacle
      obstacle.points.forEach((point, pointIndex) => {
        debugGraphics.fillStyle(0x00ff00, 1.0); // Green points
        debugGraphics.fillCircle(point.x, point.y, 5);
        debugGraphics.lineStyle(2, 0x00ff00, 1.0);
        debugGraphics.strokeCircle(point.x, point.y, 5);

        // Label each point
        const pointLabel = currentScene.add.text(
          point.x + 10,
          point.y - 10,
          `P${pointIndex + 1} (${Math.round(point.x)}, ${Math.round(point.y)})`,
          {
            fontSize: "10px",
            fill: "#00ff00",
            fontFamily: "Arial",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 2,
            backgroundColor: "#000000",
            padding: { x: 3, y: 2 }
          }
        );
        pointLabel.setDepth(1001);
        if (!currentScene.debugLabels) currentScene.debugLabels = [];
        currentScene.debugLabels.push(pointLabel);
      });

      // Add label with better contrast and positioning
      const centerX = obstacle.points.reduce((sum, p) => sum + p.x, 0) / obstacle.points.length;
      const centerY = obstacle.points.reduce((sum, p) => sum + p.y, 0) / obstacle.points.length;

      // Main obstacle label
      const label = currentScene.add.text(
        centerX,
        centerY - 50,
        `OBSTACLE ${index + 1} [${obstacle.type.toUpperCase()}]\nPoints: ${obstacle.points.length}\nSize: ${Math.round(width)}x${Math.round(height)}\nCenter: (${Math.round(centerX)}, ${Math.round(centerY)})`,
        {
          fontSize: "12px",
          fill: "#ffffff",
          fontFamily: "Arial",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 3,
          align: "center",
          backgroundColor: "#000000",
          padding: { x: 8, y: 5 }
        }
      );
      label.setOrigin(0.5);
      label.setDepth(1001);

      if (!currentScene.debugLabels) currentScene.debugLabels = [];
      currentScene.debugLabels.push(label);

      // Draw center point
      debugGraphics.fillStyle(0x0000ff, 1.0); // Blue center point
      debugGraphics.fillCircle(centerX, centerY, 4);
      debugGraphics.lineStyle(2, 0x0000ff, 1.0);
      debugGraphics.strokeCircle(centerX, centerY, 4);
    } else {
      // Handle other obstacle types or invalid obstacles
      const obstacleInfo = `OBSTACLE ${index + 1}\nType: ${obstacle.type || 'unknown'}\nInvalid or missing data`;
      const errorLabel = currentScene.add.text(
        currentScene.cameras.main.centerX,
        80 + (index * 30),
        obstacleInfo,
        {
          fontSize: "11px",
          fill: "#ff0000",
          fontFamily: "Arial",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 2,
          backgroundColor: "#000000",
          padding: { x: 5, y: 3 },
          align: "center"
        }
      );
      errorLabel.setOrigin(0.5);
      errorLabel.setDepth(1001);
      if (!currentScene.debugLabels) currentScene.debugLabels = [];
      currentScene.debugLabels.push(errorLabel);
    }
  });

  // Show total obstacle count
  const totalLabel = currentScene.add.text(
    currentScene.cameras.main.centerX,
    30,
    `Total Obstacles: ${currentScene.obstacles.length}`,
    {
      fontSize: "14px",
      fill: "#ffffff",
      fontFamily: "Arial",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
      backgroundColor: "#000000",
      padding: { x: 10, y: 5 }
    }
  );
  totalLabel.setOrigin(0.5);
  totalLabel.setDepth(1001);

  if (!currentScene.debugLabels) currentScene.debugLabels = [];
  currentScene.debugLabels.push(totalLabel);
}

function updateDebugVisuals() {
  const currentScene = getCurrentScene();
  if (!debugMode || !currentScene || !debugGraphics) return;

  // Clear previous debug visuals
  debugGraphics.clear();
  clearDebugLabels();

  // Redraw all debug visuals
  drawPlayerHitbox();
  drawObstacleHitboxes();
}

export function clearDebugLabels() {
  const currentScene = getCurrentScene();
  if (currentScene && currentScene.debugLabels) {
    currentScene.debugLabels.forEach(label => label.destroy());
    currentScene.debugLabels = [];
  }
}

