import React from 'react';

export const useCoinPeopleTable = (levelData, playerCoins, rescuedPeople, collectedTreasures) => {
    // Show if there are coins collected or if it's a "save people" level or "treasures" level
    const showCoins = playerCoins && playerCoins.length > 0;
    // Show people if there are people defined in level data
    const showPeople = levelData?.people?.length > 0;
    const showTreasures = (levelData?.treasures?.length > 0) || (collectedTreasures && collectedTreasures.length > 0);

    const isVisible = showCoins || showPeople || showTreasures;

    return {
        isVisible,
        showCoins,
        showPeople,
        showTreasures,
        playerCoins: playerCoins || [],
        rescuedPeople: rescuedPeople || [],
        collectedTreasures: collectedTreasures || [],
        levelData
    };
};
