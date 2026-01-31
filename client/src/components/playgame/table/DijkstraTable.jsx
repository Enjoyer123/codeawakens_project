import React, { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

const DijkstraTable = ({ isVisible, visited, pq, mstWeight, algorithmName }) => {
    const [isMinimized, setIsMinimized] = useState(false);

    if (!isVisible) return null;

    return (

        <div className={`absolute top-2 right-2 z-[9999] transition-all duration-300 ${isMinimized ? 'w-64' : 'max-w-sm w-full'}`}>
            {/* Background Layer */}
            <div
                className="absolute -inset-3 z-[-1]"
                style={{
                    backgroundImage: `url('/scoreccl1.png')`,
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center'
                }}
            />

            {/* Content Container */}
            <div className={`rounded-lg transition-all duration-300 ${isMinimized ? 'p-2' : 'p-3'}`}>
                <div className="text-amber-900 font-bold text-sm mb-3 flex items-center justify-between border-b border-amber-900/20 pb-2">
                    <span className="truncate">📊 {algorithmName} State</span>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="text-amber-900/60 hover:text-amber-900 transition-colors ml-2"
                    >
                        {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                </div>

                {!isMinimized && (
                    <>
                        {/* Visited Row */}
                        <div className="mb-3">
                            <div className="text-amber-900 font-bold text-xs mb-1 flex items-center gap-1">
                                <span>✅ Visited:</span>
                            </div>
                            <div className="bg-amber-950/80 rounded-md p-2 min-h-[40px] max-h-[80px] overflow-y-auto border border-amber-900/30">
                                {visited.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {visited.map((node, index) => (
                                            <span
                                                key={index}
                                                className="bg-amber-800 text-amber-50 px-2 py-1 rounded shadow-sm text-xs font-mono border border-amber-700"
                                            >
                                                {node}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-amber-200/50 text-xs italic">ว่าง</span>
                                )}
                            </div>
                        </div>

                        {/* Priority Queue Row */}
                        <div className="mb-1">
                            <div className="text-amber-900 font-bold text-xs mb-1 flex items-center gap-1">
                                <span>📋 Priority Queue (PQ):</span>
                            </div>
                            <div className="bg-amber-950/80 rounded-md p-2 min-h-[60px] max-h-[200px] overflow-y-auto border border-amber-900/30">
                                {pq.length > 0 ? (
                                    <div className="space-y-1">
                                        {pq.map((item, index) => {
                                            // PQ format: [distance, path]
                                            const distance = Array.isArray(item) && item.length > 0 ? item[0] : '?';
                                            const path = Array.isArray(item) && item.length > 1 ? item[1] : [];
                                            const pathStr = Array.isArray(path) ? path.join('→') : String(path);

                                            return (
                                                <div
                                                    key={index}
                                                    className="bg-amber-900/60 px-2 py-1.5 rounded border border-amber-700/50 text-xs flex justify-between items-center shadow-sm"
                                                >
                                                    <span className="text-amber-100 font-mono font-medium truncate max-w-[180px]" title={pathStr}>
                                                        {pathStr}
                                                    </span>
                                                    <span className="bg-amber-700 text-amber-50 px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-600">
                                                        {distance}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <span className="text-amber-200/50 text-xs italic">ว่าง</span>
                                )}
                            </div>
                        </div>

                        {/* MST Weight Row */}
                        {(algorithmName === 'Prim' || algorithmName === 'Kruskal' || algorithmName === 'MST') && (
                            <div className="mt-3">
                                <div className="text-amber-900 font-bold text-xs mb-1 flex items-center gap-1">
                                    <span>⚖️ MST Weight:</span>
                                </div>
                                <div className="bg-amber-950/80 rounded p-2 min-h-[30px] flex items-center border border-amber-900/30">
                                    <span className="text-amber-400 font-bold font-mono text-lg">
                                        {mstWeight}
                                    </span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default DijkstraTable;
