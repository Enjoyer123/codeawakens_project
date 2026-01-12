import React from 'react';
import GenericGridTable from './GenericGridTable';

const CoinChangeTable = ({ isVisible, table, coins, amount, playback, currentStep }) => {
    if (!isVisible) return null;

    const cols = Array.from({ length: Math.max(1, amount + 1) }, (_, j) => j);

    const rowLabels = coins.map((coin, i) =>
        `${i}: ${String(coin)}`
    );
    if (rowLabels.length === 0) rowLabels.push('0');

    const renderCurrentStepInfo = (step) => (
        <span className="text-yellow-300 font-mono">
            cell: [{step.i}][{step.j}] = {step.value === null ? '·' : String(step.value)}
        </span>
    );

    const renderCell = (cell, isActive) => {
        return cell === null || cell === undefined ? '·' : String(cell);
    };

    return (
        <GenericGridTable
            title="Coin Change Table (i, amount)"
            playback={playback}
            currentStep={currentStep}
            tableData={table}
            headers={{ corner: 'i \\ amt', cols }}
            rowLabels={rowLabels}
            renderCurrentStepInfo={renderCurrentStepInfo}
            renderCell={renderCell}
        />
    );
};

export default CoinChangeTable;
