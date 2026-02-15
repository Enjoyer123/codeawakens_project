import React from 'react';
import { History, Loader2, Play, FolderOpen, Bug } from 'lucide-react';

const GameControls = ({
    runCode,
    gameState,
    blocklyLoaded,
    isRunning,
    isGameOver,
    blocklyJavaScriptReady,
    codeValidation,
    currentLevel,
    onHistoryClick,
    onLoadXml,
    onShowDebugCode,
    isPreview
}) => {
    const isRunDisabled =
        gameState === "running" ||
        !blocklyLoaded ||
        isRunning ||
        isGameOver ||
        (currentLevel?.textcode && !blocklyJavaScriptReady) ||
        (currentLevel?.textcode && (!codeValidation || !codeValidation.isValid));

    return (
        <div className="flex-none bg-[#1e1b4b] border-t border-purple-900/50 shadow-xl z-20 p-4">
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

                {isPreview && onLoadXml && (
                    <button
                        onClick={onLoadXml}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold shadow transition active:scale-95 flex items-center justify-center gap-1"
                        title="โหลดตัวอย่าง XML"
                    >
                        <FolderOpen size={18} /> Load XML
                    </button>
                )}

                {isPreview && onShowDebugCode && (
                    <button
                        onClick={onShowDebugCode}
                        className="bg-amber-700 hover:bg-amber-600 text-amber-100 py-2 rounded-lg font-semibold shadow transition active:scale-95 flex items-center justify-center gap-1"
                        title="ดู Raw Generated Code (Runtime)"
                    >
                        <Bug size={18} />
                    </button>
                )}

                <button
                    onClick={onHistoryClick}
                    className="bg-[#2e1065] hover:bg-[#4c1d95] text-purple-200 py-2 rounded-lg font-semibold shadow transition active:scale-95 flex items-center justify-center gap-1"
                    title="History"
                >
                    <History size={18} />
                </button>
            </div>
        </div>
    );
};

export default GameControls;
