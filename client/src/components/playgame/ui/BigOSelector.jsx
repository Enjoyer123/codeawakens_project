/**
 * BigOSelector Component
 * 
 * Dropdown selector for Big O complexity selection.
 * This is a pure UI component extracted from GameArea.jsx for better organization.
 */

import React from 'react';
import { BIG_O_OPTIONS } from '../constants/bigOOptions';

/**
 * BigOSelector - Dropdown for selecting Big O complexity
 * 
 * @param {Object} props
 * @param {string} props.userBigO - Currently selected Big O value
 * @param {Function} props.onUserBigOChange - Callback when Big O selection changes
 * @param {Object} props.hintData - Hint data to check if pattern is 100% matched
 */
const BigOSelector = ({ userBigO, onUserBigOChange, hintData }) => {
  const isDisabled = hintData?.patternPercentage !== 100;

  return (
    <div className="flex-shrink-0 bg-black/30 rounded-lg p-3 border border-gray-700/50 min-w-[200px]">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
        Big O Complexity
      </label>
      <select
        value={userBigO || ''}
        onChange={(e) => {
          if (onUserBigOChange) {
            onUserBigOChange(e.target.value);
          }
        }}
        disabled={isDisabled}
        className={`w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-stone-500 focus:border-stone-500 ${!isDisabled
            ? 'bg-stone-800 border-stone-600 text-stone-300 cursor-pointer'
            : 'bg-stone-900 border-stone-700 text-stone-500 cursor-not-allowed opacity-60'
          }`}
      >
        {BIG_O_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default BigOSelector;
