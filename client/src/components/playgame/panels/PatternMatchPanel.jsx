/**
 * PatternMatchPanel Component
 * 
 * Displays pattern matching progress and three-parts matching indicator.
 */

import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const PatternMatchPanel = ({ patternData, currentLevel, currentWeaponData }) => {
  // หา idealPattern (Gold > Silver)
  const allPatterns = [...(currentLevel?.goodPatterns || []), ...(currentLevel?.patterns || [])];
  const idealPattern = allPatterns.find(p => p.pattern_type_id === 1) ||
    allPatterns.find(p => p.pattern_type_id === 2);

  // คำนวณ weapon progress ตาม tier
  let weaponProgress = 0;
  const currentBestPattern = patternData?.bestPattern;
  if (idealPattern && currentBestPattern) {
    if (currentBestPattern.pattern_type_id === idealPattern.pattern_type_id) {
      weaponProgress = patternData.patternPercentage || 0;
    } else if (currentBestPattern.pattern_type_id === 2 && idealPattern.pattern_type_id === 1) {
      weaponProgress = 66; // Silver ในด่าน Gold → ค้างที่ 66%
    } else if (currentBestPattern.pattern_type_id < idealPattern.pattern_type_id) {
      weaponProgress = patternData.patternPercentage || 0;
    }
  }

  const [showHelp, setShowHelp] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const helpImages = ['/pattern1.png', '/pattern2.png'];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % helpImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + helpImages.length) % helpImages.length);
  };

  // Progress bar color based on percentage
  const getProgressColor = (pct) => {
    if (pct >= 100) return 'bg-green-500';
    if (pct >= 66) return 'bg-yellow-400';
    if (pct > 0) return 'bg-blue-400';
    return 'bg-gray-600';
  };

  return (
    <div className="flex-1 bg-black/30 rounded-lg p-3 border border-gray-700/50">
      <Dialog open={showHelp} onOpenChange={(open) => {
        setShowHelp(open);
        if (open) setCurrentImageIndex(0);
      }}>
        <DialogContent className="max-w-4xl bg-transparent border-0 shadow-none p-0 flex justify-center items-center outline-none">
          <div className="relative flex items-center justify-center">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute -top-4 -right-4 bg-white text-black rounded-full w-8 h-8 font-bold border-2 border-black z-50 hover:bg-gray-200 flex items-center justify-center shadow-lg"
            >
              X
            </button>

            <button
              onClick={prevImage}
              className="absolute -left-12 bg-white/80 text-black rounded-full w-10 h-10 font-bold border-2 border-black z-40 hover:bg-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
            >
              &lt;
            </button>

            <img
              src={helpImages[currentImageIndex]}
              alt={`Pattern Description ${currentImageIndex + 1}`}
              className="max-h-[85vh] w-auto rounded-lg shadow-2xl border-4 border-white"
            />

            <button
              onClick={nextImage}
              className="absolute -right-12 bg-white/80 text-black rounded-full w-10 h-10 font-bold border-2 border-black z-40 hover:bg-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
            >
              &gt;
            </button>

            <div className="absolute -bottom-8 flex gap-2">
              {helpImages.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full border border-white ${idx === currentImageIndex ? 'bg-white' : 'bg-transparent'}`}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-stretch h-full">
        {/* Left: Progress Bar & Stats (50%) */}
        <div className="w-1/2 flex flex-col items-center gap-2 pr-2 border-r border-gray-700/50">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">MATCH</span>
            <span className="text-[10px] text-gray-500 font-mono">
              {patternData?.matchedBlocks || 0}/{patternData?.totalBlocks || 0}
            </span>
          </div>

          {idealPattern && (
            <div className="flex flex-col items-center gap-1.5 w-full max-w-[120px]">
              {/* Weapon Progress Bar (อิง tier) */}
              <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden border border-gray-600/50">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(weaponProgress)}`}
                  style={{ width: `${Math.min(weaponProgress, 100)}%` }}
                />
              </div>

              {/* Weapon Name & Percentage */}
              <div className="flex items-center justify-between gap-1 w-full text-[10px] font-bold leading-none">
                <span className="text-yellow-400 truncate flex-1 text-left">
                  {(currentWeaponData?.name || '').toUpperCase().replace(/🏭|✨/g, '').trim()}
                </span>
                <span className="text-white bg-white/10 px-1 rounded-sm text-[9px] shrink-0">
                  {weaponProgress}%
                </span>
              </div>

              {/* Pattern Match Progress Bar (ตรง Pattern จริงกี่ %) */}
              <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden border border-gray-600/50 mt-1">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(patternData?.patternPercentage || 0)}`}
                  style={{ width: `${Math.min(patternData?.patternPercentage || 0, 100)}%` }}
                />
              </div>

              {/* Pattern Name & Percentage */}
              <div className="flex items-center justify-between gap-1 w-full text-[10px] font-bold leading-none">
                <span className="text-blue-300 truncate flex-1 text-left text-[8px]">
                  {patternData?.bestPattern?.pattern_name || 'Pattern'}
                </span>
                <span className="text-white bg-blue-500/20 px-1 rounded-sm text-[9px] shrink-0">
                  {patternData?.patternPercentage || 0}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Pattern Info (50%) */}
        <div className="w-1/2 flex flex-col pl-2">
          {patternData && patternData.showPatternProgress ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                    Pattern
                  </span>
                  <button
                    onClick={() => setShowHelp(true)}
                    className="text-[9px] bg-gray-600 hover:bg-gray-500 text-white rounded-full w-4 h-4 flex items-center justify-center transition-colors shadow-sm"
                    title="How Pattern works?"
                  >
                    ?
                  </button>
                </div>
                <span className="text-[10px] text-blue-300 truncate font-bold leading-tight max-w-full text-center mb-1">
                  {patternData?.bestPattern?.pattern_name || patternData?.bestPattern?.pattern_type?.type_name || 'กำลังวิเคราะห์...'}
                </span>
                <span className="text-[10px] text-gray-300 truncate font-medium leading-tight max-w-full text-center">
                  จำนวน Pattern Part
                </span>
              </div>

              {/* Three Parts Match Indicator - Bar-based */}
              {patternData.threePartsMatch && (
                <div className="flex flex-col items-center gap-1.5 bg-black/20 rounded p-1.5 w-full">
                  <span className="text-[9px] text-gray-400 w-full text-center font-bold tracking-tight">
                    PARTS: {patternData.threePartsMatch.matchedParts || 0}/3
                  </span>
                  <div className="flex gap-1 w-full h-1.5 px-1">
                    {[1, 2, 3].map((part) => {
                      const matchedParts = patternData.threePartsMatch.matchedParts || 0;
                      return (
                        <div
                          key={part}
                          className={`flex-1 ${part <= matchedParts ? 'bg-green-500' : 'bg-gray-700'} rounded-full transition-colors duration-300 shadow-[0_0_5px_rgba(0,0,0,0.5)]`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-[10px] text-gray-600 italic text-center">
                Scan Blocks...
              </p>
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

export default PatternMatchPanel;
