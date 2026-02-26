// Coin management functions
import { getCurrentGameState, setCurrentGameState, getCurrentScene } from '../shared/game';
import { updateGoalUI } from '../setup/uiManager';

export function getPlayerCoins() {
  return getCurrentGameState().playerCoins || [];
}

export function addCoinToPlayer(coin) {
  const currentState = getCurrentGameState();
  const coins = [...(currentState.playerCoins || [])];
  coins.push(coin);
  setCurrentGameState({ playerCoins: coins });

  const scene = getCurrentScene();
  if (scene) {
    updateGoalUI(scene, 'coins', coins.length, coins);
  }

  return coins;
}

export function clearPlayerCoins() {
  setCurrentGameState({ playerCoins: [] });
  const scene = getCurrentScene();
  if (scene) {
    updateGoalUI(scene, 'coins', 0, []);
  }
}

export function swapPlayerCoins(index1, index2) {
  const currentState = getCurrentGameState();
  const coins = [...(currentState.playerCoins || [])];
  const i1 = parseInt(index1) - 1; // Convert to 0-based index
  const i2 = parseInt(index2) - 1;

  console.log(`[coinUtils] Attempt swap: i1=${i1} (val=${coins[i1]?.value}) with i2=${i2} (val=${coins[i2]?.value}). length: ${coins.length}`);

  if (i1 >= 0 && i1 < coins.length && i2 >= 0 && i2 < coins.length) {
    // Swap the coins
    const temp = coins[i1];
    coins[i1] = coins[i2];
    coins[i2] = temp;

    console.log(`[coinUtils] Swap SUCCESS. New order:`, coins.map(c => c.value).join(', '));

    setCurrentGameState({ playerCoins: coins });

    const scene = getCurrentScene();
    if (scene) {
      updateGoalUI(scene, 'coins', coins.length, coins);
    }

    return true;
  }
  console.log(`[coinUtils] Swap FAILED limit check.`);
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

  let result = false;
  switch (operator) {
    case 'GT': result = value1 > value2; break;
    case 'LT': result = value1 < value2; break;
    case 'GTE': result = value1 >= value2; break;
    case 'LTE': result = value1 <= value2; break;
    case 'EQ': result = value1 === value2; break;
    case 'NEQ': result = value1 !== value2; break;
  }

  console.log(`[coinUtils] Comparing index ${i1} (${value1}) ${operator} index ${i2} (${value2}) => ${result}`);
  return result;
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

