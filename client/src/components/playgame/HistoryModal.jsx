import React, { useEffect, useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../ui/dialog";
import { History } from 'lucide-react';
import HistorySidebar from './history/HistorySidebar';
import HistoryViewer from './history/HistoryViewer';

const HistoryModal = ({ isOpen, onClose, userProgress, levels, currentLevelId }) => {
    const [selectedLevelId, setSelectedLevelId] = useState(null);
    const [displayMode, setDisplayMode] = useState('blockly'); // 'blockly' or 'text'
    const blocklyRef = useRef(null);
    const workspaceRef = useRef(null);

    // Filter completed levels with code
    const completedLevels = React.useMemo(() => {
        if (!userProgress) return [];

        return userProgress
            .filter(p => {
                const hasCode = p.blockly_code != null || p.text_code != null;
                if (currentLevelId) {
                    return p.level_id == currentLevelId && hasCode;
                }
                return p.is_correct && hasCode;
            })
            .map(p => ({
                ...p,
                levelName: levels?.find(l => l.level_id === p.level_id)?.level_name || `Level ${p.level_id}`
            }))
            .sort((a, b) => b.level_id - a.level_id);
    }, [userProgress, currentLevelId, levels]);

    // Simplified selection logic
    useEffect(() => {
        if (isOpen && completedLevels.length > 0) {
            if (currentLevelId || !selectedLevelId) {
                setSelectedLevelId(completedLevels[0].level_id);
            }
        }
    }, [isOpen, currentLevelId, completedLevels, selectedLevelId]);

    const currentProgress = React.useMemo(() => {
        if (!selectedLevelId) return completedLevels[0] || null;
        return completedLevels.find(p => p.level_id === selectedLevelId) || completedLevels[0] || null;
    }, [completedLevels, selectedLevelId]);

    const handleLevelSelect = (levelId) => {
        setSelectedLevelId(levelId);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl h-[80vh] flex flex-col p-0 overflow-hidden bg-stone-900 border-gray-700 text-white">
                <DialogHeader className="px-6 py-4 border-b border-gray-700 bg-stone-950 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/20 rounded-lg">
                            <History className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-white uppercase tracking-tight">
                                {currentLevelId && completedLevels.length > 0
                                    ? `Code History: ${completedLevels[0].levelName}`
                                    : 'Code History'
                                }
                            </DialogTitle>
                            {currentLevelId && (
                                <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                                    แสดงประวัติเฉพาะด่านปัจจุบันเท่านั้น
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogDescription className="hidden">History of your completed levels and their code.</DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {!currentLevelId && (
                        <HistorySidebar
                            completedLevels={completedLevels}
                            selectedLevelId={selectedLevelId}
                            onLevelSelect={handleLevelSelect}
                        />
                    )}

                    <HistoryViewer
                        selectedLevelId={selectedLevelId}
                        currentLevelId={currentLevelId}
                        displayMode={displayMode}
                        onDisplayModeChange={setDisplayMode}
                        currentProgress={currentProgress}
                        blocklyRef={blocklyRef}
                        workspaceRef={workspaceRef}
                        isOpen={isOpen}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default HistoryModal;
