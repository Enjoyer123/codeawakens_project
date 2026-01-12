import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

const TestCaseItem = ({ test, status }) => {
    const isPassed = status === 'passed';

    return (
        <div className={`rounded-lg p-4 border space-y-3 ${isPassed
                ? 'bg-stone-800/50 border-green-900/10'
                : 'bg-stone-800 border-red-900/30'
            }`}>
            <div className={`flex items-center justify-between border-b pb-2 ${isPassed ? 'border-stone-700/50' : 'border-stone-700'
                }`}>
                <span className={`font-mono text-sm ${isPassed ? 'text-stone-300' : 'text-red-300'}`}>
                    {test.test_case_name}
                </span>
                {isPassed ? (
                    <span className="text-green-500 text-[10px] font-bold px-2 py-0.5 bg-green-900/20 rounded border border-green-900/30">
                        PASSED
                    </span>
                ) : (
                    test.is_primary && (
                        <span className="text-[10px] bg-red-900/40 text-red-300 px-2 py-0.5 rounded border border-red-800/50">
                            PRIMARY
                        </span>
                    )
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-stone-500 font-bold tracking-wider">Example Input</label>
                    <div className="bg-stone-900 p-2 rounded text-xs font-mono text-stone-300 overflow-x-auto">
                        {test.input ? JSON.stringify(test.input, null, 2) : 'No input data'}
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-stone-500 font-bold tracking-wider">Expected Output</label>
                    <div className="bg-stone-900 p-2 rounded text-xs font-mono text-green-300/80 overflow-x-auto">
                        {JSON.stringify(test.expected, null, 2)}
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] uppercase text-stone-500 font-bold tracking-wider">Actual Output</label>
                <div className={`p-2 rounded text-xs font-mono border overflow-x-auto ${isPassed
                        ? 'bg-green-950/20 text-green-300 border-green-900/20'
                        : 'bg-red-950/30 text-red-300 border-red-900/30'
                    }`}>
                    {test.actual === undefined ? 'undefined' : JSON.stringify(test.actual, null, 2)}
                </div>
            </div>
        </div>
    );
};

export default TestCaseItem;
