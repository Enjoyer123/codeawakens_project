import React from 'react';

const GuidePagination = ({
    onPrevious,
    onNext,
    onClose,
    isFirstGuide,
    isLastGuide
}) => {
    return (
        <div className="bg-gray-950 px-6 py-4 flex justify-between items-center">
            <div className="flex space-x-3">
                <button
                    onClick={onPrevious}
                    disabled={isFirstGuide}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${isFirstGuide
                        ? 'bg-gray-400 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    ก่อนหน้า
                </button>

                <button
                    onClick={onNext}
                    disabled={isLastGuide}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${isLastGuide
                        ? 'bg-gray-400 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    ถัดไป
                    <svg className="w-4 h-4 inline ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            <button
                onClick={onClose}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
            >
                {isLastGuide ? 'เริ่มเล่นเกม' : 'ข้ามคำแนะนำ'}
            </button>
        </div>
    );
};

export default GuidePagination;
