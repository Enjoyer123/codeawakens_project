/**
 * BlockCountPanel Component
 * 
 * Displays the current block count vs target pattern block count.
 * This is a pure UI component extracted from GameArea.jsx for better organization.
 */

import React from 'react';

/**
 * BlockCountPanel - Displays block count with icon
 * 
 * @param {Object} props
 * @param {number} props.currentBlockCount - Current number of blocks placed
 * @param {number|null} props.patternBlockCount - Target pattern block count (or null if unknown)
 */
const BlockCountPanel = ({ currentBlockCount, patternBlockCount }) => {
  return (
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
  );
};

export default BlockCountPanel;
