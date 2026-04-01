import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '../../ui/dialog';
import { API_BASE_URL } from '../../../config/apiConfig';
import { playSound } from '../../../gameutils/sound/soundManager';

const HintPopup = ({ hints, isOpen, onClose }) => {
    const [currentHintIndex, setCurrentHintIndex] = useState(0);

    // Reset to 0 when opening & play sound
    useEffect(() => {
        if (isOpen) {
            setCurrentHintIndex(0);
            playSound('paper');
        }
    }, [isOpen]);

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

    const hasImages = currentHint?.hint_images && currentHint.hint_images.length > 0;

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
                            className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1 transition-transform hover:scale-110 ${isFirstHint ? 'opacity-0' : 'opacity-100'}`}
                        >
                            <img src="/arrow.png" alt="prev" className="w-8 h-10 rotate-180" style={{ imageRendering: 'pixelated' }} />
                        </button>

                        {/* Main Layout Grid - Single Column now */}
                        <div className="flex-1 min-h-0 flex justify-center items-stretch pb-8 pt-2 w-full relative">

                            {hasImages ? (
                                <div className="flex-1 relative w-full h-full overflow-y-auto flex flex-col items-center rounded shadow-inner"
                                    style={{
                                        scrollbarWidth: 'thin',
                                        scrollbarColor: '#8b5a2b rgba(0,0,0,0.3)'
                                    }}
                                >
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
                                    
                                    {currentHint.hint_images.map((img, idx) => {
                                        const url = img?.path_file
                                            ? `${API_BASE_URL}${img.path_file.startsWith('/') ? '' : '/'}${img.path_file}`
                                            : '/guide.png';

                                        return (
                                            <img
                                                key={img.hint_image_id || Math.random()}
                                                src={url}
                                                alt={`Hint ${idx + 1}`}
                                                onClick={() => window.open(url, '_blank')}
                                                className="w-full h-auto object-contain cursor-pointer transition-transform duration-500 hover:scale-[1.01] mb-2 last:mb-0"
                                                style={{ imageRendering: 'pixelated' }}
                                                title="คลิกเพื่อดูรูปใหญ่ในแท็บใหม่"
                                            />
                                        );
                                    })}

                                    {/* Hint Counter Badge */}
                                    {hints.length > 1 && (
                                        <div className="absolute right-6 bottom-4 bg-black/80 backdrop-blur-sm border border-white/20 text-white text-[10px] sm:text-[12px] px-2 sm:px-3 py-1 font-mono rounded-full font-bold shadow-lg z-50 pointer-events-none">
                                            {currentHintIndex + 1} / {hints.length}
                                        </div>
                                    )}
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
                                    
                                    {/* Hint Counter Badge */}
                                    {hints.length > 1 && (
                                        <div className="absolute right-6 bottom-4 bg-black/80 backdrop-blur-sm border border-white/20 text-white text-[10px] sm:text-[12px] px-2 sm:px-3 py-1 font-mono rounded-full font-bold shadow-lg z-50 pointer-events-none">
                                            {currentHintIndex + 1} / {hints.length}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Hint Arrows: Next */}
                        <button
                            onClick={handleNextHint}
                            disabled={isLastHint}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1 transition-transform hover:scale-110 ${isLastHint ? 'opacity-0' : 'opacity-100'}`}
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
