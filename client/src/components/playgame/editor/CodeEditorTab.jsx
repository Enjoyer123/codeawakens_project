import React, { useCallback, useRef, useEffect } from 'react';
import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';
import Editor from '@monaco-editor/react';
import { TabsContent } from "@/components/ui/tabs";
import { RefreshCw, RotateCcw } from 'lucide-react';
const CodeEditorTab = ({
    textCode,
    handleTextCodeChange,
    blocklyLoaded,
    codeValidation,
    isPreview = false,
    isAdmin = false,
    starterTextCode = ''
}) => {
    const editorRef = useRef(null);
    const isInternalChange = useRef(false); // Prevent echo loop

    // When textCode changes from OUTSIDE (e.g. starter XML load, reset),
    // sync it into Monaco without disrupting cursor during normal typing.
    useEffect(() => {
        if (editorRef.current && !isInternalChange.current) {
            const currentValue = editorRef.current.getValue();
            if (textCode !== currentValue) {
                editorRef.current.setValue(textCode || '');
            }
        }
        isInternalChange.current = false;
    }, [textCode]);

    // [Admin only] Generate clean code from current workspace blocks
    const handleGenerateFromBlocks = useCallback(() => {
        try {
            const workspace = Blockly.getMainWorkspace();
            if (!workspace) return;

            javascriptGenerator.declaredVariables = new Set();
            javascriptGenerator.isCleanMode = true;

            const floatingIds = workspace._floatingBlockIds || new Set();
            const nonFloatingTopBlocks = workspace.getTopBlocks(true)
                .filter(b => !floatingIds.has(b.id));

            let code = '';
            try {
                javascriptGenerator.init(workspace);
                for (const block of nonFloatingTopBlocks) {
                    code += javascriptGenerator.blockToCode(block) || '';
                }
                code = javascriptGenerator.finish(code);
            } finally {
                javascriptGenerator.isCleanMode = false;
            }

            if (code && code.trim()) {
                code = code.replace(/^var\s+[\w,\s]+;\n+/, '');
                if (editorRef.current) {
                    editorRef.current.setValue(code);
                }
                handleTextCodeChange(code);
            }
        } catch (err) {
            console.error('❌ Failed to generate clean code:', err);
        }
    }, [handleTextCodeChange]);

    // [User] Reset to starter text code
    const handleResetStarter = useCallback(() => {
        if (starterTextCode) {
            if (editorRef.current) {
                editorRef.current.setValue(starterTextCode);
            }
            handleTextCodeChange(starterTextCode);
        }
    }, [starterTextCode, handleTextCodeChange]);

    return (
        <TabsContent value="text" className="h-full m-0 p-0 absolute inset-0 z-10 data-[state=inactive]:hidden bg-[#0f111a]">
            <div className="flex flex-col h-full">
                {/* Validation Message Banner */}
                <div className={`px-4 py-2 text-[10px] font-pixel border-b flex items-center justify-between tracking-wide ${!blocklyLoaded
                    ? 'bg-[#1e1b4b]/80 text-yellow-500 border-purple-900/30'
                    : codeValidation?.isValid
                        ? 'bg-green-900/10 text-green-400 border-green-900/20'
                        : 'bg-red-900/10 text-red-400 border-red-900/20'
                    }`}>
                    <div className="flex items-center gap-2">
                        <span>{
                            !blocklyLoaded ? '⏳ SYNCING...' :
                                codeValidation?.isValid ? '✅ VALID' : '❌ INVALID'
                        }</span>
                        {codeValidation?.message && !codeValidation.isValid && blocklyLoaded && (
                            <span className="opacity-80 border-l border-purple-500/20 pl-2 ml-2">
                                {codeValidation.message}
                            </span>
                        )}
                    </div>
                    {/* Toolbar buttons */}
                    <div className="flex items-center gap-1">
                        {/* Admin only: Generate from current workspace */}
                        {(isPreview || isAdmin) && (
                            <button
                                onClick={handleGenerateFromBlocks}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-700/60 hover:bg-yellow-600 text-yellow-100 text-[10px] font-bold transition-colors"
                                title="[Admin] แปลง Blocks ปัจจุบันเป็นโค้ด"
                            >
                                <RefreshCw size={11} />
                                <span>Blocks → Code</span>
                            </button>
                        )}
                        {/* User: Reset to starter code */}
                        {starterTextCode && (
                            <button
                                onClick={handleResetStarter}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-700/60 hover:bg-purple-600 text-purple-100 text-[10px] font-bold transition-colors"
                                title="รีเซ็ตโค้ดกลับไปเป็นต้นฉบับ"
                            >
                                <RotateCcw size={11} />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 bg-[#0f111a]">
                    <Editor
                        height="100%"
                        defaultLanguage="javascript"
                        defaultValue={textCode || ''}
                        onChange={(value) => {
                            // Mark as internal so the useEffect doesn't echo it back
                            isInternalChange.current = true;
                            handleTextCodeChange(value || '');
                        }}
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
                            editorRef.current = editor;

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

