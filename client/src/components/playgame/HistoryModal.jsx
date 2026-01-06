import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import 'blockly/javascript';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Loader } from "../ui/loader";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { History, Code, Layout } from 'lucide-react';

const HistoryModal = ({ isOpen, onClose, userProgress, levels, currentLevelId }) => {
    const [selectedLevelId, setSelectedLevelId] = useState(null);
    const [displayMode, setDisplayMode] = useState('blockly'); // 'blockly' or 'text'
    const blocklyRef = useRef(null);
    const workspaceRef = useRef(null);

    // Filter completed levels with code
    const completedLevels = React.useMemo(() => {
        if (!userProgress) return [];

        const filtered = userProgress
            .filter(p => {
                // Check if code exists (allow empty string if it's not null/undefined)
                const hasCode = p.blockly_code != null || p.text_code != null;

                // If currentLevelId is provided, ONLY return that level's progress
                if (currentLevelId) {
                    const isMatch = p.level_id == currentLevelId;
                    return isMatch && hasCode;
                }

                // For global view (no currentLevelId): strict completion check
                const isCorrect = p.is_correct;
                return isCorrect && hasCode;
            })
            .map(p => {
                const levelInfo = levels?.find(l => l.level_id === p.level_id);
                return {
                    ...p,
                    levelName: levelInfo?.level_name || `Level ${p.level_id}`
                };
            })
            .sort((a, b) => {
                // Sort by level ID first
                if (b.level_id !== a.level_id) return b.level_id - a.level_id;
                // Then by score or date if needed
                return 0;
            });

        return filtered;
    }, [userProgress, currentLevelId, levels]);

    // Simplified selection logic
    useEffect(() => {
        if (isOpen && completedLevels.length > 0) {
            if (currentLevelId) {
                // In single level mode, always force the current level's progress
                setSelectedLevelId(completedLevels[0].level_id);
            } else if (!selectedLevelId) {
                // In multi level mode, select the first one if nothing is selected
                setSelectedLevelId(completedLevels[0].level_id);
            }
        }
    }, [isOpen, currentLevelId, completedLevels]);

    const currentProgress = React.useMemo(() => {
        if (!selectedLevelId) return completedLevels[0] || null;
        return completedLevels.find(p => p.level_id === selectedLevelId) || completedLevels[0] || null;
    }, [completedLevels, selectedLevelId]);

    // Handle Blockly injection with better robustness
    useEffect(() => {
        let currentWorkspace = null;
        let timer = null;

        const injectBlockly = () => {
            if (!isOpen || displayMode !== 'blockly' || !currentProgress?.blockly_code || !blocklyRef.current) {
                return;
            }

            try {
                // Dispose existing workspace if any
                if (workspaceRef.current) {
                    workspaceRef.current.dispose();
                }

                // Inset Blockly
                currentWorkspace = Blockly.inject(blocklyRef.current, {
                    readOnly: true,
                    scrollbars: true,
                    move: {
                        scrollbars: true,
                        drag: true,
                        wheel: true
                    },
                    zoom: {
                        controls: true,
                        wheel: true,
                        startScale: 0.8,
                        maxScale: 3,
                        minScale: 0.3,
                        scaleSpeed: 1.2
                    },
                    theme: 'dark'
                });

                workspaceRef.current = currentWorkspace;

                // Load blocks
                const xmlText = currentProgress.blockly_code;
                if (xmlText && xmlText.trim()) {
                    const xml = Blockly.utils.xml.textToDom(xmlText);
                    Blockly.Xml.domToWorkspace(xml, currentWorkspace);
                }

                // Force resize to ensure visibility
                Blockly.svgResize(currentWorkspace);

                // One more resize after a short delay just in case container was still animating
                setTimeout(() => {
                    if (currentWorkspace) Blockly.svgResize(currentWorkspace);
                }, 100);

            } catch (e) {
                console.error("Failed to load blocks into history workspace:", e);
            }
        };

        if (isOpen && displayMode === 'blockly') {
            // Small initial delay to ensure DOM is ready and TabsContent is rendered
            timer = setTimeout(injectBlockly, 100);
        }

        return () => {
            if (timer) clearTimeout(timer);
            if (currentWorkspace) {
                currentWorkspace.dispose();
                workspaceRef.current = null;
            }
        };
    }, [isOpen, displayMode, currentProgress?.blockly_code, selectedLevelId]);

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
                    {/* Sidebar: Level List - Hide if single level history */}
                    {!currentLevelId && (
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
                                                onClick={() => handleLevelSelect(p.level_id)}
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
                    )}

                    {/* Main Content: Viewer */}
                    <div className="flex-1 flex flex-col bg-stone-900 overflow-hidden">
                        {!selectedLevelId ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                                {currentLevelId ? (
                                    <>
                                        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                                            <Code className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="text-lg font-bold mb-1">ยังไม่มีประวัติในด่านนี้</p>
                                        <p className="text-sm opacity-60">คุณต้องผ่านด่านนี้ให้สำเร็จก่อนจึงจะมีประวัติบันทึกไว้</p>
                                    </>
                                ) : (
                                    "เลือกด่านเพื่อดูข้อมูล"
                                )}
                            </div>
                        ) : (
                            <Tabs value={displayMode} onValueChange={setDisplayMode} className="flex-1 flex flex-col h-full">
                                <div className="h-14 border-b border-gray-700 flex items-center justify-between px-6 bg-stone-950/30 flex-shrink-0">
                                    <div className="flex items-center gap-4">
                                        <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700 h-9">
                                            <TabsTrigger value="blockly" className="flex items-center gap-2 px-6 py-2 data-[state=active]:bg-blue-600 transition-all rounded-md">
                                                <Layout className="w-4 h-4" /> Blockly
                                            </TabsTrigger>
                                            <TabsTrigger value="text" className="flex items-center gap-2 px-6 py-2 data-[state=active]:bg-blue-600 transition-all rounded-md">
                                                <Code className="w-4 h-4" /> Text Code
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>
                                    <div className="text-xs text-blue-400 font-mono italic">
                                        * Read-only mode
                                    </div>
                                </div>

                                <div className="flex-1 relative overflow-hidden bg-stone-950/20">
                                    <TabsContent value="blockly" className="absolute inset-0 m-0 w-full h-full data-[state=active]:flex flex-col">
                                        {currentProgress?.blockly_code ? (
                                            <div ref={blocklyRef} className="flex-1 w-full h-full" />
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center text-gray-500 bg-stone-900">
                                                ไม่มีข้อมูล Blockly ในด่านนี้
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="text" className="absolute inset-0 m-0 w-full h-full data-[state=active]:flex flex-col overflow-auto p-6">
                                        {currentProgress?.text_code ? (
                                            <div className="flex-1 min-h-0 bg-black/40 rounded-xl border border-gray-700 p-6 overflow-auto custom-scrollbar">
                                                <pre className="font-mono text-sm text-blue-300 whitespace-pre-wrap leading-relaxed">
                                                    {currentProgress.text_code}
                                                </pre>
                                            </div>
                                        ) : currentProgress?.blockly_code ? (
                                            <div className="flex-1 min-h-0 bg-black/40 rounded-xl border border-gray-700 p-6 flex flex-col">
                                                <div className="text-xs text-gray-500 mb-4 px-2 py-1 bg-gray-800/50 rounded inline-block w-fit">
                                                    Generated from Blockly
                                                </div>
                                                <div className="flex-1 overflow-auto custom-scrollbar">
                                                    <pre className="font-mono text-sm text-green-300 whitespace-pre-wrap leading-relaxed opacity-80">
                                                        {/* Attempt to generate JS from XML for display if needed */}
                                                        {(() => {
                                                            try {
                                                                const headless = new Blockly.Workspace();
                                                                const xml = Blockly.utils.xml.textToDom(currentProgress.blockly_code);
                                                                Blockly.Xml.domToWorkspace(xml, headless);
                                                                const code = Blockly.JavaScript.workspaceToCode(headless);
                                                                headless.dispose();
                                                                return code || "// (No code generated)";
                                                            } catch (e) {
                                                                return "// (Failed to generate code from blocks)";
                                                            }
                                                        })()}
                                                    </pre>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center text-gray-500 italic bg-stone-900 border border-gray-800 rounded-xl">
                                                ไม่มีข้อมูล Text Code ในด่านนี้
                                            </div>
                                        )}
                                    </TabsContent>
                                </div>
                            </Tabs>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default HistoryModal;
