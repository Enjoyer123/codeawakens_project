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
import PlaybackOverlay from './controls/PlaybackOverlay';
import { isAlgoLevel } from '../../gameutils/shared/levelType';

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
  isRunning,
}) => {

  const isLegacy = currentLevel ? !isAlgoLevel(currentLevel) : false;

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Phaser Game - Main container */}
      <div className="flex-1 w-full relative flex items-end justify-center overflow-hidden bg-[#0f111a] min-h-0 border-b border-purple-500/20 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        <div
          ref={gameRef}
          className="w-full h-full"
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        />

        {/* Floating Guide / Hint / Blocks on Phaser Canvas (Top Right) */}
        <div className="absolute top-4 right-4 z-40 flex flex-col gap-2 pointer-events-none">
          <div className="pointer-events-auto flex flex-col gap-3 items-end">
            <BlockCountPanel patternData={patternData} />
            <div className="flex gap-2">
              <GuideButton onOpenGuide={onOpenGuide} disabled={!hasGuides} />
              <HintButton onOpenHint={onOpenHint} disabled={!hasHints} />
            </div>
          </div>
        </div>
      </div>

      {/* Sleek Symmetrical Bottom Bar */}
      <div className="flex-shrink-0 bg-[#0f0a2a]/95 backdrop-blur-xl border-t border-purple-500/30 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] z-30 font-sans">
        <div className="grid grid-cols-3 items-stretch p-3 lg:p-4 text-purple-100 gap-4">
          
          {/* LEFT: Status (HP / Weapon) */}
          <div className="flex w-full h-full">
            {currentLevel && (
              <div className="w-full">
                <StatusPanel
                  playerHpState={playerHpState}
                  currentWeaponData={currentWeaponData}
                  characterName={currentLevel.character || 'main_1'}
                />
              </div>
            )}
          </div>

          {/* CENTER: Pattern Match */}
          <div className="flex w-full h-full">
            <PatternMatchPanel
              patternData={patternData}
              currentLevel={currentLevel}
              currentWeaponData={currentWeaponData}
            />
          </div>

          {/* RIGHT: Playback Controls */}
          <div className="flex w-full h-full">
            <PlaybackOverlay isRunning={isRunning} isLegacy={isLegacy} />
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