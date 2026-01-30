import React from 'react';
import { ScrollArea } from "../../ui/scroll-area";

const HistorySidebar = ({ completedLevels, selectedLevelId, onLevelSelect }) => {
    return (
        <div className="w-64 border-r border-[#8b6f47]/30 bg-[#d4b896]/20 flex flex-col">
            <div className="p-4 text-xs font-bold text-[#2d1b0e]/70 uppercase tracking-wider border-b border-[#8b6f47]/20">
                Completed Levels
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {completedLevels.length === 0 ? (
                        <div className="p-4 text-center text-[#2d1b0e]/50 text-sm italic">
                            ยังไม่มีประวัติการผ่านด่าน
                        </div>
                    ) : (
                        completedLevels.map((p) => (
                            <button
                                key={p.level_id}
                                onClick={() => onLevelSelect(p.level_id)}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${selectedLevelId === p.level_id
                                    ? 'bg-[#8b6f47] text-white shadow-lg'
                                    : 'text-[#2d1b0e]/80 hover:bg-[#8b6f47]/20 hover:text-[#2d1b0e]'
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
