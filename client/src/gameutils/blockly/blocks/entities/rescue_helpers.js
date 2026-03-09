// Rescue Helper Functions
import {
    rescuePerson as gameRescuePerson,
    rescuePersonAtNode as gameRescuePersonAtNode,
    hasPerson as gameHasPerson,
    personRescued as gamePersonRescued,
    getPersonCount as gameGetPersonCount,
    allPeopleRescued as gameAllPeopleRescued,
    getRescuedPeople as gameGetRescuedPeople,
    clearRescuedPeople as gameClearRescuedPeople,
    resetAllPeople as gameResetAllPeople
} from '../../../entities/personUtils';

import { getCurrentGameState } from '../../../shared/game/gameState';
import { playRescueAnimation } from '../../../entities/actionPlayback';

export function rescuePerson() {
    return gameRescuePerson();
}

export async function rescuePersonAtNode(nodeId) {
    const result = await gameRescuePersonAtNode(nodeId);
    if (result && result.success && getCurrentGameState().currentScene) {
        await playRescueAnimation(getCurrentGameState().currentScene, result);
    }
    return result;
}

export function hasPerson() {
    return gameHasPerson();
}

export function personRescued() {
    return gamePersonRescued();
}

export function getPersonCount() {
    return gameGetPersonCount();
}

export function allPeopleRescued() {
    return gameAllPeopleRescued();
}

export function getRescuedPeople() {
    return gameGetRescuedPeople();
}

export function clearRescuedPeople() {
    return gameClearRescuedPeople();
}

export function resetAllPeople() {
    return gameResetAllPeople();
}
