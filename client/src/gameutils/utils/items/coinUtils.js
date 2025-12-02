// Coin management functions
import { getCurrentGameState, setCurrentGameState } from '../game/gameState';

export function getPlayerCoins() {
  return getCurrentGameState().playerCoins || [];
}

export function addCoinToPlayer(coin) {
  const currentState = getCurrentGameState();
  const coins = [...(currentState.playerCoins || [])];
  coins.push(coin);
  setCurrentGameState({ playerCoins: coins });

  return coins;
}

export function clearPlayerCoins() {
  setCurrentGameState({ playerCoins: [] });
}

export function swapPlayerCoins(index1, index2) {
  const currentState = getCurrentGameState();
  const coins = [...(currentState.playerCoins || [])];
  const i1 = parseInt(index1) - 1; // Convert to 0-based index
  const i2 = parseInt(index2) - 1;

  if (i1 >= 0 && i1 < coins.length && i2 >= 0 && i2 < coins.length) {
    // Swap the coins
    const temp = coins[i1];
    coins[i1] = coins[i2];
    coins[i2] = temp;

    setCurrentGameState({ playerCoins: coins });
    return true;
  }
  return false;
}

export function comparePlayerCoins(index1, index2, operator) {
  const currentState = getCurrentGameState();
  const coins = currentState.playerCoins || [];
  const i1 = parseInt(index1) - 1; // Convert to 0-based index
  const i2 = parseInt(index2) - 1;

  if (i1 < 0 || i1 >= coins.length || i2 < 0 || i2 >= coins.length) {
    return false;
  }

  const value1 = coins[i1].value;
  const value2 = coins[i2].value;

  switch (operator) {
    case 'GT': return value1 > value2;
    case 'LT': return value1 < value2;
    case 'GTE': return value1 >= value2;
    case 'LTE': return value1 <= value2;
    case 'EQ': return value1 === value2;
    case 'NEQ': return value1 !== value2;
    default: return false;
  }
}

export function getPlayerCoinValue(index) {
  const currentState = getCurrentGameState();
  const coins = currentState.playerCoins || [];
  const i = parseInt(index) - 1; // Convert to 0-based index

  if (i < 0 || i >= coins.length) {
    return 0;
  }

  return coins[i].value;
}

export function getPlayerCoinCount() {
  const currentState = getCurrentGameState();
  return (currentState.playerCoins || []).length;
}

export function arePlayerCoinsSorted(order) {
  const currentState = getCurrentGameState();
  const coins = currentState.playerCoins || [];
  if (coins.length <= 1) return true;

  for (let i = 0; i < coins.length - 1; i++) {
    if (order === 'ASC') {
      if (coins[i].value > coins[i + 1].value) return false;
    } else { // DESC
      if (coins[i].value < coins[i + 1].value) return false;
    }
  }
  return true;
}

