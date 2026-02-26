// Entities Domain - Re-export hub
// Groups all entity management (coins, people, treasures, weapons)

// Coin utils
export {
    getPlayerCoins, addCoinToPlayer, clearPlayerCoins,
    swapPlayerCoins, comparePlayerCoins, getPlayerCoinValue,
    getPlayerCoinCount, arePlayerCoinsSorted
} from './coinUtils';

// Person utils
export {
    rescuePerson, rescuePersonAtNode, hasPerson, personRescued,
    getPersonCount, allPeopleRescued, getRescuedPeople,
    clearRescuedPeople, resetAllPeople
} from './personUtils';

// Treasure utils
export {
    hasTreasureAtNode, collectTreasure, getCollectedTreasures,
    isTreasureCollected, resetTreasures, hasTreasure, treasureCollected
} from './treasureUtils';

// Weapon utils
export {
    getWeaponsData, loadWeaponsData, getWeaponData, calculateDamage
} from './weaponUtils';

// Collection visuals
export {
    updateTreasureDisplay, collectTreasureVisual, rescuePersonVisual,
    collectCoinByPlayer, showCoinCollectionEffect, haveCoinAtPosition
} from './collection';

// Playback
export { playRescueAnimation, playCollectAnimation } from './actionPlayback';
