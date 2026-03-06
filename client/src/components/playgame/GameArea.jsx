// src/components/GameArea.jsx
import React from 'react';
// UI Components
import StatusPanel from './panels/StatusPanel';
import BlockCountPanel from './panels/BlockCountPanel';
import HintButton from './panels/HintButton';
import GuideButton from './panels/GuideButton';
import PatternMatchPanel from './panels/PatternMatchPanel';
import BigOQuizModal from './panels/BigOQuizModal';
import HintPopup from './modals/HintPopup';


const GameArea = ({
  gameRef,
  currentLevel,
  playerHpState,
  currentWeaponData,
  patternData,
  hintOpen,
  levelHints,
  hasHints,
  onOpenHint,

  onToggleHint,
  onUserBigOChange,
  showBigOQuiz,
  onCloseBigOQuiz,
  onOpenGuide,
  hasGuides,
}) => {


  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Phaser Game - Main container */}
      <div className="flex-1 w-full relative flex items-end justify-center overflow-hidden bg-[#0f111a] min-h-0">
        <div
          ref={gameRef}
          className="w-full h-full"
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        />
      </div>

      {/* Compact Bottom UI Bar */}
      <div className="flex-shrink-0 bg-[#1e1b4b]/95 backdrop-blur-md border-t border-purple-500/30 shadow-2xl z-30">
        <div className="flex flex-wrap items-center gap-2 p-2 lg:p-3 text-purple-100">

          {/* STATUS: HP & Weapon */}
          <StatusPanel
            playerHpState={playerHpState}
            currentWeaponData={currentWeaponData}
            characterName={currentLevel?.character || 'main_1'}
          />

          {/* Pattern Match */}
          <PatternMatchPanel
            patternData={patternData}
            currentLevel={currentLevel}
            currentWeaponData={currentWeaponData}
          />

          {/* Block Count + Guide/Hint grouped */}
          <div className="flex flex-col gap-1 flex-shrink-0">
            <BlockCountPanel patternData={patternData} />
            <div className="flex gap-1">
              <GuideButton
                onOpenGuide={onOpenGuide}
                disabled={!hasGuides}
              />
              <HintButton
                onOpenHint={onOpenHint}
                disabled={!hasHints}
              />
            </div>
          </div>

        </div>
      </div>

      <HintPopup
        hints={levelHints}
        isOpen={hintOpen && levelHints && levelHints.length > 0}
        onClose={onToggleHint}
      />

      <BigOQuizModal
        isOpen={showBigOQuiz}
        onClose={onCloseBigOQuiz}
        onSelect={onUserBigOChange}
        currentPatternName={patternData?.bestPattern?.name}
      />
    </div>

  );
};

export default GameArea;