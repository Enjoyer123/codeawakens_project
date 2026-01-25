/**
 * StatusPanel Component
 * 
 * Displays player HP and current weapon status.
 * This is a pure UI component extracted from GameArea.jsx for better organization.
 */

import React from 'react';

/**
 * StatusPanel - Displays HP bar and weapon information
 * 
 * @param {Object} props
 * @param {number} props.playerHpState - Current player HP (0-100)
 * @param {Object} props.currentWeaponData - Current weapon data object
 * @param {string} props.currentWeaponData.name - Weapon name
 */
const StatusPanel = ({ playerHpState, currentWeaponData }) => {
  return (
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
            playerHpState > 50 
              ? 'bg-gradient-to-r from-green-600 to-green-500' 
              : playerHpState > 20 
                ? 'bg-gradient-to-r from-yellow-600 to-yellow-500' 
                : 'bg-gradient-to-r from-red-600 to-red-500'
          }`}
          style={{ width: `${playerHpState}%` }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">
          {playerHpState} / 100 HP
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
