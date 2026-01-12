import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Maximize2, Minimize2 } from 'lucide-react';
import TableControls from './TableControls';

const GenericGridTable = ({
    title,
    playback,
    currentStep,
    tableData,
    headers,
    rowLabels,
    renderCurrentStepInfo,
    renderCell
}) => {
    const [isMinimized, setIsMinimized] = useState(false);

    if (!tableData) return null;

    const { corner, cols } = headers;

    const defaultRenderCell = (cell, isActive) => {
        if (cell === null || cell === undefined) return '·';
        return String(cell);
    };

    const finalRenderCell = renderCell || defaultRenderCell;

    return (
        <div className={`absolute transition-all duration-300 z-[9999] border border-gray-700 bg-gray-900 shadow-2xl rounded-xl overflow-hidden flex flex-col ${isMinimized
            ? 'top-4 right-4 w-64 h-12'
            : 'top-4 right-4 w-[400px] h-[280px]'
            }`}>
            {/* Header */}
            <div className="flex-none bg-gray-950 px-4 py-2 flex items-center justify-between border-b border-gray-800">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider truncate mr-4">
                    {title}
                </span>
                <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="text-gray-500 hover:text-white transition-colors"
                >
                    {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>
            </div>

            {!isMinimized && (
                <>
                    {/* Status Info */}
                    <div className="flex-none bg-stone-900 border-b border-gray-800 px-4 py-3">
                        {currentStep ? (
                            <div className="text-xs">
                                {renderCurrentStepInfo(currentStep)}
                            </div>
                        ) : (
                            <div className="text-xs text-gray-500 italic">
                                Ready to play...
                            </div>
                        )}
                    </div>

                    {/* Table Content */}
                    <div className="flex-1 overflow-auto relative">
                        <div className="p-4">
                            <table className="border-collapse font-mono text-[11px]">
                                <thead>
                                    <tr>
                                        <th className="sticky top-0 left-0 z-20 bg-gray-950 border border-gray-800 p-1 text-gray-400">
                                            {corner}
                                        </th>
                                        {cols.map((col, j) => (
                                            <th key={j} className="sticky top-0 bg-gray-950 border border-gray-800 p-1 text-gray-500 min-w-[30px]">
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rowLabels.map((label, i) => (
                                        <tr key={i}>
                                            <th className="sticky left-0 z-10 bg-gray-950 border border-gray-800 p-1 text-blue-500 text-left whitespace-nowrap min-w-[60px]">
                                                {label}
                                            </th>
                                            {tableData[i]?.map((cell, j) => {
                                                const isActive = currentStep?.i === i && currentStep?.j === j;
                                                return (
                                                    <td
                                                        key={j}
                                                        className={`border border-gray-800 p-1 text-center transition-all duration-200 ${isActive
                                                            ? 'bg-yellow-500/30 text-yellow-200 font-bold scale-110'
                                                            : 'text-gray-400'
                                                            }`}
                                                    >
                                                        {finalRenderCell(cell, isActive)}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Controls */}
                    <TableControls playback={playback} />
                </>
            )}
        </div>
    );
};

export default GenericGridTable;
