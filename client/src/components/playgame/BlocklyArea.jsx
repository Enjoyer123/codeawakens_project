import React from 'react';
import Editor from '@monaco-editor/react';

const BlocklyArea = ({
  blocklyRef,
  blocklyLoaded,
  runCode,
  gameState,
  isRunning,
  isGameOver,
  onDebugToggle,
  debugMode,
  currentLevel,
  codeValidation,
  blocklyJavaScriptReady,
  textCode,
  handleTextCodeChange
}) => {
  return (
    <div className="flex flex-col h-full">

      {/* Blockly Workspace - ปรับขนาดตาม textcode */}
      <div
        ref={blocklyRef}
        className="bg-white shadow-inner blockly-workspace"
        style={{
          // ลดความสูงของ workspace เล็กน้อยเมื่อต้องแสดง textcode ในส่วนปุ่มด้านล่าง
          height: currentLevel?.textcode
            ? "calc(100vh - 400px)"  // เพิ่มพื้นที่สำหรับ textcode
            : "calc(100vh - 180px)",
          width: "100%",
          border: "2px dashed rgba(255,255,255,0.08)"
        }}
      />

      {/* Control Buttons - Compact and prominent */}
      <div className="flex flex-col bg-stone-900 border-t border-gray-700 shadow-xl z-10">
        <div className="p-4 space-y-4">
          
          {/* Text Code Editor Section */}
          {currentLevel?.textcode && (
            <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  <div>
                    <h3 className="text-sm font-bold text-blue-100 leading-tight">Text Code</h3>
                    <p className="text-[10px] text-gray-400">Write JavaScript that matches your blocks</p>
                  </div>
                </div>
                {/* Validation Status Badge */}
                <div className={`px-2 py-1 rounded text-xs font-bold border ${
                  !blocklyJavaScriptReady 
                    ? 'bg-yellow-900/30 border-yellow-600/50 text-yellow-500' 
                    : codeValidation?.isValid 
                      ? 'bg-green-900/30 border-green-600/50 text-green-400' 
                      : 'bg-red-900/30 border-red-600/50 text-red-400'
                }`}>
                  {!blocklyJavaScriptReady ? '⏳ Loading...' : codeValidation?.isValid ? '✅ Valid' : '❌ Invalid'}
                </div>
              </div>

              <div className="border border-gray-700 rounded-md overflow-hidden shadow-sm bg-[#1e1e1e]">
                <Editor
                  height="160px"
                  defaultLanguage="javascript"
                  value={textCode}
                  onChange={(value) => handleTextCodeChange(value || '')}
                  theme="vs-dark"
                  onMount={(editor, monaco) => {
                    // เพิ่ม custom functions สำหรับเกม
                    monaco.languages.typescript.javascriptDefaults.addExtraLib(`
                        // Game Functions
                        declare function moveForward(): Promise<void>;
                        declare function turnLeft(): Promise<void>;
                        declare function turnRight(): Promise<void>;
                        declare function hit(): Promise<void>;
                        declare function collectCoin(): Promise<void>;
                        declare function rescuePerson(): Promise<void>;
                        declare function pushNode(): Promise<void>;
                        declare function popNode(): Promise<void>;
                        
                        // Condition Functions
                        declare function foundMonster(): boolean;
                        declare function canMoveForward(): boolean;
                        declare function nearPit(): boolean;
                        declare function atGoal(): boolean;
                        declare function hasPerson(): boolean;
                        declare function hasTreasure(): boolean;
                        declare function hasCoin(): boolean;
                        
                        // Loop Functions
                        declare function forEachCoin(callback: () => Promise<void>): Promise<void>;
                        
                        // Variables
                        declare var coins: number;
                        declare var hp: number;
                        declare var score: number;
                      `, 'file:///game-functions.d.ts');

                    // เพิ่ม auto-completion แบบ dynamic
                    monaco.languages.registerCompletionItemProvider('javascript', {
                      provideCompletionItems: (model, position) => {
                        const word = model.getWordUntilPosition(position);
                        const range = {
                          startLineNumber: position.lineNumber,
                          endLineNumber: position.lineNumber,
                          startColumn: word.startColumn,
                          endColumn: word.endColumn,
                        };

                        const gameFunctions = [
                          { label: 'moveForward', kind: monaco.languages.CompletionItemKind.Function, insertText: 'moveForward()', detail: 'เดินไปข้างหน้า', documentation: 'เดินไปข้างหน้าหนึ่งก้าว', range },
                          { label: 'turnLeft', kind: monaco.languages.CompletionItemKind.Function, insertText: 'turnLeft()', detail: 'เลี้ยวซ้าย', documentation: 'หมุนตัวไปทางซ้าย 90 องศา', range },
                          { label: 'turnRight', kind: monaco.languages.CompletionItemKind.Function, insertText: 'turnRight()', detail: 'เลี้ยวขวา', documentation: 'หมุนตัวไปทางขวา 90 องศา', range },
                          { label: 'hit', kind: monaco.languages.CompletionItemKind.Function, insertText: 'hit()', detail: 'โจมตีศัตรู', documentation: 'โจมตีศัตรูที่อยู่ข้างหน้า', range },
                          { label: 'collectCoin', kind: monaco.languages.CompletionItemKind.Function, insertText: 'collectCoin()', detail: 'เก็บเหรียญ', documentation: 'เก็บเหรียญที่อยู่ตำแหน่งปัจจุบัน', range },
                          { label: 'rescuePerson', kind: monaco.languages.CompletionItemKind.Function, insertText: 'rescuePerson()', detail: 'ช่วยคน', documentation: 'ช่วยคนที่ติดอยู่', range },
                          { label: 'pushNode', kind: monaco.languages.CompletionItemKind.Function, insertText: 'pushNode()', detail: 'เพิ่มตำแหน่งใน stack', documentation: 'เพิ่มตำแหน่งปัจจุบันใน stack', range },
                          { label: 'popNode', kind: monaco.languages.CompletionItemKind.Function, insertText: 'popNode()', detail: 'ลบตำแหน่งจาก stack', documentation: 'ลบตำแหน่งล่าสุดจาก stack', range },
                          { label: 'foundMonster', kind: monaco.languages.CompletionItemKind.Function, insertText: 'foundMonster()', detail: 'ตรวจสอบว่ามีศัตรู', documentation: 'คืนค่า true ถ้ามีศัตรูอยู่ข้างหน้า', range },
                          { label: 'canMoveForward', kind: monaco.languages.CompletionItemKind.Function, insertText: 'canMoveForward()', detail: 'ตรวจสอบว่าสามารถเดินได้', documentation: 'คืนค่า true ถ้าสามารถเดินไปข้างหน้าได้', range },
                          { label: 'nearPit', kind: monaco.languages.CompletionItemKind.Function, insertText: 'nearPit()', detail: 'ตรวจสอบว่าอยู่ใกล้หลุม', documentation: 'คืนค่า true ถ้าอยู่ใกล้หลุม', range },
                          { label: 'atGoal', kind: monaco.languages.CompletionItemKind.Function, insertText: 'atGoal()', detail: 'ตรวจสอบว่าถึงเป้าหมาย', documentation: 'คืนค่า true ถ้าถึงเป้าหมายแล้ว', range },
                          { label: 'hasPerson', kind: monaco.languages.CompletionItemKind.Function, insertText: 'hasPerson()', detail: 'ตรวจสอบว่ามีคน', documentation: 'คืนค่า true ถ้ามีคนที่ต้องการช่วย', range },
                          { label: 'hasTreasure', kind: monaco.languages.CompletionItemKind.Function, insertText: 'hasTreasure()', detail: 'ตรวจสอบว่ามีสมบัติ', documentation: 'คืนค่า true ถ้ามีสมบัติในตำแหน่งปัจจุบัน', range },
                          { label: 'hasCoin', kind: monaco.languages.CompletionItemKind.Function, insertText: 'hasCoin()', detail: 'ตรวจสอบว่ามีเหรียญ', documentation: 'คืนค่า true ถ้ามีเหรียญในตำแหน่งปัจจุบัน', range },
                          { label: 'forEachCoin', kind: monaco.languages.CompletionItemKind.Function, insertText: 'forEachCoin(async () => {\n  \n})', detail: 'วนลูปเหรียญทั้งหมด', documentation: 'วนลูปเหรียญทั้งหมดในด่าน', range }
                        ];

                        const currentWord = word.word.toLowerCase();
                        const filteredFunctions = gameFunctions.filter(func => func.label.toLowerCase().startsWith(currentWord));

                        return { suggestions: filteredFunctions, incomplete: false };
                      },
                      triggerCharacters: ['.', '(']
                    });
                  }}
                  options={{
                    fontSize: 12,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    renderLineHighlight: 'all',
                    cursorStyle: 'line',
                    fontFamily: '"Fira Code", monospace',
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    padding: { top: 8, bottom: 8 },
                  }}
                />
              </div>

              {/* Validation Message Detail */}
              {codeValidation?.message && !codeValidation.isValid && blocklyJavaScriptReady && (
                 <div className="flex items-start gap-2 text-xs text-red-300 bg-red-900/20 p-2 rounded border border-red-900/50">
                    <span>⚠️</span>
                    <span>{codeValidation.message}</span>
                 </div>
              )}
            </div>
          )}

          {/* Action Buttons Group */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            <button
              onClick={() => {
                runCode();
              }}
              disabled={
                gameState === "running" ||
                !blocklyLoaded ||
                isRunning ||
                isGameOver ||
                (currentLevel?.textcode && !blocklyJavaScriptReady) ||
                (currentLevel?.textcode && (!codeValidation || !codeValidation.isValid))
              }
              className="col-span-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white py-2 rounded-lg font-bold shadow-lg transform transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {gameState === "running" ? (
                <>
                  <span className="animate-spin">🌀</span> Running...
                </>
              ) : (
                <>
                  <span>▶️</span> RUN CODE
                </>
              )}
            </button>

            <button
              onClick={() => window.location.reload()}
              className="bg-stone-700 hover:bg-stone-600 text-stone-200 py-2 rounded-lg font-semibold shadow transition active:scale-95 flex items-center justify-center gap-1"
            >
              🔄 Reset
            </button>
            
            <button
              onClick={onDebugToggle}
              className={`py-2 rounded-lg font-semibold shadow transition active:scale-95 flex items-center justify-center gap-1 ${
                debugMode
                ? "bg-yellow-600 text-white ring-2 ring-yellow-400/50"
                : "bg-stone-700 hover:bg-stone-600 text-stone-300"
              }`}
            >
              🐞 Debug
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlocklyArea;