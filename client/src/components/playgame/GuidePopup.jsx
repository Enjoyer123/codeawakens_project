import React, { useState } from 'react';
import GuideImageDisplay from './guide/GuideImageDisplay';
import GuideContent from './guide/GuideContent';
import GuidePagination from './guide/GuidePagination';

const GuidePopup = ({ guides, onClose, levelName }) => {
  const [currentGuideIndex, setCurrentGuideIndex] = useState(0);

  if (!guides || guides.length === 0) {
    return null;
  }

  const currentGuide = guides[currentGuideIndex];
  const isFirstGuide = currentGuideIndex === 0;
  const isLastGuide = currentGuideIndex === guides.length - 1;

  const handleNext = () => {
    if (currentGuideIndex < guides.length - 1) {
      setCurrentGuideIndex(currentGuideIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentGuideIndex > 0) {
      setCurrentGuideIndex(currentGuideIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black-900/5"></div>

      {/* Popup Content */}
      <div className="relative bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-950 text-gray-100 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2">คำแนะนำ - {levelName}</h2>
              <div className="flex items-center space-x-2">
                <span className="bg-white-200 bg-opacity-2 px-3 py-1 rounded-full text-sm">
                  {currentGuideIndex + 1} / {guides.length}
                </span>
                <span className="text-gray-100">
                  {currentGuide.title}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GuideImageDisplay
              currentGuide={currentGuide}
              currentGuideIndex={currentGuideIndex}
              guides={guides}
              setCurrentGuideIndex={setCurrentGuideIndex}
            />
            <GuideContent currentGuide={currentGuide} />
          </div>
        </div>

        {/* Footer */}
        <GuidePagination
          onPrevious={handlePrevious}
          onNext={handleNext}
          onClose={onClose}
          isFirstGuide={isFirstGuide}
          isLastGuide={isLastGuide}
        />
      </div>
    </div>
  );
};

export default GuidePopup;
