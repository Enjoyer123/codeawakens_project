import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';

import { API_BASE_URL } from '../../config/apiConfig';

const GuidePopup = ({ guides, onClose }) => {
  const [currentGuideIndex, setCurrentGuideIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!guides || guides.length === 0) return null;

  const currentGuide = guides[currentGuideIndex];
  const isFirstGuide = currentGuideIndex === 0;
  const isLastGuide = currentGuideIndex === guides.length - 1;

  const handleNextGuide = () => {
    if (currentGuideIndex < guides.length - 1) {
      setCurrentGuideIndex(currentGuideIndex + 1);
      setCurrentImageIndex(0);
    }
  };

  const handlePreviousGuide = () => {
    if (currentGuideIndex > 0) {
      setCurrentGuideIndex(currentGuideIndex - 1);
      setCurrentImageIndex(0);
    }
  };

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [currentGuideIndex]);

  const guideImages = currentGuide?.guide_images || [];
  const currentImage = guideImages[currentImageIndex] || guideImages[0];
  const guideImagePath = currentImage?.path_file || currentGuide?.path_file;
  const hasMultipleImages = guideImages.length > 1;
  const hasImages = !!guideImagePath;

  const handleNextImage = () => {
    if (currentImageIndex < guideImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const fullImageUrl = guideImagePath ? `${API_BASE_URL}${guideImagePath.startsWith('/') ? '' : '/'}${guideImagePath}` : '/placeholder-guide.svg';

  const handleImageClick = () => {
    window.open(fullImageUrl, '_blank');
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="w-full max-w-[850px] aspect-[1.9/1] p-0 bg-transparent border-none shadow-none overflow-hidden"
      >
        <div
          className="w-full h-full relative flex flex-col"
          style={{
            backgroundImage: "url('/guide.png')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated'
          }}
        >
          {/* Header Section */}
          <div className="h-[14%] w-full flex items-center justify-between px-8 pt-1">
            <h2 className="text-[#0f172a] font-bold text-xl sm:text-2xl tracking-widest font-pixel uppercase"
              style={{ fontFamily: '"Press Start 2P", monospace' }}>
              Guide
            </h2>
          </div>

          <div className="flex-1 flex items-center px-10 pb-8 relative">
            {/* Guide Arrows: Previous */}
            <button
              onClick={handlePreviousGuide}
              disabled={isFirstGuide}
              className={`absolute left-2 z-10 p-1 transition-transform hover:scale-110 ${isFirstGuide ? 'opacity-0' : 'opacity-100'}`}
            >
              <img src="/arrow.png" alt="prev" className="w-8 h-10 rotate-180" style={{ imageRendering: 'pixelated' }} />
            </button>

            {/* Main Layout Grid */}
            <div className={`flex-1 ${hasImages ? 'grid grid-cols-2 gap-8' : 'flex justify-start p-8'} h-full w-full`}>

              {/* === LEFT COLUMN: Wooden Frame & Big Image === */}
              {hasImages && (
                <div className="flex flex-col justify-center h-full">
                  <div
                    className="flex-1 flex flex-col p-8 relative"
                    style={{
                      backgroundImage: "url('/guide-brown.png')",
                      backgroundSize: '100% 100%',
                      imageRendering: 'pixelated'
                    }}
                  >
                    {/* 1. Image Area - คลิกเพื่อเปิดในแท็บใหม่ */}
                    <div className="flex-1 relative w-full h-full bg-black/10 overflow-hidden">
                      <img
                        src={fullImageUrl}
                        alt="Guide"
                        onClick={handleImageClick}
                        className="w-full h-[250px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ imageRendering: 'pixelated' }}
                        title="คลิกเพื่อดูรูปใหญ่ในแท็บใหม่"
                      />
                      {hasMultipleImages && (
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 font-mono">
                          {currentImageIndex + 1}/{guideImages.length}
                        </div>
                      )}
                    </div>

                    {/* 2. Pagination Buttons */}
                    {hasMultipleImages && (
                      <div className="grid grid-cols-2 gap-1.5 mt-1.5 mb-1 h-7 sm:h-8 shrink-0">
                        <button
                          onClick={handlePreviousImage}
                          disabled={currentImageIndex === 0}
                          className={`relative w-full h-full transition-all active:translate-y-0.5 ${currentImageIndex === 0 ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:brightness-110'}`}
                        >
                          <img src="/button.png" alt="prev" className="w-full h-full object-fill" style={{ imageRendering: 'pixelated' }} />
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] sm:text-[11px] text-white font-bold font-pixel uppercase drop-shadow-md">Prev</span>
                        </button>

                        <button
                          onClick={handleNextImage}
                          disabled={currentImageIndex === guideImages.length - 1}
                          className={`relative w-full h-full transition-all active:translate-y-0.5 ${currentImageIndex === guideImages.length - 1 ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:brightness-110'}`}
                        >
                          <img src="/button.png" alt="next" className="w-full h-full object-fill" style={{ imageRendering: 'pixelated' }} />
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] sm:text-[11px] text-white font-bold font-pixel uppercase drop-shadow-md">Next</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === RIGHT COLUMN: Content Text === */}
              <div className={`flex flex-col justify-start pt-4 text-[#2d1b0e] ${!hasImages ? 'max-w-2xl' : ''}`}>
                <h3 className="text-xl font-bold mb-4 uppercase" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  {currentGuide.title}
                </h3>
                <div className="overflow-y-auto max-h-[65%] pr-2">
                  <p className="text-sm sm:text-base font-bold leading-relaxed whitespace-pre-line" style={{ fontFamily: 'monospace' }}>
                    {currentGuide.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Guide Arrows: Next */}
            <button
              onClick={handleNextGuide}
              disabled={isLastGuide}
              className={`absolute right-2 z-10 p-1 transition-transform hover:scale-110 ${isLastGuide ? 'opacity-0' : 'opacity-100'}`}
            >
              <img src="/arrow.png" alt="next" className="w-8 h-10" style={{ imageRendering: 'pixelated' }} />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuidePopup;
