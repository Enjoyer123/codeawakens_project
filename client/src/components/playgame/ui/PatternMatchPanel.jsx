/**
 * PatternMatchPanel Component
 * 
 * Displays pattern matching progress, weapon unlock progress, and three-parts matching indicator.
 * This is a complex UI component extracted from GameArea.jsx for better organization.
 */

import React from 'react';

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
const PatternMatchPanel = ({ hintData, idealPattern, weaponProgress, weaponImgSrc }) => {
  return (
    <div className="flex-1 bg-black/30 rounded-lg p-3 border border-gray-700/50">
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
              <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded text-[8px] font-bold leading-none">
                <span className={idealPattern.pattern_type_id === 1 ? 'text-yellow-400' : 'text-gray-300'}>
                  {idealPattern.pattern_type_id === 1 ? 'GOLD' : 'SILVER'}
                </span>
                <span className="text-white">
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
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                  Pattern
                </span>
                <span className="text-[10px] text-gray-300 truncate font-medium leading-tight max-w-full text-center">
                  {hintData.patternName}
                </span>
              </div>

              {/* Three Parts Match Indicator - Sprite-based */}
              {hintData.threePartsMatch && (
                <div className="flex flex-col items-center gap-1 bg-black/20 rounded p-1 w-full">
                  <span className="text-[9px] text-gray-500 w-full text-center">
                    Parts: {hintData.threePartsMatch.matchedParts || 0}/3
                  </span>
                  <img
                    src={`/pattern/Part_${(hintData.threePartsMatch.matchedParts || 0) + 1}.png`}
                    alt={`Pattern ${hintData.threePartsMatch.matchedParts || 0} parts`}
                    className="block h-6 object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
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
