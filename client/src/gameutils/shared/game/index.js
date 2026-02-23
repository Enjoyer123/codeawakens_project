// Game Utilities - Re-export hub
// Central export point for all game utility functions

// Game state management
export {
    getCurrentScene,
    setCurrentScene,
    setLevelData,
    getLevelData,
    getCurrentGameState,
    setCurrentGameState,
    getPlayerHp,
    setPlayerHp,
    resetPlayerHp,
    // Navigation and direction states
    directions
} from './gameState';

// Victory conditions
export {
    checkVictoryConditions,
    generateVictoryHint
} from './victoryUtils';

export {
    safeParse,
    normalizeNodes,
    normalizeEdges,
    normalizePatternHints
} from './levelParser';
