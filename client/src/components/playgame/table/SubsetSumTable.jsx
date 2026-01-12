import React from 'react';
import GenericGridTable from './GenericGridTable';

const SubsetSumTable = ({ isVisible, table, warriors, targetSum, playback, currentStep }) => {
    if (!isVisible) return null;

    const cols = Array.from({ length: Math.max(1, targetSum + 1) }, (_, j) => j);

    const rowLabels = warriors.map((w, i) =>
        `${i}: ${String(w)}`
    );
    if (rowLabels.length === 0) rowLabels.push('0');

    const renderCurrentStepInfo = (step) => (
        <span className="text-yellow-300 font-mono">
            cell: [{step.i}][{step.j}] = {step.value === null ? '·' : (step.value ? 'T' : 'F')}
        </span>
    );

    const renderCell = (cell, isActive) => {
        return cell === null || cell === undefined ? '·' : (cell ? 'T' : 'F');
    };

    return (
        <GenericGridTable
            title="Subset Sum Table (i, sum)"
            playback={playback}
            currentStep={currentStep}
            tableData={table}
            headers={{ corner: 'i \\ sum', cols }}
            rowLabels={rowLabels}
            renderCurrentStepInfo={renderCurrentStepInfo}
            renderCell={renderCell}
        />
    );
};

export default SubsetSumTable;
