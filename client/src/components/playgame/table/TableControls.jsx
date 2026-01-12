import React from 'react';
import { Play, Pause, FastForward, Gauge } from 'lucide-react';

const TableControls = ({ playback }) => {
    const { isPlaying, setIsPlaying, speedMs, setSpeedMs, progress, totalSteps, onNextStep } = playback;

    return (
        <div className="flex flex-col gap-2 p-2 bg-stone-900/50 border-t border-gray-800">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`p-2 rounded-full transition-all ${isPlaying ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'}`}
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                        onClick={onNextStep}
                        disabled={isPlaying || progress >= totalSteps}
                        className="p-2 bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:bg-gray-700 transition-all"
                        title="Next Step"
                    >
                        <FastForward size={16} />
                    </button>
                </div>

                <div className="flex items-center gap-2 flex-1">
                    <Gauge size={14} className="text-gray-400" />
                    <input
                        type="range"
                        min="50"
                        max="1000"
                        step="50"
                        value={speedMs}
                        onChange={(e) => setSpeedMs(Number(e.target.value))}
                        className="flex-1 accent-blue-500 h-1"
                    />
                    <span className="text-[10px] text-gray-400 font-mono w-12 text-right">{speedMs}ms</span>
                </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span>PROGRESS</span>
                <span>{progress} / {totalSteps}</span>
            </div>
            <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${(progress / Math.max(1, totalSteps)) * 100}%` }}
                />
            </div>
        </div>
    );
};

export default TableControls;
