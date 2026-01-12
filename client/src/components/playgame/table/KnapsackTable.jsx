import React from 'react';
import GenericGridTable from './GenericGridTable';

const KnapsackTable = ({ isVisible, table, items, capacity, playback, currentStep }) => {
    if (!isVisible) return null;

    // Prepare headers
    const cols = Array.from({ length: Math.max(1, capacity + 1) }, (_, j) => j);

    // Prepare row labels
    const rowLabels = items.map((item, i) =>
        `${item.label || `item ${i}`} (w:${item.weight ?? '?'}, v:${item.price ?? '?'})`
    );

    // Fallback for empty table
    if (rowLabels.length === 0) rowLabels.push('item 0');

    const renderCurrentStepInfo = (step) => (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
            <span className="text-yellow-300 font-mono">cell: [{step.i}][{step.j}] = {String(step.value)}</span>
            {step.valWithout !== undefined && <span className="text-gray-300 font-mono">without: {String(step.valWithout)}</span>}
            {step.valWith !== undefined && <span className="text-gray-300 font-mono">with: {String(step.valWith)}</span>}
            {step.chosen && <span className="text-green-300 font-mono">chosen: {step.chosen}</span>}
        </div>
    );

    return (
        <GenericGridTable
            title="Knapsack Table (i, j)"
            playback={playback}
            currentStep={currentStep}
            tableData={table}
            headers={{ corner: 'i \\ j', cols }}
            rowLabels={rowLabels}
            renderCurrentStepInfo={renderCurrentStepInfo}
        />
    );
};

export default KnapsackTable;
