import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Box, FlaskConical } from 'lucide-react';
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
        isPreview={isPreview}
      />

      <HistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        userProgress={userProgress}
        levels={allLevels}
        currentLevelId={currentLevel?.level_id || currentLevel?.id}
      />
    </div>
  );
};

export default BlocklyArea;