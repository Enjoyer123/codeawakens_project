/**
 * AlgoPreview — lightweight visual preview for algo levels
 * Shows a representation of the algorithm data (warriors, items, etc.)
 * without needing the full Phaser canvas.
 */
const AlgoPreview = ({ algoKey, data, backgroundImageUrl }) => {
    const bgStyle = backgroundImageUrl ? {
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    } : {
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    };

    // --- CoinChange Preview ---
    if (algoKey === 'coin_change_data') {
        const warriors = (data?.warriors || []).filter(w => w != null);
        const mp = data?.monster_power;
        return (
            <div className="w-full h-full relative rounded-lg overflow-hidden" style={bgStyle}>
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative z-10 flex flex-col items-center justify-center h-full gap-8">
                    <h3 className="text-white/60 text-sm font-bold uppercase tracking-widest">Coin Change Preview</h3>
                    <div className="flex items-end gap-6">
                        {/* Warriors */}
                        <div className="flex gap-4">
                            {warriors.length > 0 ? warriors.map((w, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <div className="w-16 h-16 rounded-xl bg-blue-500/30 border-2 border-blue-400/50 flex items-center justify-center backdrop-blur-sm">
                                        <span className="text-2xl font-bold text-white">{w}</span>
                                    </div>
                                    <span className="text-xs text-white/50">Warrior {i + 1}</span>
                                </div>
                            )) : (
                                <p className="text-white/40 text-sm italic">No warriors configured</p>
                            )}
                        </div>

                        {/* VS */}
                        <div className="text-white/30 text-2xl font-bold mx-4">VS</div>

                        {/* Monster */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-20 h-20 rounded-xl bg-red-500/30 border-2 border-red-400/50 flex items-center justify-center backdrop-blur-sm">
                                <span className="text-3xl font-bold text-white">{mp ?? '?'}</span>
                            </div>
                            <span className="text-xs text-white/50">Monster</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Knapsack Preview ---
    if (algoKey === 'knapsack_data') {
        const items = (data?.items || []).filter(item => item?.weight != null || item?.price != null);
        const capacity = data?.capacity;
        return (
            <div className="w-full h-full relative rounded-lg overflow-hidden" style={bgStyle}>
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative z-10 flex flex-col items-center justify-center h-full gap-8">
                    <h3 className="text-white/60 text-sm font-bold uppercase tracking-widest">Knapsack Preview</h3>
                    <div className="flex items-end gap-8">
                        {/* Items */}
                        <div className="flex gap-3 flex-wrap justify-center max-w-md">
                            {items.length > 0 ? items.map((item, i) => (
                                <div key={i} className="flex flex-col items-center gap-1 bg-amber-500/20 border border-amber-400/40 rounded-lg p-3 backdrop-blur-sm">
                                    <span className="text-lg font-bold text-amber-300">{item.label || `Item ${i + 1}`}</span>
                                    <div className="flex gap-2 text-xs text-white/70">
                                        <span>{item.weight ?? '?'} kg</span>
                                        <span>•</span>
                                        <span>฿{item.price ?? '?'}</span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-white/40 text-sm italic">No items configured</p>
                            )}
                        </div>

                        {/* Bag */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-24 h-24 rounded-xl bg-green-500/20 border-2 border-green-400/40 flex flex-col items-center justify-center backdrop-blur-sm">
                                <span className="text-3xl">🎒</span>
                                <span className="text-sm font-bold text-green-300">{capacity ?? '?'} kg</span>
                            </div>
                            <span className="text-xs text-white/50">Bag</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- SubsetSum Preview ---
    if (algoKey === 'subset_sum_data') {
        const warriors = (data?.warriors_display || []).filter(w => w?.power != null);
        const target = data?.target_sum;
        return (
            <div className="w-full h-full relative rounded-lg overflow-hidden" style={bgStyle}>
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative z-10 flex flex-col items-center justify-center h-full gap-8">
                    <h3 className="text-white/60 text-sm font-bold uppercase tracking-widest">Subset Sum Preview</h3>
                    <div className="flex flex-col items-center gap-4">
                        <div className="bg-purple-500/20 border border-purple-400/40 rounded-lg px-6 py-3 backdrop-blur-sm">
                            <span className="text-sm text-white/60">Target Sum = </span>
                            <span className="text-2xl font-bold text-purple-300">{target ?? '?'}</span>
                        </div>
                        <div className="flex gap-3 flex-wrap justify-center max-w-lg">
                            {warriors.length > 0 ? warriors.map((w, i) => (
                                <div key={i} className="flex flex-col items-center gap-1">
                                    <div className="w-14 h-14 rounded-full bg-orange-500/30 border-2 border-orange-400/50 flex items-center justify-center backdrop-blur-sm">
                                        <span className="text-xl font-bold text-white">{w.power}</span>
                                    </div>
                                    <span className="text-[10px] text-white/40">{w.label || `#${i + 1}`}</span>
                                </div>
                            )) : (
                                <p className="text-white/40 text-sm italic">No warriors configured</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Applied/Emei Preview (keep PhaserMapEditor, but show summary) ---
    if (algoKey === 'applied_data') {
        const payload = data?.payload || {};
        return (
            <div className="w-full h-full relative rounded-lg overflow-hidden" style={bgStyle}>
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative z-10 flex flex-col items-center justify-center h-full gap-6">
                    <h3 className="text-white/60 text-sm font-bold uppercase tracking-widest">
                        {data?.type || 'Graph Algorithm'} Preview
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Nodes', value: payload.n },
                            { label: 'Tourists', value: payload.tourists },
                            { label: 'Start', value: payload.start },
                            { label: 'End', value: payload.end },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-center backdrop-blur-sm">
                                <div className="text-lg font-bold text-white">{value ?? '—'}</div>
                                <div className="text-[10px] text-white/50 uppercase">{label}</div>
                            </div>
                        ))}
                    </div>
                    <p className="text-white/30 text-xs">
                        ใช้ Graph Editor (node/edge) สำหรับวาดกราฟ →
                        <br />เปิดจาก tab Assets
                    </p>
                </div>
            </div>
        );
    }

    // Fallback
    return (
        <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
            <p className="text-gray-500 text-sm">No preview available</p>
        </div>
    );
};

export default AlgoPreview;
