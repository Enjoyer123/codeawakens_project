import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Algorithm Sub-Forms
import CoinChangeForm from '../algo_forms/CoinChangeForm';
import KnapsackForm from '../algo_forms/KnapsackForm';
import SubsetSumForm from '../algo_forms/SubsetSumForm';
import NQueenForm from '../algo_forms/NQueenForm';
import EmeiForm from '../algo_forms/EmeiForm';

/**
 * AlgoDataForm — form-based editor for algorithm-specific level data
 * Uses algo_data.type to render the specific sub-form.
 * data = algo_data.payload
 */
const AlgoDataForm = ({ algoType, data, onChange, showAlert }) => {
    const [showJson, setShowJson] = useState(false);
    const [jsonString, setJsonString] = useState('');
    const [jsonError, setJsonError] = useState(null);

    const handleJsonToggle = () => {
        if (!showJson) {
            setJsonString(JSON.stringify(data, null, 2));
            setJsonError(null);
        }
        setShowJson(!showJson);
    };

    const handleJsonChange = (e) => {
        const val = e.target.value;
        setJsonString(val);
        try {
            const parsed = JSON.parse(val);
            setJsonError(null);
            onChange(parsed);
        } catch {
            setJsonError("Invalid JSON");
        }
    };

    // Shared Header
    const header = (
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase">{algoType}</h3>
            <Button variant="ghost" size="sm" onClick={handleJsonToggle} className="text-[10px] text-gray-400">
                {showJson ? 'Form View' : 'JSON View'}
            </Button>
        </div>
    );

    // JSON View (Fallback/Advanced editor)
    if (showJson) {
        return (
            <div className="space-y-2">
                {header}
                <textarea
                    value={jsonString}
                    onChange={handleJsonChange}
                    className={`w-full h-64 font-mono text-xs p-3 border rounded-md ${jsonError ? 'border-red-300' : 'border-gray-300'}`}
                    spellCheck="false"
                />
                {jsonError && <p className="text-xs text-red-500">{jsonError}</p>}
            </div>
        );
    }

    // Dynamic Form Rendering
    const forms = {
        'COINCHANGE': <CoinChangeForm data={data} onChange={onChange} showAlert={showAlert} />,
        'KNAPSACK': <KnapsackForm data={data} onChange={onChange} showAlert={showAlert} />,
        'SUBSETSUM': <SubsetSumForm data={data} onChange={onChange} showAlert={showAlert} />,
        'NQUEEN': <NQueenForm data={data} onChange={onChange} showAlert={showAlert} />,
        'EMEI': <EmeiForm data={data} onChange={onChange} showAlert={showAlert} />
    };

    const SpecificForm = forms[algoType];

    return (
        <div className="space-y-4">
            {algoType !== 'EMEI' && header}
            {SpecificForm ? SpecificForm : (
                <>
                    {algoType === 'EMEI' && header}
                    <p className="text-xs text-gray-400">Unknown algorithm type. Use JSON View to edit.</p>
                </>
            )}
        </div>
    );
};

export default AlgoDataForm;
