// src/components/GameArea.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { directions } from '../../gameutils/utils/gameUtils';
import { fetchLevelById } from '../../services/levelService';
import DijkstraStateTable from './DijkstraStateTable';

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
    <div className="flex flex-col h-full overflow-auto relative">
      {/* Game Header - Compact */}
     

      {/* Phaser Game - Main container with relative positioning */}
      <div className="flex-1 w-full h-full bg-black relative flex items-center justify-center overflow-hidden">
        <div
          ref={gameRef}
          className="w-full h-full"
        />
        {/* Dijkstra State Table - แสดงเฉพาะในด่าน Shortest Path */}
        <DijkstraStateTable currentLevel={levelData} />
</div>

        {/* Compact Bottom UI Bar */}
      <div className="bg-stone-900 border-t border-gray-700 shadow-2xl relative z-20">
        <div className="grid grid-cols-12 gap-4 p-4 text-gray-200">
          
          {/* LEFT COLUMN: Player Stats (HP, Weapon, Coins) */}
          <div className="col-span-3 space-y-3">
            {/* HP & Weapon Card */}
            <div className="bg-black/30 rounded-lg p-3 border border-gray-700/50 flex flex-col gap-2">
              <div className="flex items-center justify-between">
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

            {/* Coins & Collectibles */}
            {(playerCoins.length > 0 || levelData?.goalType === "ช่วยคน") && (
               <div className="bg-black/30 rounded-lg p-3 border border-gray-700/50 flex flex-col gap-2">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Collection</span>
                 <div className="flex flex-wrap gap-2">
                    {playerCoins.length > 0 && (
                       <div className="flex items-center gap-1.5 text-xs text-yellow-500 bg-yellow-900/10 px-2 py-1 rounded border border-yellow-700/30">
                          <span>🪙</span>
                          <span className="font-mono font-bold">{playerCoins.reduce((s, c) => s + c.value, 0)}</span>
                       </div>
                    )}
                    {levelData?.goalType === "ช่วยคน" && (
                       <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-900/10 px-2 py-1 rounded border border-green-700/30">
                          <span>🆘</span>
                          <span className="font-mono font-bold">{rescuedPeople.length}/{levelData?.people?.length || 0}</span>
                       </div>
                    )}
                 </div>
               </div>
            )}
          </div>

          {/* CENTER COLUMN: Game Objective & Status */}
          <div className="col-span-12 md:col-span-6 flex flex-col gap-3">
             {/* Main Status Display */}
             <div className="flex-1 bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700 p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-500/30 to-transparent"></div>
                
                {isGameOver ? (
                  <div className="space-y-1 animate-in zoom-in duration-300">
                    <h2 className="text-2xl font-black text-red-500 tracking-tight drop-shadow-sm">GAME OVER</h2>
                    <p className="text-sm text-red-300/80 font-medium">Try again!</p>
                  </div>
                ) : isCompleted ? (
                  <div className="space-y-1 animate-in zoom-in duration-300">
                    <h2 className="text-2xl font-black text-green-400 tracking-tight drop-shadow-sm">VICTORY!</h2>
                     {finalScore && (
                        <div className="text-sm text-green-300/80 bg-green-900/20 px-3 py-1 rounded-full border border-green-800/30">
                           Score: {finalScore.totalScore} • ⭐ {finalScore.stars}
                        </div>
                     )}
                  </div>
                ) : (
                  <div className="space-y-2">
                     <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Current Goal</span>
                     </div>
                     <div className="text-lg font-bold text-white flex items-center justify-center gap-2">
                        {levelData?.goalType === "ถึงเป้าหมาย" ? "🏁 Reach Node " + levelData?.goalNodeId :
                         levelData?.goalType === "เรียงเหรียญ" ? "🪙 Collect Coins" :
                         levelData?.goalType === "ช่วยคน" ? "🆘 Rescue People" :
                         levelData?.goalType === "หาของ" ? "📦 Find Item" : "Objective Unknown"}
                     </div>
                     <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
                        <div className="bg-black/40 px-3 py-1 rounded-full border border-gray-700 flex items-center gap-2">
                          <span>Position:</span>
                          <span className="text-white font-mono">{playerNodeId}</span>
                        </div>
                        <div className="bg-black/40 px-3 py-1 rounded-full border border-gray-700 flex items-center gap-2">
                          <span>Facing:</span>
                          <span className="text-white font-mono">{directions && directions[playerDirection] ? directions[playerDirection].symbol : '?'}</span>
                        </div>
                     </div>
                  </div>
                )}
             </div>
          </div>

          {/* RIGHT COLUMN: Pattern & Hints */}
          <div className="col-span-3 space-y-3 flex flex-col">
             {/* Pattern Progress */}
             <div className="bg-black/30 rounded-lg p-3 border border-gray-700/50">
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
                      <span className="text-[10px] text-gray-300 truncate max-w-[100px]">{hintData.patternName}</span>
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
                         {/* Part 1 Indicator */}
                         <div className={`flex-1 h-1.5 rounded ${
                           hintData.threePartsMatch.part1Match 
                             ? 'bg-green-500' 
                             : 'bg-gray-700'
                         }`} title="Part 1: Initialization"></div>
                         {/* Part 2 Indicator */}
                         <div className={`flex-1 h-1.5 rounded ${
                           hintData.threePartsMatch.part2Match 
                             ? 'bg-green-500' 
                             : hintData.threePartsMatch.part1Match
                             ? 'bg-yellow-500'
                             : 'bg-gray-700'
                         }`} title="Part 2: While Loop"></div>
                         {/* Part 3 Indicator */}
                         <div className={`flex-1 h-1.5 rounded ${
                           hintData.threePartsMatch.part3Match 
                             ? 'bg-green-500' 
                             : hintData.threePartsMatch.part2Match
                             ? 'bg-yellow-500'
                             : 'bg-gray-700'
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

               {/* Block Count Progress - แสดงตลอดเวลา อยู่ใต้ Pattern Parts */}
               <div className="mt-3 pt-3 border-t border-gray-700/50">
                 <div className="flex items-center justify-between mb-1">
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Block Count</span>
                   <span className="text-[10px] text-gray-500">
                     {currentBlockCount}
                     {patternBlockCount ? ` / ${patternBlockCount}` : ''}
                   </span>
                 </div>
                 <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                   <div
                     className={`h-full transition-all duration-300 ${
                       patternBlockCount && currentBlockCount >= patternBlockCount
                         ? 'bg-green-500'
                         : 'bg-blue-500'
                     }`}
                     style={{
                       width: `${patternBlockCount && patternBlockCount > 0
                         ? Math.min((currentBlockCount / patternBlockCount) * 100, 100)
                         : 100
                       }%`,
                     }}
                   ></div>
                 </div>
               </div>
             </div>

             {/* Hint & Actions */}
             <div className="bg-black/30 rounded-lg p-3 border border-gray-700/50 flex flex-col gap-2 flex-1">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assist</span>
                    <button onClick={openDetail} className="text-[10px] text-stone-400 hover:text-white underline underline-offset-2 decoration-stone-600 transition-colors">
                      View Details
                    </button>
                </div>
                
                {/* Big O Complexity Dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
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
                
                <div className="flex gap-2 mt-auto">
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
                     className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors border ${
                       needHintDisabled
                         ? 'bg-stone-900 border-stone-700 text-stone-500 opacity-50 cursor-not-allowed'
                         : 'bg-stone-800 border-stone-600 text-stone-300 hover:bg-stone-700'
                     }`}
                   >
                     💡 Need Hint
                   </button>
                </div>
                {/* Popup Hint Overlay */}
                {hintOpen && activeLevelHint && (
                  <div className="fixed inset-0 z-40 flex items-center justify-center">
                    {console.log('🔍 [GameArea] Rendering Hint Popup:', {
                      hintOpen,
                      activeLevelHint,
                      title: activeLevelHint?.title,
                      hasImages: !!activeLevelHint?.hint_images?.length,
                      imageCount: activeLevelHint?.hint_images?.length || 0
                    })}
                    <div className="absolute inset-0 bg-black/60" />
                    <div className="relative z-50 bg-stone-900 rounded-2xl border border-yellow-700/80 shadow-2xl max-w-4xl w-[96%] max-h-[85vh] p-8 overflow-y-auto">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs uppercase tracking-wider text-yellow-300 font-bold">
                          Hint
                        </div>
                        <button
                          className="text-xs text-yellow-200 hover:text-white"
                          onClick={onToggleHint || (() => {})}
                        >
                          ✕
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-white">
                          {activeLevelHint.title}
                        </div>
                        {activeLevelHint.description && (
                          <div className="text-xs text-yellow-100 leading-relaxed">
                            {activeLevelHint.description}
                          </div>
                        )}
                        {activeLevelHint.hint_images && activeLevelHint.hint_images.length > 0 && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      </div>
                      <div className="mt-4 text-[10px] text-yellow-400/80 text-right">
                        กดปุ่ม "Need Hint" อีกครั้งเพื่อดู Hint ถัดไป (ถ้ามี)
                      </div>
                    </div>
                  </div>
                )}
                {/* Debug: Show hint status */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-1 text-[8px] text-gray-600">
                    Debug: hintOpen={hintOpen ? 'true' : 'false'}, currentHint={currentHint ? `"${currentHint.substring(0, 20)}..."` : 'null'}
                  </div>
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GameArea;