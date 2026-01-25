/**
 * HistoryButton Component
 * 
 * Button to open the history modal showing past game attempts.
 * This is a pure UI component extracted from GameArea.jsx for better organization.
 */

import React from 'react';
import { History } from 'lucide-react';

/**
 * HistoryButton - Displays history button with icon
 * 
 * @param {Object} props
 * @param {Function} props.onClick - Callback when history button is clicked
 */
const HistoryButton = ({ onClick }) => {
  return (
    <div className="flex-shrink-0 bg-black/30 rounded-lg p-3 border border-gray-700/50">
      <button
        onClick={onClick}
        className="w-10 h-10 p-2 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 flex items-center justify-center opacity-100 hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] cursor-pointer"
        title="History"
      >
        <History className="w-full h-full text-blue-400" />
      </button>
    </div>
  );
};

export default HistoryButton;
