/**
 * PatternMatchPanel Component
 * 
 * Displays pattern matching progress, weapon unlock progress, and three-parts matching indicator.
 * This is a complex UI component extracted from GameArea.jsx for better organization.
 */

import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import { API_BASE_URL } from '../../../config/apiConfig';

/**
 * PatternMatchPanel - Displays pattern matching information and weapon progress
 * 
 * @param {Object} props
 * @param {Object} props.hintData - Hint data containing pattern matching information
 * @param {Object} props.idealPattern - The ideal pattern for this level
 * @param {number} props.weaponProgress - Weapon unlock progress (0-100)
 * @param {string} props.weaponImgSrc - URL to weapon image
 */
const PatternMatchPanel = ({ hintData, idealPattern, weaponProgress, weaponImgSrc, currentWeaponData }) => {
  const [showHelp, setShowHelp] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const helpImages = ['/pattern1.png', '/pattern2.png'];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % helpImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + helpImages.length) % helpImages.length);
  };

  return (
    <div className="flex-1 bg-black/30 rounded-lg p-3 border border-gray-700/50">
      <Dialog open={showHelp} onOpenChange={(open) => {
        setShowHelp(open);
        if (open) setCurrentImageIndex(0); // Reset to first image on open
      }}>
        <DialogContent className="max-w-4xl bg-transparent border-0 shadow-none p-0 flex justify-center items-center outline-none">
          <div className="relative flex items-center justify-center">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute -top-4 -right-4 bg-white text-black rounded-full w-8 h-8 font-bold border-2 border-black z-50 hover:bg-gray-200 flex items-center justify-center shadow-lg"
            >
              X
            </button>

            {/* Previous Button */}
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

            {/* Next Button */}
            <button
              onClick={nextImage}
              className="absolute -right-12 bg-white/80 text-black rounded-full w-10 h-10 font-bold border-2 border-black z-40 hover:bg-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
            >
              &gt;
            </button>

            {/* Page Indicator */}
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
        {/* Left: Weapon & Stats (50%) */}
        <div className="w-1/2 flex flex-col items-center gap-2 pr-2 border-r border-gray-700/50">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">MATCH</span>
            <span className="text-[10px] text-gray-500 font-mono">
              {hintData?.matchedBlocks || 0}/{hintData?.totalBlocks || 0}
            </span>
          </div>

          {idealPattern && (
            <div className="flex flex-col items-center gap-1">
              <div className="relative w-16 h-16 bg-white/90 rounded border border-gray-700/50 overflow-hidden flex items-center justify-center flex-shrink-0">
                {/* Background (Locked/Dimmed) */}
                <img
                  src={weaponImgSrc}
                  alt="Weapon"
                  className="absolute w-full h-full object-contain brightness-50 grayscale scale-[5.0]"
                  onError={(e) => {
                    if (!e.target.src.includes('_idle_1')) {
                      const key = idealPattern.weaponKey || idealPattern.weapon?.weapon_key || 'stick';
                      e.target.src = `/weapons/${key}.png`;
                    } else {
                      e.target.style.display = 'none';
                    }
                  }}
                />
                {/* Foreground (Progress Fill) */}
                <div
                  className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none"
                  style={{
                    clipPath: `inset(${100 - weaponProgress}% 0 0 0)`
                  }}
                >
                  <img
                    src={weaponImgSrc}
                    alt="Weapon Progress"
                    className="w-full h-full object-contain scale-[5.0]"
                    onError={(e) => {
                      if (!e.target.src.includes('_idle_1')) {
                        const key = idealPattern.weaponKey || idealPattern.weapon?.weapon_key || 'stick';
                        e.target.src = `/weapons/${key}.png`;
                      } else {
                        e.target.style.display = 'none';
                      }
                    }}
                  />
                </div>
              </div>

              {/* Rank & Progress Text (Below Image) */}
              <div className="flex items-center justify-between gap-1.5 bg-black/40 px-2 py-1 rounded text-[10px] font-bold leading-none w-full max-w-[120px]">
                <span className="text-yellow-400 truncate flex-1 text-left">
                  {(currentWeaponData?.name || '').toUpperCase().replace(/🏭|✨/g, '').trim()}
                </span>
                <span className="text-white bg-white/10 px-1 rounded-sm text-[9px] shrink-0">
                  {weaponProgress}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Pattern Info (50%) */}
        <div className="w-1/2 flex flex-col pl-2">
          {hintData && hintData.showPatternProgress ? (
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
                <span className="text-[10px] text-gray-300 truncate font-medium leading-tight max-w-full text-center">
                  จำนวน Pattern Part
                </span>
              </div>

              {/* Three Parts Match Indicator - Bar-based */}
              {hintData.threePartsMatch && (
                <div className="flex flex-col items-center gap-1.5 bg-black/20 rounded p-1.5 w-full">
                  <span className="text-[9px] text-gray-400 w-full text-center font-bold tracking-tight">
                    PARTS: {hintData.threePartsMatch.matchedParts || 0}/3
                  </span>
                  <div className="flex gap-1 w-full h-1.5 px-1">
                    {[1, 2, 3].map((part) => {
                      const matchedParts = hintData.threePartsMatch.matchedParts || 0;
                      let bgColor = 'bg-gray-700'; // Default gray

                      if (part <= matchedParts) {
                        bgColor = 'bg-green-500'; // Completed
                      }

                      return (
                        <div
                          key={part}
                          className={`flex-1 ${bgColor} rounded-full transition-colors duration-300 shadow-[0_0_5px_rgba(0,0,0,0.5)]`}
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
