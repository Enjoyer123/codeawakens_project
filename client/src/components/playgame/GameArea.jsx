// src/components/GameArea.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { directions } from '../../gameutils/utils/gameUtils';
import { fetchLevelById } from '../../services/levelService';
import DijkstraStateTable from './DijkstraStateTable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const GameArea = ({
  gameRef,
  levelData,
  playerNodeId,
  playerDirection,
  playerHpState,
  isCompleted,
  isGameOver,
  currentWeaponData,
  currentHint,
  hintData,
  hintOpen,
  levelHints,
  activeLevelHint,
  onNeedHintClick,
  needHintDisabled,
  onToggleHint,
  hintOpenCount,
  finalScore,
  inCombatMode,
  playerCoins = [],
  rescuedPeople = [],
  workspaceRef,
  userBigO,
  onUserBigOChange,
}) => {
  const { getToken } = useAuth();
  const [viewerData, setViewerData] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const currentBlockCount = hintData?.currentBlockCount || 0;
  
  // ใช้ bestPattern.count ถ้ามี หรือใช้ totalBlocks เป็น fallback
  const patternBlockCount = hintData?.bestPattern?.count || hintData?.totalBlocks || null;
  console.log('🔍 [GameArea] patternBlockCount:', patternBlockCount);
  console.log('🔍 [GameArea] Block count debug:', {
    currentBlockCount,
    patternBlockCount,
    hasBestPattern: !!hintData?.bestPattern,
    bestPatternName: hintData?.bestPattern?.name,
    bestPatternCount: hintData?.bestPattern?.count,
    totalBlocks: hintData?.totalBlocks
  });

  console.log('🔍 [GameArea] render Assist panel state:', {
    onNeedHintClickType: typeof onNeedHintClick,
    hasLevelHints: Array.isArray(levelHints) && levelHints.length > 0,
    levelHintsLength: levelHints?.length || 0,
    hintOpen,
    needHintDisabled,
    hasActiveLevelHint: !!activeLevelHint,
  });

  const closeDetail = () => setViewerData(null);

  // Open detail: try to fetch full level details from API, otherwise use adapter fallback
  const openDetail = async () => {
    // If we already have viewer data, just show it
    if (viewerData) return;

    const adapter = () => ({
      level: levelData || {},
      enabledBlocks: levelData?.enabledBlocks || levelData?.enabled_blocks || [],
      patterns: levelData?.patterns || levelData?.goodPatterns || [],
      victoryConditions: levelData?.victoryConditions || levelData?.victory_conditions || [],
      guides: levelData?.guides || [],
      weaponImages: levelData?.weaponImages || []
    });

    // If level has an id, try fetching full details used by Admin
    const levelId = levelData?.id || levelData?.level_id || levelData?.level?.id;
    if (!levelId || !getToken) {
      setViewerData(adapter());
      return;
    }

    setViewerLoading(true);
    try {
      const fullLevel = await fetchLevelById(getToken, levelId);
      if (fullLevel && fullLevel.level_id) {
        setViewerData({
          level: fullLevel,
          enabledBlocks: (fullLevel.level_blocks || []).map((lb) => lb.block),
          patterns: fullLevel.patterns || [],
          victoryConditions: (fullLevel.level_victory_conditions || []).map(
            (vc) => vc.victory_condition
          ),
          guides: fullLevel.guides || [],
          weaponImages: fullLevel.weaponImages || []
        });
      } else {
        setViewerData(adapter());
      }
    } catch (err) {
      console.warn('Failed to fetch full level details:', err);
      setViewerData(adapter());
    } finally {
      setViewerLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Phaser Game - Main container */}
      <div className="flex-1 w-full relative flex items-end justify-center overflow-hidden bg-stone-900 min-h-0">
        <div
          ref={gameRef}
          className="w-full h-full"
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        />
        {/* Dijkstra State Table - แสดงเฉพาะในด่าน Shortest Path */}
        <DijkstraStateTable currentLevel={levelData} />
      </div>

      {/* Compact Bottom UI Bar */}
      <div className="flex-shrink-0 bg-stone-900/95 backdrop-blur-md border-t border-gray-700/50 shadow-2xl z-30">
        <div className="flex items-center gap-4 p-3 text-gray-200">
          
          {/* STATUS: HP & Weapon */}
          <div className="flex-shrink-0 bg-black/30 rounded-lg p-3 border border-gray-700/50 min-w-[200px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</span>
              {currentWeaponData && (
                <span className="text-[10px] bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded border border-blue-800/50">
                   ⚔️ {currentWeaponData.name}
                </span>
              )}
            </div>
            
            {/* HP Bar */}
            <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
               <div
                  className={`h-full transition-all duration-500 ease-out ${
                    playerHpState > 50 ? 'bg-gradient-to-r from-green-600 to-green-500' : 
                    playerHpState > 20 ? 'bg-gradient-to-r from-yellow-600 to-yellow-500' : 'bg-gradient-to-r from-red-600 to-red-500'
                  }`}
                  style={{ width: `${playerHpState}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">
                  {playerHpState} / 100 HP
                </div>
            </div>
          </div>

          {/* Block Count */}
          <div className="flex-shrink-0 bg-black/30 rounded-lg p-3 border border-gray-700/50 flex items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0">
              <img 
                src="/blockcount.png" 
                alt="Block Count" 
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-black text-white leading-none drop-shadow-lg font-mono">
                {currentBlockCount}
              </span>
              <span className="text-lg font-bold text-gray-500 mb-0.5 font-mono">
                /{patternBlockCount || '?'}
              </span>
            </div>
          </div>

          {/* Hint Button */}
          <div className="flex-shrink-0 bg-black/30 rounded-lg p-3 border border-gray-700/50">
            <button 
              onClick={() => {
                console.log('🟡 [GameArea] Need Hint button clicked');
                if (typeof onNeedHintClick === 'function') {
                  onNeedHintClick();
                } else {
                  console.warn('⚠️ [GameArea] onNeedHintClick is not a function:', onNeedHintClick);
                }
              }}
              disabled={needHintDisabled}
              className={`w-10 h-10 p-1 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                needHintDisabled
                  ? 'opacity-40 grayscale cursor-not-allowed'
                  : 'opacity-100 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] cursor-pointer'
              }`}
              title="Need Hints"
            >
              <img 
                src="/glass.png" 
                alt="Hint" 
                className="w-full h-full object-contain"
              />
            </button>
          </div>

          {/* Pattern Match */}
          <div className="flex-1 bg-black/30 rounded-lg p-3 border border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pattern Match</span>
              <span className="text-[10px] text-gray-500">{hintData?.matchedBlocks || 0}/{hintData?.totalBlocks || 0}</span>
            </div>

            {hintData && hintData.showPatternProgress ? (
              <div className="space-y-2">
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                   <div 
                     className={`h-full transition-all duration-300 ${
                       (hintData.patternPercentage || 0) === 100 ? 'bg-green-500' : 'bg-blue-500'
                     }`}
                     style={{ width: `${hintData.patternPercentage || 0}%` }}
                   ></div>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] text-gray-300 truncate max-w-[120px]">{hintData.patternName}</span>
                   <span className="text-[10px] text-blue-400 font-mono">{hintData.patternPercentage}%</span>
                </div>
                
                {/* Three Parts Match Indicator */}
                {hintData.threePartsMatch && (
                  <div className="mt-2 pt-2 border-t border-gray-700/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pattern Parts</span>
                      <span className="text-[10px] text-gray-500">
                        {hintData.threePartsMatch.matchedParts || 0}/3
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <div className={`flex-1 h-1.5 rounded ${
                        hintData.threePartsMatch.part1Match ? 'bg-green-500' : 'bg-gray-700'
                      }`} title="Part 1: Initialization"></div>
                      <div className={`flex-1 h-1.5 rounded ${
                        hintData.threePartsMatch.part2Match 
                          ? 'bg-green-500' 
                          : hintData.threePartsMatch.part1Match ? 'bg-yellow-500' : 'bg-gray-700'
                      }`} title="Part 2: While Loop"></div>
                      <div className={`flex-1 h-1.5 rounded ${
                        hintData.threePartsMatch.part3Match 
                          ? 'bg-green-500' 
                          : hintData.threePartsMatch.part2Match ? 'bg-yellow-500' : 'bg-gray-700'
                      }`} title="Part 3: Neighbor Loop"></div>
                    </div>
                    <div className="text-[9px] text-gray-500 mt-1 text-center">
                      {hintData.threePartsMatch.matchedParts === 0 && 'No parts matched'}
                      {hintData.threePartsMatch.matchedParts === 1 && 'Part 1: Initialization ✓'}
                      {hintData.threePartsMatch.matchedParts === 2 && 'Part 1+2: Initialization + While Loop ✓'}
                      {hintData.threePartsMatch.matchedParts === 3 && 'Part 1+2+3: Full Pattern ✓'}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-gray-600 italic text-center py-1">Place blocks to see pattern match</p>
            )}
          </div>

          {/* Big O Complexity */}
          <div className="flex-shrink-0 bg-black/30 rounded-lg p-3 border border-gray-700/50 min-w-[200px]">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Big O Complexity
            </label>
            <select
              value={userBigO || ''}
              onChange={(e) => {
                if (onUserBigOChange) {
                  onUserBigOChange(e.target.value);
                }
              }}
              disabled={hintData?.patternPercentage !== 100}
              className={`w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-stone-500 focus:border-stone-500 ${
                hintData?.patternPercentage === 100
                  ? 'bg-stone-800 border-stone-600 text-stone-300 cursor-pointer'
                  : 'bg-stone-900 border-stone-700 text-stone-500 cursor-not-allowed opacity-60'
              }`}
            >
              <option value="">-- เลือก Big O --</option>
              <option value="constant">O(1) - Constant</option>
              <option value="log_n">O(log n) - Logarithmic</option>
              <option value="n">O(n) - Linear</option>
              <option value="n_log_n">O(n log n) - Linearithmic</option>
              <option value="n2">O(n²) - Quadratic</option>
              <option value="n3">O(n³) - Cubic</option>
              <option value="pow2_n">O(2ⁿ) - Exponential</option>
              <option value="factorial">O(n!) - Factorial</option>
            </select>
          </div>

        </div>
      </div>

      {/* Popup Hint Dialog */}
      <Dialog 
        open={hintOpen && !!activeLevelHint} 
        onOpenChange={(isOpen) => {
          if (!isOpen && onToggleHint) {
            onToggleHint();
          }
        }}
      >
        <DialogContent className="bg-[url('/paper.png')] bg-cover bg-center bg-no-repeat border border-yellow-700/80 max-w-4xl w-[96%] max-h-[85vh] overflow-y-auto p-8 shadow-2xl">
          <DialogHeader className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-yellow-900 font-bold bg-yellow-400/20 px-2 py-0.5 rounded">
                Hint
              </span>
            </div>
            <DialogTitle className="text-lg font-bold text-stone-900">
              {activeLevelHint?.title}
            </DialogTitle>
            {activeLevelHint?.description && (
              <DialogDescription className="text-sm text-stone-800 font-medium leading-relaxed text-left">
                {activeLevelHint.description}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            {activeLevelHint?.hint_images && activeLevelHint.hint_images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeLevelHint.hint_images.map(img => (
                  <div
                    key={img.hint_image_id}
                    className="w-full h-60 md:h-72 bg-black/60 border border-yellow-700/50 rounded-xl flex items-center justify-center overflow-hidden"
                  >
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}${img.path_file}`}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 text-[10px] text-yellow-400/80 text-right">
              กดปุ่ม "Need Hint" อีกครั้งเพื่อดู Hint ถัดไป (ถ้ามี)
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>

  );
};

export default GameArea;