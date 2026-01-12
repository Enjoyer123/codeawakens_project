import React from 'react';
import GenericGridTable from './GenericGridTable';

const AntDpTable = ({
    isVisible,
    table,
    dims,
    sugarGrid,
    start,
    goal,
    playback,
    currentStep,
    cellSize,
    setCellSize
}) => {
    if (!isVisible) return null;

    const cols = Array.from({ length: dims.cols }, (_, j) => j);
    const rowLabels = Array.from({ length: dims.rows }, (_, i) => String(i));

    const renderCurrentStepInfo = (step) => (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
            <span className="text-yellow-300 font-mono">cell: [{step.i}][{step.j}] = {String(step.value)}</span>
            {step.sugar !== undefined && <span className="text-gray-300 font-mono">sugar: {step.sugar}</span>}
            {step.bestFrom !== undefined && <span className="text-green-300 font-mono">from: ({step.bestFrom.r},{step.bestFrom.c})</span>}
        </div>
    );

    const renderCell = (cell, isActive) => {
        const i = currentStep?.i;
        const j = currentStep?.j;

        // Special rendering for Ant DP? 
        // For now, keep it simple but maybe show sugar count if it's the base grid
        return cell === null || cell === undefined ? '·' : String(cell);
    };

    return (
        <GenericGridTable
            title="Ant Path DP Table"
            playback={playback}
            currentStep={currentStep}
            tableData={table}
            headers={{ corner: 'R \\ C', cols }}
            rowLabels={rowLabels}
            renderCurrentStepInfo={renderCurrentStepInfo}
            renderCell={renderCell}
        />
    );
};

export default AntDpTable;
