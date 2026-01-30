import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';

import { API_BASE_URL } from '../../config/apiConfig';

const HintPopup = ({ hints, isOpen, onClose, initialHintIndex = 0 }) => {
    const [currentHintIndex, setCurrentHintIndex] = useState(initialHintIndex);

    // Reset to initial index when opening or when initialHintIndex changes
    useEffect(() => {
        setCurrentHintIndex(initialHintIndex);
    }, [initialHintIndex, isOpen]);

    if (!hints || hints.length === 0) return null;

    const currentHint = hints[currentHintIndex];
    const isFirstHint = currentHintIndex === 0;
    const isLastHint = currentHintIndex === hints.length - 1;

    const handleNextHint = () => {
        if (currentHintIndex < hints.length - 1) {
            setCurrentHintIndex(currentHintIndex + 1);
        }
    };

    const handlePreviousHint = () => {
        if (currentHintIndex > 0) {
            setCurrentHintIndex(currentHintIndex - 1);
        }
    };

    const hintImage = currentHint?.hint_images && currentHint.hint_images.length > 0
        ? currentHint.hint_images[0]
        : null;
    const imageUrl = hintImage?.path_file
        ? `${API_BASE_URL}${hintImage.path_file.startsWith('/') ? '' : '/'}${hintImage.path_file}`
        : '/guide.png';

    const handleImageClick = () => {
        if (hintImage) {
            window.open(imageUrl, '_blank');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
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
                            Hint
                        </h2>
                    </div>

                    <div className="flex-1 flex items-center px-10 pb-8 relative">
                        {/* Hint Arrows: Previous */}
                        <button
                            onClick={handlePreviousHint}
                            disabled={isFirstHint}
                            className={`absolute left-2 z-10 p-1 transition-transform hover:scale-110 ${isFirstHint ? 'opacity-0' : 'opacity-100'}`}
                        >
                            <img src="/arrow.png" alt="prev" className="w-8 h-10 rotate-180" style={{ imageRendering: 'pixelated' }} />
                        </button>

                        {/* Main Layout Grid */}
                        <div className={`flex-1 ${hintImage ? 'grid grid-cols-2 gap-8' : 'flex justify-start p-8'} h-full w-full`}>

                            {/* === LEFT COLUMN: Wooden Frame & Image === */}
                            {hintImage && (
                                <div className="flex flex-col justify-center h-full">
                                    <div
                                        className="flex-1 flex flex-col p-8 relative"
                                        style={{
                                            backgroundImage: "url('/guide-brown.png')",
                                            backgroundSize: '100% 100%',
                                            imageRendering: 'pixelated'
                                        }}
                                    >
                                        {/* Image Area - คลิกเพื่อเปิดในแท็บใหม่ */}
                                        <div className="flex-1 relative w-full h-full bg-black/10 overflow-hidden flex items-center justify-center">
                                            <img
                                                src={imageUrl}
                                                alt="Hint"
                                                onClick={handleImageClick}
                                                className="w-full h-[250px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                                style={{ imageRendering: 'pixelated' }}
                                                title="คลิกเพื่อดูรูปใหญ่ในแท็บใหม่"
                                            />
                                            {/* Hint counter badge */}
                                            {hints.length > 1 && (
                                                <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 font-mono">
                                                    {currentHintIndex + 1}/{hints.length}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* === RIGHT COLUMN: Content Text === */}
                            <div className={`flex flex-col justify-start pt-4 text-[#2d1b0e] ${!hintImage ? 'max-w-2xl' : ''}`}>
                                <h3 className="text-xl font-bold mb-4 uppercase" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                                    {currentHint.title}
                                </h3>
                                <div className="overflow-y-auto max-h-[65%] pr-2">
                                    <p className="text-sm sm:text-base font-bold leading-relaxed whitespace-pre-line" style={{ fontFamily: 'monospace' }}>
                                        {currentHint.description || 'ไม่มีรายละเอียด'}
                                    </p>
                                </div>


                            </div>
                        </div>

                        {/* Hint Arrows: Next */}
                        <button
                            onClick={handleNextHint}
                            disabled={isLastHint}
                            className={`absolute right-2 z-10 p-1 transition-transform hover:scale-110 ${isLastHint ? 'opacity-0' : 'opacity-100'}`}
                        >
                            <img src="/arrow.png" alt="next" className="w-8 h-10" style={{ imageRendering: 'pixelated' }} />
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default HintPopup;
