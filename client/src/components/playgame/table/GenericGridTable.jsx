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
        <div
            className={`absolute transition-all duration-300 z-[9999] flex flex-col ${isMinimized
                ? 'top-4 right-4 w-64 h-12'
                : 'top-4 right-4 w-[380px] h-[250px]'
                }`}
        >
            {/* Background Layer */}
            <div
                className="absolute -inset-2 z-[-1] rounded-xl shadow-2xl transition-all duration-300"
                style={{
                    backgroundImage: `url('/scoreccl1.png')`,
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center'
                }}
            />

            {/* Content Container (Inner Box) */}
            <div className={`relative w-full h-full flex flex-col rounded-xl overflow-hidden ${isMinimized ? '' : 'border border-amber-900/10'}`}>
                {/* Header */}
                <div className="flex-none px-4 py-2 flex items-center justify-between border-b border-amber-900/20">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider truncate mr-4 font-serif">
                        {title}
                    </span>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="text-amber-900/60 hover:text-amber-900 transition-colors"
                    >
                        {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                    </button>
                </div>

                {!isMinimized && (
                    <>
                        {/* Status Info */}
                        <div className="flex-none border-b border-amber-900/10 px-4 py-3 bg-amber-900/5">
                            {currentStep ? (
                                <div className="text-xs">
                                    {renderCurrentStepInfo(currentStep)}
                                </div>
                            ) : (
                                <div className="text-xs text-amber-900/50 italic font-serif">
                                    Ready to play...
                                </div>
                            )}
                        </div>

                        {/* Table Content */}
                        <div className="flex-1 overflow-auto relative custom-scrollbar">
                            <div className="p-4">
                                <table className="border-collapse font-mono text-[11px] w-full">
                                    <thead>
                                        <tr>
                                            <th className="sticky top-0 left-0 z-20 bg-amber-100/90 border border-amber-900/20 p-1 text-amber-900 font-bold shadow-sm">
                                                {corner}
                                            </th>
                                            {cols.map((col, j) => (
                                                <th key={j} className="sticky top-0 bg-amber-100/80 border border-amber-900/20 p-1 text-amber-800/80 min-w-[30px]">
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rowLabels.map((label, i) => (
                                            <tr key={i}>
                                                <th className="sticky left-0 z-10 bg-amber-100/80 border border-amber-900/20 p-1 text-amber-900 font-bold text-left whitespace-nowrap min-w-[60px]">
                                                    {label}
                                                </th>
                                                {tableData[i]?.map((cell, j) => {
                                                    const isActive = currentStep?.i === i && currentStep?.j === j;
                                                    return (
                                                        <td
                                                            key={j}
                                                            className={`border border-amber-900/20 p-1 text-center transition-all duration-200 ${isActive
                                                                ? 'bg-amber-900 text-amber-50 font-bold scale-110 shadow-md ring-1 ring-amber-700'
                                                                : 'text-amber-900/70 hover:bg-amber-900/5'
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
        </div>
    );
};

export default GenericGridTable;
