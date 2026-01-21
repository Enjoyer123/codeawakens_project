// Items Utilities - Re-export hub
// Central export point for all item-related functionality

// Weapon management
export {
    getWeaponsData,
    loadWeaponsData,
    getWeaponData,
    calculateDamage,
    displayPlayerWeapon,
    displayPlayerEffect,
    updateWeaponPosition,
    getPlayerWeaponSprite,
    updatePlayerWeaponDisplay,
    foundMonster
} from './weaponUtils';

// Coin management
export {
    getPlayerCoins,
    addCoinToPlayer,
    clearPlayerCoins,
    swapPlayerCoins,
    comparePlayerCoins,
    getPlayerCoinValue,
    getPlayerCoinCount,
    arePlayerCoinsSorted
} from './coinUtils';

// Person rescue management
export {
    rescuePerson,
    rescuePersonAtNode,
    hasPerson,
    personRescued,
    getPersonCount,
    allPeopleRescued,
    getRescuedPeople,
    clearRescuedPeople,
    resetAllPeople
} from './personUtils';

// Stack operations and treasure
export {
    getStack,
    pushToStack,
    popFromStack,
    isStackEmpty,
    getStackCount,
    hasTreasureAtNode,
    collectTreasure,
    isTreasureCollected,
    clearStack,
    pushNode,
    popNode,
    keepItem,
    hasTreasure,
    treasureCollected,
    stackEmpty,
    stackCount,
    getCollectedTreasures
} from './stackUtils';
