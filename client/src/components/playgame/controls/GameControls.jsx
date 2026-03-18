import { History, Play, Bug, FolderOpen, Loader2, Volume2, VolumeX } from 'lucide-react';
import { playSound, toggleMute, isMuted, getVolume, setVolume } from '../../../gameutils/sound/soundManager';
import { useState } from 'react';

const GameControls = ({
    runCode,
    gameState,
    blocklyLoaded,
    isRunning,
    isGameOver,
    codeValidation,
    currentLevel,
    onHistoryClick,
    onLoadXml,
    onShowDebugCode,
    isPreview,
    isAdmin
}) => {
    const [muted, setMutedState] = useState(isMuted());
    const [volume, setVolState] = useState(getVolume());

    const handleToggleMute = () => {
        const newMuted = toggleMute();
        setMutedState(newMuted);
    };

    const handleVolumeChange = (e) => {
        const val = parseFloat(e.target.value);
        setVolState(val);
        setVolume(val);
        // Automatically unmute if setting volume > 0 and it was muted
        if (val > 0 && muted) {
            setMutedState(toggleMute());
        }
    };

    const isRunDisabled =
        gameState === "running" ||
        !blocklyLoaded ||
        isRunning ||
        isGameOver ||
        (currentLevel?.textcode && !blocklyLoaded) ||
        (currentLevel?.textcode && (!codeValidation || !codeValidation.isValid));

    return (
        <div className="flex-none bg-[#1e1b4b] border-t border-purple-900/50 shadow-xl z-20 p-4">
            <div className="grid grid-cols-5 gap-2">
                <button
                    onClick={() => { playSound('run'); runCode(); }}
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

                {(isPreview || isAdmin) && onLoadXml && (
                    <button
                        onClick={onLoadXml}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold shadow transition active:scale-95 flex items-center justify-center gap-1"
                        title="โหลดตัวอย่าง XML"
                    >
                        <FolderOpen size={18} /> Load XML
                    </button>
                )}

                {(isPreview || isAdmin) && onShowDebugCode && (
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

                <div className="col-span-1 relative group flex items-center justify-center">
                    <button
                        onClick={handleToggleMute}
                        className={`w-full h-full py-2 rounded-lg font-semibold shadow transition active:scale-95 flex items-center justify-center gap-1 ${muted ? 'bg-red-900/50 hover:bg-red-800/80 text-red-200' : 'bg-emerald-800/60 hover:bg-emerald-700/80 text-emerald-200'}`}
                        title={muted ? "เปิดเสียง" : "ปิดเสียง"}
                    >
                        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    
                    {/* Popover Slider Wrapper (touches button to maintain hover state) */}
                    <div className="absolute bottom-full right-0 pb-2 hidden group-hover:flex flex-col z-50 min-w-[140px] transition-all">
                        {/* Actual Popover Box */}
                        <div className="bg-[#2e1065] px-4 py-3 rounded-lg shadow-2xl border border-purple-500/50">
                            <label className="text-xs text-purple-200 mb-2 whitespace-nowrap font-bold block">
                                ระดับเสียง: {Math.round(volume * 100)}%
                            </label>
                            <input 
                                type="range" 
                                min="0" max="1" step="0.05" 
                                value={volume}
                                onChange={handleVolumeChange}
                                className="w-full h-1.5 bg-purple-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameControls;
