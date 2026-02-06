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
        <TabsContent value="text" className="h-full m-0 p-0 absolute inset-0 z-10 data-[state=inactive]:hidden bg-[#0f111a]">
            <div className="flex flex-col h-full">
                {/* Validation Message Banner */}
                <div className={`px-4 py-2 text-[10px] font-pixel border-b flex items-center justify-between tracking-wide ${!blocklyJavaScriptReady
                    ? 'bg-[#1e1b4b]/80 text-yellow-500 border-purple-900/30'
                    : codeValidation?.isValid
                        ? 'bg-green-900/10 text-green-400 border-green-900/20'
                        : 'bg-red-900/10 text-red-400 border-red-900/20'
                    }`}>
                    <div className="flex items-center gap-2">
                        <span>{
                            !blocklyJavaScriptReady ? '⏳ SYNCING...' :
                                codeValidation?.isValid ? '✅ VALID' : '❌ INVALID'
                        }</span>
                        {codeValidation?.message && !codeValidation.isValid && blocklyJavaScriptReady && (
                            <span className="opacity-80 border-l border-purple-500/20 pl-2 ml-2">
                                {codeValidation.message}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex-1 bg-[#0f111a]">
                    <Editor
                        height="100%"
                        defaultLanguage="javascript"
                        value={textCode}
                        onChange={(value) => handleTextCodeChange(value || '')}
                        theme="codeawakens-purple"
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
                            backgroundColor: '#0f111a',
                        }}
                        onMount={(editor, monaco) => {
                            // Define custom purple theme
                            monaco.editor.defineTheme('codeawakens-purple', {
                                base: 'vs-dark',
                                inherit: true,
                                rules: [],
                                colors: {
                                    'editor.background': '#0f111a',
                                    'editor.lineHighlightBackground': '#1e1b4b',
                                    'editorLineNumber.foreground': '#4f46e5',
                                    'editorLineNumber.activeForeground': '#a5b4fc',
                                },
                            });
                            monaco.editor.setTheme('codeawakens-purple');

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
            </div>
        </TabsContent>
    );
};

export default CodeEditorTab;
