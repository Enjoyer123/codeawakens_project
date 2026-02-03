import React from 'react';
import { History, Loader2, Play, RotateCcw } from 'lucide-react';

const GameControls = ({
    runCode,
    gameState,
    blocklyLoaded,
    isRunning,
    isGameOver,
    blocklyJavaScriptReady,
    codeValidation,
    currentLevel,
    onHistoryClick
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
            <div className="grid grid-cols-5 gap-2">
                <button
                    onClick={runCode}
                    disabled={isRunDisabled}
                    className="col-span-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white py-2 rounded-lg font-bold shadow-lg transform transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {gameState === "running" ? (
                        <>
                            <Loader2 className="animate-spin" size={20} /> Running...
                        </>
                    ) : (
                        <>
                            <Play size={20} fill="currentColor" /> RUN CODE
                        </>
                    )}
                </button>

                <button
                    onClick={() => window.location.reload()}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 py-2 rounded-lg font-semibold shadow transition active:scale-95 flex items-center justify-center gap-1"
                >
                    <RotateCcw size={18} /> Reset
                </button>



                <button
                    onClick={onHistoryClick}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-300 py-2 rounded-lg font-semibold shadow transition active:scale-95 flex items-center justify-center gap-1"
                    title="History"
                >
                    <History size={18} />
                </button>
            </div>
        </div>
    );
};

export default GameControls;
