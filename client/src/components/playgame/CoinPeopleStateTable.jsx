import React from 'react';

const CoinPeopleStateTable = ({ levelData, playerCoins = [], rescuedPeople = [], collectedTreasures = [] }) => {
    // Show if there are coins collected or if it's a "save people" level or "treasures" level
    const showCoins = playerCoins.length > 0;
    // Show people if there are people defined in level data (more robust than checking goalType)
    const showPeople = levelData?.people?.length > 0;
    const showTreasures = (levelData?.treasures?.length > 0) || (collectedTreasures && collectedTreasures.length > 0);

    if (!showCoins && !showPeople && !showTreasures) return null;

    return (
        <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-90 border-2 border-yellow-500 rounded-lg p-3 z-[9999] max-w-md flex flex-col gap-2" style={{ position: 'absolute' }}>

            {/* Coin Display */}
            {showCoins && (
                <div className="bg-gray-800/50 rounded p-2 border border-gray-700">
                    <div className="text-yellow-400 font-bold text-xs mb-1 flex items-center gap-1">
                        <span>🪙 เหรียญ ({playerCoins.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {playerCoins.slice(0, 5).map((coin, index) => (
                            <div
                                key={`coin-${coin.id}-${index}`}
                                className="bg-gray-800 px-2 py-0.5 rounded text-xs text-gray-300 border border-gray-600 font-mono"
                                title={`เหรียญที่ตำแหน่ง ${index + 1}: ${coin.value} points`}
                            >
                                {coin.value}
                            </div>
                        ))}
                        {playerCoins.length > 5 && <span className="text-xs text-white/60 self-center">+{playerCoins.length - 5}</span>}
                    </div>
                    <div className="text-[10px] text-white/60 mt-1 text-right">
                        รวม: {playerCoins.reduce((sum, coin) => sum + coin.value, 0)} points
                    </div>
                </div>
            )}

            {/* People Rescue Display */}
            {showPeople && (
                <div className="bg-gray-800/50 rounded p-2 border border-gray-700">
                    <div className="text-blue-400 font-bold text-xs mb-1 flex items-center gap-1">
                        <span>🆘 คน ({rescuedPeople.length}/{levelData?.people?.length || 0})</span>
                    </div>
                    {/* ... (existing people rendering code) ... */}
                    <div className="grid grid-cols-3 gap-1 text-xs">
                        {levelData.people?.slice(0, 6).map((person, index) => {
                            // Ensure numeric comparison to avoid type mismatches
                            const isRescued = rescuedPeople.some(rescued => Number(rescued.nodeId) === Number(person.nodeId));
                            return (
                                <div
                                    key={`person-${person.id}`}
                                    className={`px-1 py-0.5 rounded border text-center transition-colors ${isRescued
                                        ? 'bg-green-900/50 text-green-300 border-green-700'
                                        : 'bg-gray-950 text-gray-500 border-gray-800'
                                        }`}
                                    title={`${person.personName} ที่ Node ${person.nodeId}`}
                                >
                                    {isRescued ? '✅' : '❌'}
                                    <span className="ml-1 text-[10px] opacity-70">{person.personName}</span>
                                </div>
                            );
                        })}
                        {levelData.people && levelData.people.length > 6 && (
                            <div className="text-xs text-white/60 text-center self-center underline decoration-dotted" title="More people...">
                                +{levelData.people.length - 6}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Treasure Display */}
            {(levelData?.treasures?.length > 0 || collectedTreasures.length > 0) && (
                <div className="bg-gray-800/50 rounded p-2 border border-yellow-700/50">
                    <div className="text-amber-400 font-bold text-xs mb-1 flex items-center gap-1">
                        <span>💎 สมบัติ ({collectedTreasures.length}/{levelData?.treasures?.length || 0})</span>
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                        {levelData?.treasures?.map((treasure, index) => {
                            const isCollected = collectedTreasures.some(t => t.nodeId === treasure.nodeId) || treasure.collected;
                            return (
                                <div
                                    key={`treasure-${index}`}
                                    className={`px-2 py-1 rounded flex justify-between items-center ${isCollected ? 'bg-amber-900/40 text-amber-200 border border-amber-800'
                                        : 'bg-gray-950 text-gray-500 border border-gray-800'
                                        }`}
                                >
                                    <span>#{index + 1} Node {treasure.nodeId}</span>
                                    <span>{isCollected ? '✅' : '🔒'}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoinPeopleStateTable;
