import React from 'react';

const PageError = ({ message, title = 'Failed to load data', className = '' }) => {
    return (
        <div className={`min-h-screen bg-[#120a1f] flex items-center justify-center text-white ${className}`}>
            <div className="text-center p-6">
                <p className="text-xl text-red-400 mb-2 font-bold uppercase tracking-wider">{title}</p>
                <p className="text-sm text-gray-400">{message || 'Unknown error occurred'}</p>
            </div>
        </div>
    );
};

export default PageError;
