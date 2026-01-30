import React, { useEffect, useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
} from "../ui/dialog";
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
            <DialogContent className="w-full max-w-6xl h-[80vh] p-0 bg-transparent border-none shadow-none overflow-hidden">
                <div
                    className="w-full h-full relative flex flex-col"
                    style={{
                        backgroundImage: "url('/guide.png')",
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                        imageRendering: 'pixelated'
                    }}
                >
                    {/* Header Section */}
                    <div className="h-[12%] w-full flex items-center justify-between px-8 pt-1">
                        <h2 className="text-[#0f172a] font-bold text-xl sm:text-2xl tracking-widest font-pixel uppercase"
                            style={{ fontFamily: '"Press Start 2P", monospace' }}>
                            {currentLevelId && completedLevels.length > 0
                                ? `History: ${completedLevels[0].levelName}`
                                : 'Code History'
                            }
                        </h2>
                        <DialogDescription className="hidden">History of your completed levels and their code.</DialogDescription>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex overflow-hidden px-10 pb-8">
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
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default HistoryModal;
