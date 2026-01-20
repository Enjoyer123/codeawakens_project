// Collision detection functions
import { getCurrentScene, getLevelData, directions, getCurrentGameState } from '../../utils/game/gameState';

export function checkObstacleCollisionWithRadius(scene, x, y, radius) {
  if (!scene.obstacles) {
    return false;
  }

  for (let obstacle of scene.obstacles) {
    if (obstacle.type === "pit") {
      const collision = isCircleIntersectingPolygon(x, y, radius, obstacle.points);
      if (collision) {
        return true;
      }
    }
  }
  return false;
}

export function isCircleIntersectingPolygon(circleX, circleY, radius, polygon) {
  if (isPointInPolygon(circleX, circleY, polygon)) {
    return true;
  }

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const edge1 = polygon[i];
    const edge2 = polygon[j];

    const dist = distanceFromPointToLineSegment(circleX, circleY, edge1.x, edge1.y, edge2.x, edge2.y);

    if (dist <= radius) {
      return true;
    }
  }

  return false;
}

export function distanceFromPointToLineSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) {
    return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
  }

  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  return Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
}

export function isPointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (
      polygon[i].y > y !== polygon[j].y > y &&
      x <
      ((polygon[j].x - polygon[i].x) * (y - polygon[i].y)) /
      (polygon[j].y - polygon[i].y) +
      polygon[i].x
    ) {
      inside = !inside;
    }
  }
  return inside;
}

// Function to check if movement path intersects with obstacles
export function checkMovementCollision(scene, fromNode, toNode) {
  if (!scene || !scene.obstacles) {
    return false;
  }

  // First check if the destination node is inside an obstacle
  if (checkObstacleCollisionWithRadius(scene, toNode.x, toNode.y, 10)) {
    return true;
  }

  // Then check if the path from fromNode to toNode intersects with any obstacles
  const pathLength = Math.sqrt((toNode.x - fromNode.x) ** 2 + (toNode.y - fromNode.y) ** 2);
  const steps = Math.ceil(pathLength / 10); // Check every 10 pixels

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const checkX = fromNode.x + (toNode.x - fromNode.x) * t;
    const checkY = fromNode.y + (toNode.y - fromNode.y) * t;

    if (checkObstacleCollisionWithRadius(scene, checkX, checkY, 10)) {
      return true;
    }
  }

  return false;
}

// Movement condition checks
export function canMoveForward() {
  const levelData = getLevelData();
  const currentState = getCurrentGameState();

  if (!levelData) return false;

  const currentNode = levelData.nodes.find((n) => n.id === currentState.currentNodeId);
  if (!currentNode) return false;

  const connectedNodes = levelData.edges
    .filter((edge) => edge.from === currentState.currentNodeId || edge.to === currentState.currentNodeId)
    .map((edge) => (edge.from === currentState.currentNodeId ? edge.to : edge.from))
    .map((nodeId) => levelData.nodes.find((n) => n.id === nodeId))
    .filter((node) => node);

  const dirVector = directions[currentState.direction];

  for (let node of connectedNodes) {
    const dx = node.x - currentNode.x;
    const dy = node.y - currentNode.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      if ((dirVector.x > 0 && dx > 0) || (dirVector.x < 0 && dx < 0)) {
        return true;
      }
    } else {
      if ((dirVector.y > 0 && dy > 0) || (dirVector.y < 0 && dy < 0)) {
        return true;
      }
    }
  }
  return false;
}

export function nearPit() {
  const scene = getCurrentScene();
  if (!scene || !scene.player) {
    return false;
  }

  const playerX = scene.player.x;
  const playerY = scene.player.y;

  const result = checkObstacleCollisionWithRadius(scene, playerX, playerY, 30);

  return result;
}

export function atGoal() {
  const levelData = getLevelData();
  const currentState = getCurrentGameState();
  return currentState.currentNodeId === levelData?.goalNodeId;
}

