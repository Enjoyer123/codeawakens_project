import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '../../ui/dialog';
import { API_BASE_URL } from '../../../config/apiConfig';

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

  const fullImageUrl = guideImagePath ? `${API_BASE_URL}${guideImagePath.startsWith('/') ? '' : '/'}${guideImagePath} ` : '/placeholder-guide.svg';

  const handleImageClick = () => {
    window.open(fullImageUrl, '_blank');
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="w-full max-w-[850px] min-h-[450px] max-h-[90vh] flex flex-col p-0 bg-transparent border-none shadow-none overflow-hidden"
      >
        <div
          className="w-full flex-1 min-h-0 relative flex flex-col"
          style={{
            backgroundImage: "url('/guide.png')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated'
          }}
        >
          {/* Header Section */}
          <div className="pt-8 pb-4 shrink-0 w-full flex items-center justify-between px-8">
            <h2 className="text-[#0f172a] font-bold text-xl sm:text-2xl tracking-widest font-pixel uppercase"
              style={{ fontFamily: '"Press Start 2P", monospace' }}>
              Guide
            </h2>
          </div>

          <div className="flex-1 min-h-0 flex items-stretch px-10 pb-8 pt-4 relative">
            {/* Guide Arrows: Previous */}
            <button
              onClick={handlePreviousGuide}
              disabled={isFirstGuide}
              className={`absolute left - 2 top - 1 / 2 - translate - y - 1 / 2 z - 10 p - 1 transition - transform hover: scale - 110 ${isFirstGuide ? 'opacity-0' : 'opacity-100'} `}
            >
              <img src="/arrow.png" alt="prev" className="w-8 h-10 rotate-180" style={{ imageRendering: 'pixelated' }} />
            </button>

            {/* Main Layout Grid - Single Column now */}
            <div className="flex-1 min-h-0 flex justify-center items-stretch px-12 sm:px-16 pb-8 pt-2 w-full">

              {hasImages ? (
                <div
                  className="w-full h-full flex flex-col p-4 sm:p-6 relative transition-all duration-300"
                  style={{
                    backgroundImage: "url('/guide-brown.png')",
                    backgroundSize: '100% 100%',
                    imageRendering: 'pixelated'
                  }}
                >
                  {/* Image Area - คลิกเพื่อเปิดในแท็บใหม่ */}
                  <div className="flex-1 relative w-full h-full overflow-hidden flex flex-col justify-center items-center">
                    <img
                      src={fullImageUrl}
                      alt="Guide"
                      onClick={handleImageClick}
                      className="max-w-full max-h-full object-contain cursor-pointer transition-transform duration-500 hover:scale-[1.01]"
                      style={{ imageRendering: 'pixelated' }}
                      title="คลิกเพื่อดูรูปใหญ่ในแท็บใหม่"
                    />

                    {/* Image Counter Badge */}
                    {hasMultipleImages && (
                      <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm border border-white/20 text-white text-[10px] sm:text-[12px] px-2 sm:px-3 py-1 font-mono rounded-full font-bold shadow-lg">
                        {currentImageIndex + 1} / {guideImages.length}
                      </div>
                    )}
                  </div>

                  {/* Pagination Buttons */}
                  {hasMultipleImages && (
                    <div className="flex justify-center gap-4 mt-2 h-8 shrink-0">
                      <button
                        onClick={handlePreviousImage}
                        disabled={currentImageIndex === 0}
                        className={`relative w - 32 h - full transition - all active: scale - 95 ${currentImageIndex === 0 ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:brightness-110 drop-shadow-md'} `}
                      >
                        <img src="/button.png" alt="prev" className="w-full h-full object-fill" style={{ imageRendering: 'pixelated' }} />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-[12px] text-white font-bold font-pixel uppercase drop-shadow-md tracking-wider">Prev Img</span>
                      </button>

                      <button
                        onClick={handleNextImage}
                        disabled={currentImageIndex === guideImages.length - 1}
                        className={`relative w - 32 h - full transition - all active: scale - 95 ${currentImageIndex === guideImages.length - 1 ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:brightness-110 drop-shadow-md'} `}
                      >
                        <img src="/button.png" alt="next" className="w-full h-full object-fill" style={{ imageRendering: 'pixelated' }} />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-[12px] text-white font-bold font-pixel uppercase drop-shadow-md tracking-wider">Next Img</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback if no images - Text only centered */
                <div className="w-full flex flex-col justify-center items-center text-center p-8 bg-[#2d1b0e]/90 rounded-xl border-4 border-[#5c3a21] shadow-2xl">
                  <h3 className="text-2xl font-bold mb-6 text-yellow-500 uppercase shrink-0" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    {currentGuide.title}
                  </h3>
                  <div className="flex-1 min-h-0 overflow-y-auto px-4 w-full" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#8b5a2b rgba(0,0,0,0.3)'
                  }}>
                    <style>{`
  .overflow - y - auto:: -webkit - scrollbar {
  width: 10px;
}
                      .overflow - y - auto:: -webkit - scrollbar - track {
  background: rgba(0, 0, 0, 0.3);
  border - radius: 5px;
}
                      .overflow - y - auto:: -webkit - scrollbar - thumb {
  background - color: #8b5a2b;
  border - radius: 5px;
  border: 2px solid rgba(0, 0, 0, 0.3);
}
`}</style>
                    <p className="text-lg text-white/90 leading-relaxed font-medium text-left whitespace-pre-wrap pb-4">
                      {currentGuide.description}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Guide Arrows: Next */}
            <button
              onClick={handleNextGuide}
              disabled={isLastGuide}
              className={`absolute right - 2 top - 1 / 2 - translate - y - 1 / 2 z - 10 p - 1 transition - transform hover: scale - 110 ${isLastGuide ? 'opacity-0' : 'opacity-100'} `}
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
