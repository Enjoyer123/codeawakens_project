import React from 'react';

const DijkstraTable = ({ isVisible, visited, pq, mstWeight, algorithmName }) => {
    if (!isVisible) return null;

    return (
        <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-90 border-2 border-yellow-500 rounded-lg p-3 z-[9999] max-w-md" style={{ position: 'absolute' }}>
            <div className="text-yellow-400 font-bold text-sm mb-2 flex items-center gap-2">
                <span>📊 {algorithmName} Algorithm State</span>
            </div>

            {/* Visited Row */}
            <div className="mb-3">
                <div className="text-green-400 font-semibold text-xs mb-1 flex items-center gap-1">
                    <span>✅ Visited:</span>
                </div>
                <div className="bg-gray-800 rounded p-2 min-h-[40px] max-h-[80px] overflow-y-auto">
                    {visited.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {visited.map((node, index) => (
                                <span
                                    key={index}
                                    className="bg-green-600 text-white px-2 py-1 rounded text-xs font-mono"
                                >
                                    {node}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-gray-500 text-xs italic">ว่าง</span>
                    )}
                </div>
            </div>

            {/* Priority Queue Row */}
            <div className="mb-3">
                <div className="text-blue-400 font-semibold text-xs mb-1 flex items-center gap-1">
                    <span>📋 Priority Queue (PQ):</span>
                </div>
                <div className="bg-gray-800 rounded p-2 min-h-[60px] max-h-[200px] overflow-y-auto">
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
                                        className="bg-blue-900 bg-opacity-50 border border-blue-500 rounded p-1 text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-yellow-300 font-bold font-mono min-w-[40px]">
                                                d:{distance}
                                            </span>
                                            <span className="text-blue-300 font-mono">
                                                path: [{pathStr}]
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <span className="text-gray-500 text-xs italic">ว่าง</span>
                    )}
                </div>
            </div>

            {/* MST Weight Row - แสดงเฉพาะในด่าน Prim/Kruskal */}
            {(algorithmName === 'Prim' || algorithmName === 'Kruskal' || algorithmName === 'MST') && (
                <div>
                    <div className="text-purple-400 font-semibold text-xs mb-1 flex items-center gap-1">
                        <span>⚖️ MST Weight:</span>
                    </div>
                    <div className="bg-gray-800 rounded p-2 min-h-[30px] flex items-center">
                        <span className="text-purple-300 font-bold font-mono text-lg">
                            {mstWeight}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DijkstraTable;
