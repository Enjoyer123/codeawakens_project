// Combat State Management
let combatState = {
  isInCombat: false,
  currentEnemy: null,
  playerTurn: true,
  combatQueue: [],
  combatResults: [],
  isCombatResolved: false,
  combatWinner: null, // 'player' or 'enemy'
  combatPaused: false
};

export function getCombatState() {
  return combatState;
}

export function setCombatState(newState) {
  combatState = { ...combatState, ...newState };
}

export function resetCombatState() {
  combatState = {
    isInCombat: false,
    currentEnemy: null,
    playerTurn: true,
    combatQueue: [],
    combatResults: [],
    isCombatResolved: false,
    combatWinner: null,
    combatPaused: false
  };
}

