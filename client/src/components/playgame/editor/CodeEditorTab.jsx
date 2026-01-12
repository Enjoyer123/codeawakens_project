import React from 'react';
import Editor from '@monaco-editor/react';
import { TabsContent } from "@/components/ui/tabs";

const CodeEditorTab = ({
    textCode,
    handleTextCodeChange,
    blocklyJavaScriptReady,
    codeValidation
}) => {
    return (
        <TabsContent value="text" className="h-full m-0 p-0 absolute inset-0 z-10 data-[state=inactive]:hidden">
            <div className="flex flex-col h-full">
                {/* Validation Message Banner */}
                <div className={`px-4 py-2 text-xs font-mono border-b flex items-center justify-between ${!blocklyJavaScriptReady
                    ? 'bg-stone-800 text-yellow-400 border-yellow-900/30'
                    : codeValidation?.isValid
                        ? 'bg-stone-800 text-green-400 border-green-900/30'
                        : 'bg-stone-800 text-red-400 border-red-900/30'
                    }`}>
                    <div className="flex items-center gap-2">
                        <span>{
                            !blocklyJavaScriptReady ? '⏳ Syncing...' :
                                codeValidation?.isValid ? '✅ Code Valid' : '❌ Code Invalid'
                        }</span>
                        {codeValidation?.message && !codeValidation.isValid && blocklyJavaScriptReady && (
                            <span className="opacity-80 border-l border-white/20 pl-2 ml-2">
                                {codeValidation.message}
                            </span>
                        )}
                    </div>
                </div>

                <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    value={textCode}
                    onChange={(value) => handleTextCodeChange(value || '')}
                    theme="vs-dark"
                    options={{
                        fontSize: 14,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        wordWrap: 'on',
                        lineNumbers: 'on',
                        renderLineHighlight: 'all',
                        fontFamily: '"Fira Code", monospace',
                        padding: { top: 16, bottom: 16 },
                    }}
                    onMount={(editor, monaco) => {
                        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                            noSemanticValidation: true,
                            noSyntaxValidation: false,
                        });

                        monaco.languages.typescript.javascriptDefaults.addExtraLib(`
                          declare function moveForward(): Promise<void>;
                          declare function turnLeft(): Promise<void>;
                          declare function turnRight(): Promise<void>;
                          declare function hit(): Promise<void>;
                          declare function collectCoin(): Promise<void>;
                          declare function rescuePerson(): Promise<void>;
                          declare function pushNode(): Promise<void>;
                          declare function popNode(): Promise<void>;
                          declare function foundMonster(): boolean;
                          declare function canMoveForward(): boolean;
                          declare function nearPit(): boolean;
                          declare function atGoal(): boolean;
                          declare function hasPerson(): boolean;
                          declare function hasTreasure(): boolean;
                          declare function hasCoin(): boolean;
                          declare function forEachCoin(callback: () => Promise<void>): Promise<void>;
                          declare var coins: number;
                          declare var hp: number;
                          declare var score: number;
                        `, 'filename/game.d.ts');
                    }}
                />
            </div>
        </TabsContent>
    );
};

export default CodeEditorTab;
