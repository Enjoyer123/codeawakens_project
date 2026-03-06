/**
 * HintButton Component
 * 
 * Button to request hints from the level hint system.
 * This is a pure UI component extracted from GameArea.jsx for better organization.
 */

import React from 'react';

/**
 * HintButton - Displays hint button with glass icon
 * 
 * @param {Object} props
 * @param {Function} props.onOpenHint - Callback when hint button is clicked
 * @param {boolean} props.disabled - Whether the hint button is disabled
 */
const HintButton = ({ onOpenHint, disabled }) => {
  return (
    <div className="flex-1 bg-black/30 rounded-lg p-2 border border-gray-700/50 flex items-center justify-center">
      <button
        onClick={() => {
          if (typeof onOpenHint === 'function') {
            onOpenHint();
          } else {
            console.warn('⚠️ [HintButton] onOpenHint is not a function:', onOpenHint);
          }
        }}
        disabled={disabled}
        className={`w-10 h-10 p-1 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center ${disabled
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
  );
};

export default HintButton;
