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
const BlockCountPanel = ({ patternData }) => {
  const currentBlockCount = patternData?.currentBlockCount || 0;
  const patternBlockCount = patternData?.bestPattern?.count || patternData?.totalBlocks || null;

  return (
    <div className="flex-shrink-0 bg-[#18113c]/80 backdrop-blur-md h-full rounded-2xl px-4 py-2 border border-purple-500/40 shadow-xl flex items-center justify-center gap-3">
      <div className="w-10 h-10 flex-shrink-0">
        <img
          src="/blockcount.png"
          alt="Block Count"
          className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
        />
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-gray-400 font-bold tracking-widest mb-0.5 uppercase drop-shadow-sm">
          Blocks
        </span>
        <div className="flex items-end gap-1">
          <span className="text-xl font-bold text-white leading-none drop-shadow-md">
            {currentBlockCount}
          </span>
          <span className="text-sm font-bold text-gray-500 mb-0.5 tracking-wide">
            /{patternBlockCount || '?'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BlockCountPanel;
