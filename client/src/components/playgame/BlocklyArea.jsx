import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Box, FlaskConical, CheckCircle2, XCircle } from 'lucide-react';

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
  handleTextCodeChange,
  testCaseResult
}) => {
  const [activeTab, setActiveTab] = useState("blocks");

  // Auto-switch to test tab when results arrive
  React.useEffect(() => {
    if (testCaseResult) {
      setActiveTab("test");
    }
  }, [testCaseResult]);

  return (
    <div className="flex flex-col h-full bg-transparent">
   
      
      {/* Tabs Header */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="bg-stone-900 border-b border-gray-700 px-4 pt-2">
          <TabsList className="bg-stone-800 border border-stone-700">
            <TabsTrigger value="blocks" className="data-[state=active]:bg-stone-700 text-stone-300 data-[state=active]:text-white flex items-center gap-2">
              <Box size={16} />
              <span>Visual Blocks</span>
            </TabsTrigger>
            {currentLevel?.textcode && (
              <TabsTrigger value="text" className="data-[state=active]:bg-stone-700 text-stone-300 data-[state=active]:text-white flex items-center gap-2">
                 <Code size={16} />
                 <span>Text Code</span>
                 <div className={`ml-2 w-2 h-2 rounded-full ${
                    !blocklyJavaScriptReady 
                      ? 'bg-yellow-500 animate-pulse' 
                      : codeValidation?.isValid 
                        ? 'bg-green-500' 
                        : 'bg-red-500'
                 }`} />
              </TabsTrigger>
            )}
            {/* Test Results Tab Trigger */}
            <TabsTrigger value="test" className="data-[state=active]:bg-stone-700 text-stone-300 data-[state=active]:text-white flex items-center gap-2 relative">
               <FlaskConical size={16} />
               <span>Test Results</span>
               {testCaseResult && (
                 <span className={`flex h-2 w-2 rounded-full absolute top-1 right-1 ${testCaseResult.passed ? 'bg-green-500' : 'bg-red-500'}`} />
               )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Contents Container - grows to fill space */}
        <div className="flex-1 relative bg-transparent overflow-hidden">
          
          {/* Visual Blocks Tab - Always mounted/rendered but toggled visibility to preserve state */}
          <div 
             className="absolute inset-0 blockly-workspace"
             style={{ 
               visibility: activeTab === 'blocks' ? 'visible' : 'hidden',
               zIndex: activeTab === 'blocks' ? 1 : -1
             }}
          >
             <div
                ref={blocklyRef}
                className="w-full h-full"
                style={{
                  border: "none"
                }}
              />
          </div>

          {/* Text Code Tab */}
          {currentLevel?.textcode && (
             <TabsContent value="text" className="h-full m-0 p-0 absolute inset-0 z-10 data-[state=inactive]:hidden">
                <div className="flex flex-col h-full">
                  {/* Validation Message Banner */}
                  <div className={`px-4 py-2 text-xs font-mono border-b flex items-center justify-between ${
                     !blocklyJavaScriptReady 
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
                      // Custom functions definitions
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
          )}
          {/* Test Results Tab Content */}
          <TabsContent value="test" className="h-full m-0 p-0 absolute inset-0 z-10 data-[state=inactive]:hidden bg-stone-900 overflow-y-auto">
             {!testCaseResult ? (
               <div className="flex flex-col items-center justify-center h-full text-stone-500 gap-4">
                 <FlaskConical size={48} className="opacity-20" />
                 <p>Run code to see test results</p>
               </div>
             ) : (
               <div className="p-4 space-y-6 max-w-3xl mx-auto">
                 {/* Summary Header */}
                 <div className={`p-4 rounded-lg border ${testCaseResult.passed ? 'bg-green-900/20 border-green-900/50' : 'bg-red-900/20 border-red-900/50'} flex items-center gap-4`}>
                    <div className={`p-3 rounded-full ${testCaseResult.passed ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {testCaseResult.passed ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${testCaseResult.passed ? 'text-green-400' : 'text-red-400'}`}>
                        {testCaseResult.passed ? 'All Tests Passed' : 'Test Failed'}
                      </h3>
                      <p className="text-stone-400 text-sm">
                        {testCaseResult.message}
                      </p>
                    </div>
                 </div>

                 {/* Failed Tests */}
                 {testCaseResult.failedTests && testCaseResult.failedTests.length > 0 && (
                   <div className="space-y-3">
                     <h4 className="text-red-400 font-semibold flex items-center gap-2">
                       <XCircle size={16} />
                       Failed Test Cases ({testCaseResult.failedTests.length})
                     </h4>
                     {testCaseResult.failedTests.map((test, index) => (
                       <div key={index} className="bg-stone-800 rounded-lg p-4 border border-red-900/30 space-y-3">
                         <div className="flex items-center justify-between border-b border-stone-700 pb-2">
                           <span className="font-mono text-sm text-red-300">{test.test_case_name}</span>
                           {test.is_primary && <span className="text-[10px] bg-red-900/40 text-red-300 px-2 py-0.5 rounded border border-red-800/50">PRIMARY</span>}
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-1">
                             <label className="text-[10px] uppercase text-stone-500 font-bold tracking-wider">Example Input</label>
                             <div className="bg-stone-900 p-2 rounded text-xs font-mono text-stone-300 overflow-x-auto">
                               {/* Input details not currently returned by checkTestCases in failedTests object, improving this would require updating testCaseUtils.js */}
                               See Logic Details
                             </div>
                           </div>
                           <div className="space-y-1">
                             <label className="text-[10px] uppercase text-stone-500 font-bold tracking-wider">Expected Output</label>
                             <div className="bg-stone-900 p-2 rounded text-xs font-mono text-green-300/80 overflow-x-auto">
                               {JSON.stringify(test.expected, null, 2)}
                             </div>
                           </div>
                         </div>
                         
                         <div className="space-y-1">
                           <label className="text-[10px] uppercase text-stone-500 font-bold tracking-wider">Actual Output</label>
                           <div className="bg-red-950/30 p-2 rounded text-xs font-mono text-red-300 border border-red-900/30 overflow-x-auto">
                             {test.actual === undefined ? 'undefined' : JSON.stringify(test.actual, null, 2)}
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}

                 {/* Passed Tests */}
                 {testCaseResult.passedTests && testCaseResult.passedTests.length > 0 && (
                   <div className="space-y-3">
                     <h4 className="text-green-400 font-semibold flex items-center gap-2">
                       <CheckCircle2 size={16} />
                       Passed Test Cases ({testCaseResult.passedTests.length})
                     </h4>
                     {testCaseResult.passedTests.map((test, index) => (
                       <div key={index} className="bg-stone-800/50 rounded-lg p-4 border border-green-900/10 space-y-3">
                         <div className="flex items-center justify-between border-b border-stone-700/50 pb-2">
                           <span className="font-mono text-sm text-stone-300">{test.test_case_name}</span>
                           <span className="text-green-500 text-[10px] font-bold px-2 py-0.5 bg-green-900/20 rounded border border-green-900/30">PASSED</span>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-1">
                             <label className="text-[10px] uppercase text-stone-500 font-bold tracking-wider">Example Input</label>
                             <div className="bg-stone-900 p-2 rounded text-xs font-mono text-stone-300 overflow-x-auto">
                               {/* Input details not currently returned by checkTestCases in passedTests object */}
                               See Logic Details
                             </div>
                           </div>
                           <div className="space-y-1">
                             <label className="text-[10px] uppercase text-stone-500 font-bold tracking-wider">Expected Output</label>
                             <div className="bg-stone-900 p-2 rounded text-xs font-mono text-green-300/80 overflow-x-auto">
                               {JSON.stringify(test.expected, null, 2)}
                             </div>
                           </div>
                         </div>
                         
                         <div className="space-y-1">
                           <label className="text-[10px] uppercase text-stone-500 font-bold tracking-wider">Actual Output</label>
                           <div className="bg-green-950/20 p-2 rounded text-xs font-mono text-green-300 border border-green-900/20 overflow-x-auto">
                             {test.actual === undefined ? 'undefined' : JSON.stringify(test.actual, null, 2)}
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Control Buttons - Fixed at bottom */}
      <div className="flex-none bg-stone-900 border-t border-gray-700 shadow-xl z-20 p-4">
        <div className="grid grid-cols-4 gap-2">
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
   
  );
};

export default BlocklyArea;