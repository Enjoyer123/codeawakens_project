import React from 'react';

const LevelCard = ({ level, onClick }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'hard':
        return 'bg-orange-500';
      case 'expert':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      onClick={() => onClick(level.level_id)}
      className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border border-gray-700"
    >
      {/* Level Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">{level.level_name}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getDifficultyColor(level.difficulty || 'medium')}`}>
          {level.difficulty || 'medium'}
        </span>
      </div>

      {/* Level Info */}
      <div className="space-y-3">
        {/* Level Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
          <div className="text-center">
            <div className="text-sm text-gray-400">เงื่อนไข</div>
            <div className="text-white font-medium truncate" title={level.goal_node_id || 'N/A'}>
              Node {level.goal_node_id || 'N/A'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400">มอนสเตอร์</div>
            <div className="text-white font-medium">
              {level.monsters ? (Array.isArray(level.monsters) ? level.monsters.length : Object.keys(level.monsters).length) : 0} ตัว
            </div>
          </div>
        </div>
      </div>

      {/* Play Button */}
      <div className="mt-6 text-center">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors w-full">
          เล่นด่าน
        </button>
      </div>
    </div>
  );
};

export default LevelCard;
