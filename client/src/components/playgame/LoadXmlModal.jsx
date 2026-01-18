import React from 'react';

const LoadXmlModal = ({ isOpen, onClose, options }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-stone-900 border border-stone-700 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/50">
                    <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
                        📂 โหลดตัวอย่างโค้ด XML
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-stone-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content (Scrollable Grid) */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    option.onClick();
                                    onClose();
                                }}
                                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 text-left
                  ${option.className || 'bg-stone-800 border-stone-700 hover:bg-stone-700 hover:border-stone-500 text-stone-200'}
                  hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                `}
                                title={option.title}
                            >
                                <div className="text-2xl shrink-0">{option.icon || '📦'}</div>
                                <div className="flex flex-col min-w-0">
                                    <span className="font-semibold text-sm truncate w-full">{option.label}</span>
                                    {option.description && (
                                        <span className="text-xs text-stone-400 truncate w-full">{option.description}</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-stone-950/50 border-t border-stone-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-sm transition-colors"
                    >
                        ยกเลิก
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoadXmlModal;
