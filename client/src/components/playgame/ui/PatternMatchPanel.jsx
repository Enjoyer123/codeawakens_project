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
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pattern Match</span>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-gray-500">
            {hintData?.matchedBlocks || 0}/{hintData?.totalBlocks || 0}
          </span>

          {/* Best Weapon Icon Display */}
          {idealPattern && (
            <div className="flex items-center gap-1.5 bg-green-500/10 rounded-md px-1.5 py-0.5 border border-green-500/20">
              <div className="relative w-8 h-8 bg-black/40 rounded border border-gray-700/50 overflow-hidden flex items-center justify-center">
                {/* Background (Locked/Dimmed) */}
                <img
                  src={weaponImgSrc}
                  alt="Weapon"
                  className="absolute w-6 h-6 object-contain brightness-50 grayscale"
                  onError={(e) => {
                    // Fallback 1: ลอง path ทั่วไป
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
                    className="w-6 h-6 object-contain"
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
              <div className="flex flex-col">
                <span className="text-[9px] text-green-400 font-bold leading-none">
                  {idealPattern.pattern_type_id === 1 ? '⭐ GOLD' : '🥈 SILVER'}
                </span>
                <span className="text-[10px] text-white font-mono leading-none mt-0.5">
                  {weaponProgress}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {hintData && hintData.showPatternProgress ? (
        <div className="space-y-2">
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${(hintData.patternPercentage || 0) === 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
              style={{ width: `${hintData.patternPercentage || 0}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-300 truncate max-w-[120px]">
              {hintData.patternName}
            </span>
            <span className="text-[10px] text-blue-400 font-mono">
              {hintData.patternPercentage}%
            </span>
          </div>

          {/* Three Parts Match Indicator */}
          {hintData.threePartsMatch && (
            <div className="mt-2 pt-2 border-t border-gray-700/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Pattern Parts
                </span>
                <span className="text-[10px] text-gray-500">
                  {hintData.threePartsMatch.matchedParts || 0}/3
                </span>
              </div>
              <div className="flex gap-1">
                <div
                  className={`flex-1 h-1.5 rounded ${hintData.threePartsMatch.part1Match ? 'bg-green-500' : 'bg-gray-700'
                    }`}
                  title="Part 1: Initialization"
                ></div>
                <div
                  className={`flex-1 h-1.5 rounded ${hintData.threePartsMatch.part2Match
                      ? 'bg-green-500'
                      : hintData.threePartsMatch.part1Match ? 'bg-yellow-500' : 'bg-gray-700'
                    }`}
                  title="Part 2: While Loop"
                ></div>
                <div
                  className={`flex-1 h-1.5 rounded ${hintData.threePartsMatch.part3Match
                      ? 'bg-green-500'
                      : hintData.threePartsMatch.part2Match ? 'bg-yellow-500' : 'bg-gray-700'
                    }`}
                  title="Part 3: Neighbor Loop"
                ></div>
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
        <p className="text-[10px] text-gray-600 italic text-center py-1">
          Place blocks to see pattern match
        </p>
      )}
    </div>
  );
};

export default PatternMatchPanel;
