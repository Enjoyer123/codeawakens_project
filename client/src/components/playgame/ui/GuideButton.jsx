/**
 * GuideButton Component
 * 
 * Button to reopen the initial level guide.
 */

import React from 'react';

const GuideButton = ({ onOpenGuide, disabled }) => {
    return (
        <div className="flex-shrink-0 bg-black/30 rounded-lg p-3 border border-gray-700/50">
            <button
                onClick={() => {
                    console.log('📘 [GuideButton] clicked');
                    if (typeof onOpenGuide === 'function') {
                        onOpenGuide();
                    }
                }}
                disabled={disabled}
                className={`w-10 h-10 p-1 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center ${disabled
                        ? 'opacity-40 grayscale cursor-not-allowed'
                        : 'opacity-100 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] cursor-pointer'
                    }`}
                title="คู่มือ (Guide)"
            >
                {/* Book Icon SVG */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-full h-full text-blue-200"
                >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
            </button>
        </div>
    );
};

export default GuideButton;
