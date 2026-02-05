import React, { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

const CoinPeopleStateTable = ({ levelData, playerCoins = [], rescuedPeople = [], collectedTreasures = [] }) => {
    const [isMinimized, setIsMinimized] = useState(false);

    // Show if there are coins collected or if it's a "save people" level or "treasures" level
    const showCoins = playerCoins.length > 0;
    // Show people if there are people defined in level data (more robust than checking goalType)
    const showPeople = levelData?.people?.length > 0;
    const showTreasures = (levelData?.treasures?.length > 0) || (collectedTreasures && collectedTreasures.length > 0);

    if (!showCoins && !showPeople && !showTreasures) return null;

    return (
        <div
            className={`absolute top-2 right-2 z-[9999] transition-all duration-300 ${isMinimized ? 'w-64' : 'max-w-sm w-full'}`}
        >
            {/* Background Layer */}
            <div
                className="absolute -inset-3 z-[-1]"
                style={{
                    backgroundImage: `url('/scoreccl1.png')`,
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center'
                }}
            />

            {/* Content Container */}
            <div className={`flex flex-col gap-3 rounded-lg transition-all duration-300 ${isMinimized ? 'p-2' : 'p-3'}`}>

                {/* Header for Minimize */}
                <div className="text-amber-900 font-bold text-sm flex items-center justify-between border-b border-amber-900/20 pb-2">
                    <span>Level Status</span>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="text-amber-900/60 hover:text-amber-900 transition-colors ml-2"
                    >
                        {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                </div>

                {!isMinimized && (
                    <>
                        {/* Coin Display */}
                        {showCoins && (
                            <div className="bg-amber-950/80 rounded-md p-2 border border-amber-900/30">
                                <div className="text-amber-400 font-bold text-xs mb-1 flex items-center gap-1">
                                    <span>เหรียญ ({playerCoins.length})</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {playerCoins.slice(0, 5).map((coin, index) => (
                                        <div
                                            key={`coin-${coin.id}-${index}`}
                                            className="bg-amber-800 px-2 py-0.5 rounded text-xs text-amber-50 border border-amber-700 font-mono font-bold"
                                            title={`เหรียญที่ตำแหน่ง ${index + 1}: ${coin.value} points`}
                                        >
                                            {coin.value}
                                        </div>
                                    ))}
                                    {playerCoins.length > 5 && <span className="text-xs text-amber-400 self-center font-bold">+{playerCoins.length - 5}</span>}
                                </div>
                                <div className="text-[10px] text-amber-200/50 mt-1 text-right font-medium">
                                    รวม: {playerCoins.reduce((sum, coin) => sum + coin.value, 0)} points
                                </div>
                            </div>
                        )}

                        {/* People Rescue Display */}
                        {showPeople && (
                            <div className="bg-amber-950/80 rounded-md p-2 border border-amber-900/30">
                                <div className="text-amber-500 font-bold text-xs mb-1 flex items-center gap-1">
                                    <span>คน ({rescuedPeople.length}/{levelData?.people?.length || 0})</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1 text-xs">
                                    {levelData.people?.slice(0, 6).map((person, index) => {
                                        const isRescued = rescuedPeople.some(rescued => Number(rescued.nodeId) === Number(person.nodeId));
                                        return (
                                            <div
                                                key={`person-${person.id}`}
                                                className={`px-1 py-1 rounded border text-center transition-colors shadow-sm ${isRescued
                                                    ? 'bg-emerald-900/80 text-emerald-100 border-emerald-800 font-bold'
                                                    : 'bg-amber-900/40 text-amber-100/50 border-amber-800/50'
                                                    }`}
                                                title={`${person.personName} ที่ Node ${person.nodeId}`}
                                            >
                                                {isRescued ? 'ช่วยแล้ว' : 'ยังไม่ช่วย'}
                                                <span className="ml-1 text-[10px] opacity-100">{person.personName}</span>
                                            </div>
                                        );
                                    })}
                                    {levelData.people && levelData.people.length > 6 && (
                                        <div className="text-xs text-amber-400 text-center self-center underline decoration-dotted" title="More people...">
                                            +{levelData.people.length - 6}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Treasure Display */}
                        {(levelData?.treasures?.length > 0 || collectedTreasures.length > 0) && (
                            <div className="bg-amber-950/80 rounded-md p-2 border border-amber-900/30">
                                <div className="text-amber-400 font-bold text-xs mb-1 flex items-center gap-1">
                                    <span>สมบัติ ({collectedTreasures.length}/{levelData?.treasures?.length || 0})</span>
                                </div>
                                <div className="flex flex-col gap-1 text-xs">
                                    {levelData?.treasures?.map((treasure, index) => {
                                        const isCollected = collectedTreasures.some(t => t.nodeId === treasure.nodeId) || treasure.collected;
                                        return (
                                            <div
                                                key={`treasure-${index}`}
                                                className={`px-2 py-1 rounded flex justify-between items-center border shadow-sm ${isCollected
                                                    ? 'bg-amber-800 text-amber-50 border-amber-700'
                                                    : 'bg-amber-900/40 text-amber-100/50 border-amber-800/50'
                                                    }`}
                                            >
                                                <span className="font-medium">#{index + 1} Node {treasure.nodeId}</span>
                                                <span>{isCollected ? 'เก็บแล้ว' : 'ยังไม่เก็บ'}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CoinPeopleStateTable;
