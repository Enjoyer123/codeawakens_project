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
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center bg-stone-900">
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
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-stone-900 overflow-hidden">
            <Tabs value={displayMode} onValueChange={onDisplayModeChange} className="flex-1 flex flex-col h-full">
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
                            <BlocklyHistoryView
                                blocklyRef={blocklyRef}
                                blocklyCode={currentProgress.blockly_code}
                                isOpen={isOpen}
                                displayMode={displayMode}
                                selectedLevelId={selectedLevelId}
                                workspaceRef={workspaceRef}
                            />
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
                            <div className="flex-1 flex items-center justify-center text-gray-500 italic bg-stone-900 border border-gray-800 rounded-xl">
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
