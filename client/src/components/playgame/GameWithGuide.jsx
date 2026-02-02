import React from 'react';
import GuidePopup from './GuidePopup';

const GameWithGuide = ({ levelData, children, levelName, showGuide, guides, closeGuide }) => {

  return (
    <div className="relative h-full">
      {/* Main Game Content */}
      <div className={`h-full transition-all duration-300 ${showGuide ? 'opacity-80' : 'opacity-100'}`}>
        {children}
      </div>

      {/* Guide Popup */}
      {showGuide && (
        <GuidePopup
          guides={guides}
          onClose={closeGuide}
          levelName={levelName || levelData?.name || 'ด่าน'}
        />
      )}
    </div>
  );
};

export default GameWithGuide;
