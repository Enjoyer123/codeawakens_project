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
} from '../../../gameUtils';

export function rescuePerson() {
    return gameRescuePerson();
}

export function rescuePersonAtNode(nodeId) {
    return gameRescuePersonAtNode(nodeId);
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
