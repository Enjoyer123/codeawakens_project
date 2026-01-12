import React from 'react';

const GameControls = ({
    runCode,
    gameState,
    blocklyLoaded,
    isRunning,
    isGameOver,
    blocklyJavaScriptReady,
    codeValidation,
    currentLevel,
    onDebugToggle,
    debugMode
}) => {
    const isRunDisabled =
        gameState === "running" ||
        !blocklyLoaded ||
        isRunning ||
        isGameOver ||
        (currentLevel?.textcode && !blocklyJavaScriptReady) ||
        (currentLevel?.textcode && (!codeValidation || !codeValidation.isValid));

    return (
        <div className="flex-none bg-stone-900 border-t border-gray-700 shadow-xl z-20 p-4">
            <div className="grid grid-cols-4 gap-2">
                <button
                    onClick={runCode}
                    disabled={isRunDisabled}
                    className="col-span-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white py-2 rounded-lg font-bold shadow-lg transform transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {gameState === "running" ? (
                        <>
                            <span className="animate-spin">🌀</span> Running...
                        </>
                    ) : (
                        <>
                            <span>▶️</span> RUN CODE
                        </>
                    )}
                </button>

                <button
                    onClick={() => window.location.reload()}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 py-2 rounded-lg font-semibold shadow transition active:scale-95 flex items-center justify-center gap-1"
                >
                    🔄 Reset
                </button>

                <button
                    onClick={onDebugToggle}
                    className={`py-2 rounded-lg font-semibold shadow transition active:scale-95 flex items-center justify-center gap-1 ${debugMode
                        ? "bg-yellow-600 text-white ring-2 ring-yellow-400/50"
                        : "bg-stone-700 hover:bg-stone-600 text-stone-300"
                        }`}
                >
                    🐞 Debug
                </button>
            </div>
        </div>
    );
};

export default GameControls;
