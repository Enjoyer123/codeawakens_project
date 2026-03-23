import { Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { toggleMute, isMuted, getVolume, setVolume } from '../../../gameutils/sound/soundManager';

const GlobalVolumeButton = () => {
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
        if (val > 0 && muted) {
            setMutedState(toggleMute());
        }
    };

    return (
        <div className="fixed bottom-5 right-5 z-[9999] group flex items-center justify-center">
            <button
                onClick={handleToggleMute}
                className={`w-11 h-11 rounded-full font-semibold shadow-lg transition active:scale-95 flex items-center justify-center ${muted ? 'bg-red-900/80 hover:bg-red-800 text-red-200' : 'bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200'}`}
                title={muted ? "เปิดเสียง" : "ปิดเสียง"}
            >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* Popover Slider */}
            <div className="absolute bottom-full right-0 pb-2 hidden group-hover:flex flex-col z-50 min-w-[140px]">
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
    );
};

export default GlobalVolumeButton;
