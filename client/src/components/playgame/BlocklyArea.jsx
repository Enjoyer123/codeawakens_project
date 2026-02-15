import React, { useState, useCallback } from 'react';
import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Box, FlaskConical, X, Copy, Check } from 'lucide-react';
import BlocklyWorkspaceTab from './editor/BlocklyWorkspaceTab';
import CodeEditorTab from './editor/CodeEditorTab';
import TestResultsTab from './editor/TestResultsTab';
import GameControls from './editor/GameControls';
import HistoryModal from './HistoryModal';

const BlocklyArea = ({
  blocklyRef,
  blocklyLoaded,
  runCode,
  gameState,
  isRunning,
  isGameOver,
  currentLevel,
  codeValidation,
  blocklyJavaScriptReady,
  textCode,
  handleTextCodeChange,
  testCaseResult,
  userProgress,
  allLevels,
  onLoadXml,
  isPreview
}) => {
  const [activeTab, setActiveTab] = useState("blocks");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [debugCode, setDebugCode] = useState(null);
  const [copied, setCopied] = useState(false);

  // Auto-switch to test tab when results arrive
  React.useEffect(() => {
    if (testCaseResult) {
      setActiveTab("test");
    }
  }, [testCaseResult]);

  // Generate raw runtime code from current workspace (no cleanMode)
  const handleShowDebugCode = useCallback(() => {
    try {
      const workspace = Blockly.getMainWorkspace();
      if (!workspace) {
        setDebugCode('// ❌ No workspace found');
        return;
      }
      const code = javascriptGenerator.workspaceToCode(workspace);
      setDebugCode(code || '// (empty)');
    } catch (err) {
      setDebugCode(`// ❌ Error: ${err.message}`);
    }
    setCopied(false);
  }, []);

  const handleCopyDebugCode = useCallback(() => {
    if (debugCode) {
      navigator.clipboard.writeText(debugCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [debugCode]);

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Tabs Header */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="bg-[#1e1b4b] border-b border-purple-900/50 px-4 pt-2">
          <TabsList className="bg-[#2e1065] border border-purple-900/50">
            <TabsTrigger value="blocks" className="data-[state=active]:bg-[#4c1d95] text-purple-200 data-[state=active]:text-white flex items-center gap-2">
              <Box size={16} />
              <span>Visual Blocks</span>
            </TabsTrigger>

            {currentLevel?.textcode && (
              <TabsTrigger value="text" className="data-[state=active]:bg-[#4c1d95] text-purple-200 data-[state=active]:text-white flex items-center gap-2">
                <Code size={16} />
                <span>Text Code</span>
                <div className={`ml-2 w-2 h-2 rounded-full ${!blocklyJavaScriptReady
                  ? 'bg-yellow-500 animate-pulse'
                  : codeValidation?.isValid
                    ? 'bg-green-500'
                    : 'bg-red-500'
                  }`} />
              </TabsTrigger>
            )}

            <TabsTrigger value="test" className="data-[state=active]:bg-[#4c1d95] text-purple-200 data-[state=active]:text-white flex items-center gap-2 relative">
              <FlaskConical size={16} />
              <span>Test Results</span>
              {testCaseResult && (
                <span className={`flex h-2 w-2 rounded-full absolute top-1 right-1 ${testCaseResult.passed ? 'bg-green-500' : 'bg-red-500'}`} />
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Contents Container */}
        <div className="flex-1 relative bg-transparent overflow-hidden">
          <BlocklyWorkspaceTab
            blocklyRef={blocklyRef}
            activeTab={activeTab}
          />

          {currentLevel?.textcode && (
            <CodeEditorTab
              textCode={textCode}
              handleTextCodeChange={handleTextCodeChange}
              blocklyJavaScriptReady={blocklyJavaScriptReady}
              codeValidation={codeValidation}
            />
          )}

          <TestResultsTab testCaseResult={testCaseResult} />
        </div>
      </Tabs>

      {/* Control Buttons */}
      <GameControls
        runCode={runCode}
        gameState={gameState}
        blocklyLoaded={blocklyLoaded}
        isRunning={isRunning}
        isGameOver={isGameOver}
        blocklyJavaScriptReady={blocklyJavaScriptReady}
        codeValidation={codeValidation}
        currentLevel={currentLevel}
        onHistoryClick={() => setHistoryOpen(true)}
        onLoadXml={onLoadXml}
        onShowDebugCode={handleShowDebugCode}
        isPreview={isPreview}
      />

      <HistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        userProgress={userProgress}
        levels={allLevels}
        currentLevelId={currentLevel?.level_id || currentLevel?.id}
      />

      {/* Debug Code Modal */}
      {debugCode !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setDebugCode(null)}>
          <div className="bg-[#1e1b4b] border border-purple-700/50 rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-purple-900/50">
              <h3 className="text-purple-100 font-bold text-lg">🔍 Raw Generated Code (Runtime)</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyDebugCode}
                  className="bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition"
                >
                  {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                </button>
                <button
                  onClick={() => setDebugCode(null)}
                  className="text-purple-400 hover:text-white transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-sm text-green-300 font-mono whitespace-pre-wrap bg-[#0f0a2a] rounded-b-xl">
              {debugCode}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlocklyArea;