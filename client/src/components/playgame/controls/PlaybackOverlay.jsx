import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward } from 'lucide-react';
import { animationController } from '../../../gameutils/algo/playback/AnimationController';

// Speed presets: label → multiplier
const SPEED_STEPS = [
    { label: '¼×', value: 0.25 },
    { label: '½×', value: 0.5 },
    { label: '1×', value: 1.0 },
    { label: '2×', value: 2.0 },
    { label: '4×', value: 4.0 },
];
const DEFAULT_SPEED_IDX = 2; // 1×

const PlaybackOverlay = ({ isRunning, isLegacy }) => {
    const [isPaused, setIsPaused] = useState(false);
    const [speedIdx, setSpeedIdx] = useState(DEFAULT_SPEED_IDX);

    useEffect(() => {
        const unsubscribe = animationController.subscribe(({ isPaused: paused }) => {
            setIsPaused(paused);
        });
        return unsubscribe;
    }, []);

    const handlePauseToggle = () => {
        if (!isRunning) return;
        if (isPaused) {
            animationController.resume();
        } else {
            animationController.pause();
        }
    };

    const handleStep = () => {
        if (!isRunning) return;
        animationController.step();
    };

    const handleSpeedChange = (e) => {
        const idx = Number(e.target.value);
        setSpeedIdx(idx);
        animationController.setSpeed(SPEED_STEPS[idx].value);
    };

    if (isLegacy) {
        return (
            <div className="flex items-center w-full h-full">
                <div className="bg-[#18113c]/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-gray-700/40 shadow-xl flex w-full h-full items-center justify-center transition-all">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1 drop-shadow-sm">SYS STATE</span>
                        <span className="text-xs font-bold text-gray-500/80 tracking-widest">LEGACY SYSTEM</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center w-full h-full">
            <div className="bg-[#18113c]/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-purple-500/40 shadow-[0_0_20px_rgba(139,92,246,0.2)] flex w-full h-full items-center justify-between gap-3 transition-all hover:border-purple-400">

                {/* Status Indicator */}
                <div className="flex flex-col border-r border-purple-500/30 pr-4 justify-center shrink-0">
                    <span className="text-[10px] text-purple-300 font-bold tracking-wider uppercase mb-0.5 drop-shadow-sm">SYS STATE</span>
                    <span className={`text-xs font-bold ${!isRunning ? 'text-gray-500' : isPaused ? 'text-yellow-400' : 'text-green-400 animate-pulse'}`}>
                        {!isRunning ? 'IDLE' : isPaused ? 'PAUSED' : 'PLAYING'}
                    </span>
                </div>

                {/* Speed Slider */}
                <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between w-full px-0.5">
                        <span className="text-[9px] text-purple-300/70 font-bold tracking-wider uppercase">SPEED</span>
                        <span className="text-[11px] font-bold text-purple-200 tabular-nums">
                            {SPEED_STEPS[speedIdx].label}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={SPEED_STEPS.length - 1}
                        step={1}
                        value={speedIdx}
                        onChange={handleSpeedChange}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-purple-400"
                        style={{
                            background: `linear-gradient(to right, #a78bfa ${(speedIdx / (SPEED_STEPS.length - 1)) * 100}%, #374151 ${(speedIdx / (SPEED_STEPS.length - 1)) * 100}%)`
                        }}
                        title={`Speed: ${SPEED_STEPS[speedIdx].label}`}
                    />
                    {/* Tick marks */}
                    <div className="flex justify-between w-full px-0">
                        {SPEED_STEPS.map((s, i) => (
                            <span
                                key={i}
                                className={`text-[8px] font-bold transition-colors ${i === speedIdx ? 'text-purple-300' : 'text-gray-600'}`}
                            >
                                {s.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 shrink-0">
                    {/* Play/Pause */}
                    <button
                        onClick={handlePauseToggle}
                        disabled={!isRunning}
                        className={`relative group w-11 h-11 flex items-center justify-center rounded-full shadow-lg transition-all active:scale-95 border-2 ${!isRunning ? 'bg-gray-800/80 border-gray-700 text-gray-500 opacity-50 cursor-not-allowed' :
                            isPaused
                                ? 'bg-gradient-to-tr from-[#4ade80] to-[#22c55e] border-[#86efac] shadow-[0_0_15px_rgba(74,222,128,0.4)]'
                                : 'bg-gradient-to-tr from-[#facc15] to-[#eab308] border-[#fde047] shadow-[0_0_15px_rgba(250,204,21,0.4)]'
                            }`}
                        title={!isRunning ? 'Idle' : isPaused ? 'Resume' : 'Pause'}
                    >
                        {!isRunning ? (
                            <Play size={20} className="text-gray-500 ml-1" fill="currentColor" />
                        ) : isPaused ? (
                            <Play size={20} className="text-emerald-950 ml-1" fill="currentColor" />
                        ) : (
                            <Pause size={20} className="text-yellow-950" fill="currentColor" />
                        )}
                    </button>

                    {/* Step */}
                    <button
                        onClick={handleStep}
                        disabled={!isRunning || !isPaused}
                        className={`relative group w-9 h-9 flex items-center justify-center rounded-full shadow-md transition-all active:scale-95 border-2 ${isRunning && isPaused
                            ? 'bg-gradient-to-tr from-[#60a5fa] to-[#3b82f6] border-[#93c5fd] shadow-[0_0_10px_rgba(96,165,250,0.4)] hover:brightness-110 cursor-pointer text-blue-950'
                            : 'bg-gray-800/80 border-gray-700 text-gray-500 opacity-50 cursor-not-allowed'
                            }`}
                        title="Next Step"
                    >
                        <SkipForward size={16} fill={isRunning && isPaused ? 'currentColor' : 'none'} />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PlaybackOverlay;
