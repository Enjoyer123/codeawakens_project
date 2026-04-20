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
  const helpImages = ['/pattern1.png', '/pattern2.png', '/pattern3.png', '/pattern4.png'];

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
    <div className="flex-1 bg-[#18113c]/80 backdrop-blur-md rounded-2xl w-full h-full p-2 lg:p-3 border border-purple-500/40 shadow-xl relative font-sans">
      <Dialog open={showHelp} onOpenChange={(open) => {
        setShowHelp(open);
        if (open) setCurrentImageIndex(0);
      }}>
        <DialogContent className="max-w-4xl bg-[#18113c] border border-purple-900/50 rounded-lg p-0 outline-none">
          <div className="relative flex items-center justify-center p-3">
            <button
              onClick={prevImage}
              className="absolute left-2 w-10 h-10 rounded-full bg-black/50 text-white text-3xl font-light pb-1 flex items-center justify-center hover:bg-black/70"
            >
              ‹
            </button>

            <img
              src={helpImages[currentImageIndex]}
              alt={`Pattern Description ${currentImageIndex + 1}`}
              className="max-h-[80vh] w-auto rounded"
            />

            <button
              onClick={nextImage}
              className="absolute right-2 w-10 h-10 rounded-full bg-black/50 text-white text-3xl font-light pb-1 flex items-center justify-center hover:bg-black/70"
            >
              ›
            </button>
          </div>

          <div className="flex justify-center gap-1.5 pb-3">
            {helpImages.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full ${idx === currentImageIndex ? 'bg-purple-400' : 'bg-purple-800'}`}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-stretch h-full">
        {/* Left: Progress Bar & Stats (50%) */}
        <div className="w-1/2 flex flex-col items-center justify-center gap-1.5 pr-3 border-r border-purple-500/30">

          {idealPattern && (
            <div className="flex flex-col items-center gap-2 w-full max-w-[140px]">

              {/* SYNCHRONIZATION Bar */}
              <div className="w-full relative">
                <div className="text-[10px] text-yellow-300 drop-shadow-sm mb-1 font-bold tracking-widest text-center">
                  WEAPON SYNC
                </div>
                <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden border border-gray-700/50">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(weaponProgress)}`}
                    style={{ width: `${Math.min(weaponProgress, 100)}%`, boxShadow: '0 0 10px currentColor' }}
                  />
                </div>
              </div>

              {/* RESONANCE Bar */}
              <div className="w-full relative mt-1">
                <div className="text-[10px] text-blue-300 drop-shadow-sm mb-1 font-bold tracking-widest text-center">
                  CODE MATCH
                </div>
                <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden border border-gray-700/50">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(patternData?.patternPercentage || 0)}`}
                    style={{ width: `${Math.min(patternData?.patternPercentage || 0, 100)}%`, boxShadow: '0 0 10px currentColor' }}
                  />
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Right: Pattern Info (50%) */}
        <div className="w-1/2 flex flex-col pl-3 justify-center">
          {patternData && patternData.showPatternProgress ? (
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="flex flex-col items-center relative group cursor-pointer" onClick={() => setShowHelp(true)}>
                <div className="text-[10px] text-gray-400 drop-shadow-sm mb-0.5 font-bold tracking-widest flex items-center gap-1">
                  CODE PATTERN <span className="text-blue-400 text-[10px] opacity-80 hover:opacity-100">[?]</span>
                </div>
                <span className="text-[13px] text-[#4ade80] drop-shadow-md truncate font-black uppercase tracking-wider text-center">
                  ACTIVE
                </span>
              </div>

              {/* Three Parts Match Indicator - Sleek Style */}
              {patternData.threePartsMatch && (
                <div className="flex flex-col items-center gap-1.5 w-full">
                  <span className="text-[10px] text-purple-300 drop-shadow-sm w-full text-center font-bold tracking-widest">
                    KEY STEPS
                  </span>
                  <div className="flex gap-2 w-full h-2 px-1">
                    {[1, 2, 3].map((part) => {
                      const matchedParts = patternData.threePartsMatch.matchedParts || 0;
                      return (
                        <div
                          key={part}
                          className={`flex-1 rounded-full border border-gray-700/50 ${part <= matchedParts ? 'bg-[#ffca28] shadow-[0_0_8px_#ffca28]' : 'bg-black/40'} transition-all duration-500`}
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
