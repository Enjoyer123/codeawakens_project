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
                            Hint
                        </h2>
                    </div>

                    <div className="flex-1 min-h-0 flex items-stretch px-10 pb-8 pt-4 relative">
                        {/* Hint Arrows: Previous */}
                        <button
                            onClick={handlePreviousHint}
                            disabled={isFirstHint}
                            className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1 transition-transform hover:scale-110 ${isFirstHint ? 'opacity-0' : 'opacity-100'}`}
                        >
                            <img src="/arrow.png" alt="prev" className="w-8 h-10 rotate-180" style={{ imageRendering: 'pixelated' }} />
                        </button>

                        {/* Main Layout Grid - Single Column now */}
                        <div className="flex-1 min-h-0 flex justify-center items-stretch px-12 sm:px-16 pb-8 pt-2 w-full">

                            {hintImage ? (
                                <div
                                    className="w-full h-full flex flex-col p-4 sm:p-6 relative transition-all duration-300"
                                    style={{
                                        backgroundImage: "url('/guide-brown.png')",
                                        backgroundSize: '100% 100%',
                                        imageRendering: 'pixelated'
                                    }}
                                >
                                    {/* Image Area - คลิกเพื่อเปิดในแท็บใหม่ */}
                                    <div className="flex-1 relative w-full h-full overflow-hidden flex flex-col justify-center items-center rounded shadow-inner">
                                        <img
                                            src={imageUrl}
                                            alt="Hint"
                                            onClick={handleImageClick}
                                            className="max-w-full max-h-full object-contain cursor-pointer transition-transform duration-500 hover:scale-[1.01]"
                                            style={{ imageRendering: 'pixelated' }}
                                            title="คลิกเพื่อดูรูปใหญ่ในแท็บใหม่"
                                        />

                                        {/* Hint Counter Badge */}
                                        {hints.length > 1 && (
                                            <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm border border-white/20 text-white text-[10px] sm:text-[12px] px-2 sm:px-3 py-1 font-mono rounded-full font-bold shadow-lg">
                                                {currentHintIndex + 1} / {hints.length}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Fallback if no images - Text only centered */
                                <div className="w-full flex flex-col justify-center items-center text-center p-8 bg-[#2d1b0e]/90 rounded-xl border-4 border-[#5c3a21] shadow-2xl">
                                    <h3 className="text-2xl font-bold mb-6 text-yellow-500 uppercase shrink-0" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                                        {currentHint.title}
                                    </h3>
                                    <div className="flex-1 min-h-0 overflow-y-auto px-4 w-full" style={{
                                        scrollbarWidth: 'thin',
                                        scrollbarColor: '#8b5a2b rgba(0,0,0,0.3)'
                                    }}>
                                        <style>{`
                                            .overflow-y-auto::-webkit-scrollbar {
                                                width: 10px;
                                            }
                                            .overflow-y-auto::-webkit-scrollbar-track {
                                                background: rgba(0,0,0,0.3);
                                                border-radius: 5px;
                                            }
                                            .overflow-y-auto::-webkit-scrollbar-thumb {
                                                background-color: #8b5a2b;
                                                border-radius: 5px;
                                                border: 2px solid rgba(0,0,0,0.3);
                                            }
                                        `}</style>
                                        <p className="text-lg text-white/90 leading-relaxed font-medium text-left whitespace-pre-wrap pb-4">
                                            {currentHint.description || 'ไม่มีรายละเอียด'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Hint Arrows: Next */}
                        <button
                            onClick={handleNextHint}
                            disabled={isLastHint}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1 transition-transform hover:scale-110 ${isLastHint ? 'opacity-0' : 'opacity-100'}`}
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
