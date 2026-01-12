import React from 'react';
import { ScrollArea } from "../../ui/scroll-area";

const HistorySidebar = ({ completedLevels, selectedLevelId, onLevelSelect }) => {
    return (
        <div className="w-64 border-r border-gray-700 bg-stone-950/50 flex flex-col">
            <div className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-800">
                Completed Levels
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {completedLevels.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm italic">
                            ยังไม่มีประวัติการผ่านด่าน
                        </div>
                    ) : (
                        completedLevels.map((p) => (
                            <button
                                key={p.level_id}
                                onClick={() => onLevelSelect(p.level_id)}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${selectedLevelId === p.level_id
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                                    }`}
                            >
                                <div className="font-bold text-sm truncate">{p.levelName}</div>
                                <div className="text-[10px] opacity-70 mt-1 flex items-center gap-1">
                                    <span>⭐ {p.stars_earned || 0} Stars</span>
                                    <span>•</span>
                                    <span>Score: {p.best_score + (p.pattern_bonus_score || 0)}</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};

export default HistorySidebar;
