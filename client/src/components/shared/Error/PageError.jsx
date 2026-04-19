import React from 'react';

const PageError = ({
    message = 'THE PAGE YOU ARE LOOKING FOR MIGHT HAVE BEEN REMOVED HAD ITS NAME CHANGED OR IS TEMPORARILY UNAVAILABLE.',
    title = 'WE ARE SORRY, PAGE NOT FOUND!',
    statusCode = '404',
    className = ''
}) => {
    return (
        <div className={`min-h-screen bg-[#120a1f] flex items-center justify-center p-4 font-sans relative overflow-hidden ${className}`}>

            {/* Background "404" Ghost Text */}
            <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none overflow-hidden">
                <h1 className="text-[24rem] font-black text-white/[0.04] leading-none m-0 p-0 tracking-tighter -mt-70">
                    {statusCode}
                </h1>
            </div>

            {/* Foreground Content */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-3xl w-full px-4">

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-tight drop-shadow-md">
                    {title}
                </h2>

                <p className="text-xs sm:text-sm text-gray-400 mb-10 uppercase tracking-widest leading-relaxed max-w-2xl font-medium drop-shadow">
                    {message}
                </p>

                <button
                    onClick={() => window.location.href = '/'}
                    className="px-10 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_4px_14px_0_rgba(147,51,234,0.39)] hover:shadow-[0_6px_20px_rgba(147,51,234,0.23)] active:scale-95 focus:outline-none"
                >
                    Back to Homepage
                </button>
            </div>
        </div>
    );
};

export default PageError;