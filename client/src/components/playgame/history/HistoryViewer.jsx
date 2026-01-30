import React from 'react';
import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Code, Layout } from 'lucide-react';
import BlocklyHistoryView from './BlocklyHistoryView';

const HistoryViewer = ({
    selectedLevelId,
    currentLevelId,
    displayMode,
    onDisplayModeChange,
    currentProgress,
    blocklyRef,
    workspaceRef,
    isOpen
}) => {
    if (!selectedLevelId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-[#2d1b0e]/50 p-8 text-center bg-[#d4b896]/20">
                {currentLevelId ? (
                    <>
                        <div className="w-16 h-16 bg-[#8b6f47]/10 rounded-full flex items-center justify-center mb-4">
                            <Code className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-lg font-bold mb-1 text-[#2d1b0e]">ยังไม่มีประวัติในด่านนี้</p>
                        <p className="text-sm opacity-60">คุณต้องผ่านด่านนี้ให้สำเร็จก่อนจึงจะมีประวัติบันทึกไว้</p>
                    </>
                ) : (
                    "เลือกด่านเพื่อดูข้อมูล"
                )}
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-transparent overflow-hidden">
            <Tabs value={displayMode} onValueChange={onDisplayModeChange} className="flex-1 flex flex-col h-full">
                <div className="h-14 border-b border-[#8b6f47]/30 flex items-center justify-between px-6 bg-[#d4b896]/20 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <TabsList className="grid grid-cols-2 bg-[#8b6f47]/20 border-[#8b6f47]/40 h-full w-full">
                            <TabsTrigger value="blockly" className="flex items-center justify-center gap-1.5 px-3 py-1.5 data-[state=active]:bg-[#8b6f47] data-[state=active]:text-white transition-all rounded-md text-[#2d1b0e] text-sm">
                                <Layout className="w-3.5 h-3.5" /> Blockly
                            </TabsTrigger>
                            <TabsTrigger value="text" className="flex items-center justify-center gap-1.5 px-3 py-1.5 data-[state=active]:bg-[#8b6f47] data-[state=active]:text-white transition-all rounded-md text-[#2d1b0e] text-sm">
                                <Code className="w-3.5 h-3.5" /> Text Code
                            </TabsTrigger>
                        </TabsList>
                    </div>

                </div>

                <div className="flex-1 relative overflow-hidden bg-[#d4b896]/10">
                    <TabsContent value="blockly" className="absolute inset-0 m-0 w-full h-full data-[state=active]:flex flex-col">
                        {currentProgress?.blockly_code ? (
                            <BlocklyHistoryView
                                blocklyRef={blocklyRef}
                                blocklyCode={currentProgress.blockly_code}
                                isOpen={isOpen}
                                displayMode={displayMode}
                                selectedLevelId={selectedLevelId}
                                workspaceRef={workspaceRef}
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-[#2d1b0e]/50 bg-[#d4b896]/20">
                                ไม่มีข้อมูล Blockly ในด่านนี้
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="text" className="absolute inset-0 m-0 w-full h-full data-[state=active]:flex flex-col overflow-auto p-6">
                        {currentProgress?.text_code ? (
                            <div className="flex-1 min-h-0 bg-[#2d1b0e]/10 rounded-xl border border-[#8b6f47]/30 p-6 overflow-auto">
                                <pre className="font-mono text-sm text-[#2d1b0e] whitespace-pre-wrap leading-relaxed">
                                    {currentProgress.text_code}
                                </pre>
                            </div>
                        ) : currentProgress?.blockly_code ? (
                            <div className="flex-1 min-h-0 bg-[#2d1b0e]/10 rounded-xl border border-[#8b6f47]/30 p-6 flex flex-col">
                                <div className="flex-1 overflow-auto">
                                    <pre className="font-mono text-sm text-black whitespace-pre-wrap leading-relaxed">
                                        {(() => {
                                            try {

                                                const headless = new Blockly.Workspace();
                                                const xml = Blockly.utils.xml.textToDom(currentProgress.blockly_code);
                                                Blockly.Xml.domToWorkspace(xml, headless);
                                                const code = javascriptGenerator.workspaceToCode(headless);
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
                            <div className="flex-1 flex items-center justify-center text-[#2d1b0e]/50 italic bg-[#d4b896]/20 border border-[#8b6f47]/20 rounded-xl">
                                ไม่มีข้อมูล Text Code ในด่านนี้
                            </div>
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
};

export default HistoryViewer;
