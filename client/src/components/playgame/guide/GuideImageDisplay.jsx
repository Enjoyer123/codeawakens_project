import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const GuideImageDisplay = ({ currentGuide, currentGuideIndex, guides }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Reset image index when guide changes
    useEffect(() => {
        setCurrentImageIndex(0);
    }, [currentGuide]);

    const guideImages = currentGuide?.guide_images || [];
    const hasMultipleImages = guideImages.length > 1;
    const currentImage = guideImages[currentImageIndex];
    const guideImagePath = currentImage?.path_file || currentGuide?.path_file;

    return (
        <div className="space-y-4">
            <div className="aspect-video bg-gray-700 rounded-xl overflow-hidden flex items-center justify-center relative">
                <img
                    src={
                        guideImagePath
                            ? `${API_BASE_URL}${guideImagePath.startsWith('/') ? '' : '/'}${guideImagePath}`
                            : '/placeholder-guide.svg'
                    }
                    alt={currentGuide?.title || 'Guide image'}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                        console.error('Failed to load guide image:', guideImagePath);
                        e.target.src = '/placeholder-guide.svg';
                    }}
                />

                {hasMultipleImages && (
                    <>
                        <button
                            onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                            disabled={currentImageIndex === 0}
                            className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all ${currentImageIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setCurrentImageIndex(Math.min(guideImages.length - 1, currentImageIndex + 1))}
                            disabled={currentImageIndex === guideImages.length - 1}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all ${currentImageIndex === guideImages.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                            {currentImageIndex + 1} / {guideImages.length}
                        </div>
                    </>
                )}
            </div>

            {guides.length > 1 && (
                <div className="flex justify-center space-x-2">
                    {guides.map((_, index) => (
                        <div
                            key={index}
                            className={`w-3 h-3 rounded-full transition-colors ${index === currentGuideIndex ? 'bg-gray-600' : 'bg-gray-300'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default GuideImageDisplay;
