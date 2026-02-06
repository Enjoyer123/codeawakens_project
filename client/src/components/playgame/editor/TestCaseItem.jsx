import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

const TestCaseItem = ({ test, status }) => {
    const isPassed = status === 'passed';

    return (
        <div className={`rounded-lg p-4 border space-y-3 ${isPassed
            ? 'bg-purple-900/10 border-green-500/20'
            : 'bg-purple-900/10 border-red-500/20'
            }`}>
            <div className={`flex items-center justify-between border-b pb-2 ${isPassed ? 'border-purple-500/10' : 'border-purple-500/20'
                }`}>
                <span className={`font-mono text-sm ${isPassed ? 'text-purple-100' : 'text-red-300'}`}>
                    {test.test_case_name}
                </span>
                {isPassed ? (
                    <span className="text-green-500 text-[10px] font-bold px-2 py-0.5 bg-green-500/10 rounded border border-green-500/20">
                        PASSED
                    </span>
                ) : (
                    test.is_primary && (
                        <span className="text-[10px] bg-red-500/10 text-red-300 px-2 py-0.5 rounded border border-red-500/20">
                            PRIMARY
                        </span>
                    )
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-purple-400 font-bold tracking-wider">Example Input</label>
                    <div className="bg-[#0f111a] p-2 rounded text-xs font-mono text-purple-200/80 overflow-x-auto border border-purple-500/10">
                        {test.input ? JSON.stringify(test.input, null, 2) : 'No input data'}
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-purple-400 font-bold tracking-wider">Expected Output</label>
                    <div className="bg-[#0f111a] p-2 rounded text-xs font-mono text-green-400/80 overflow-x-auto border border-purple-500/10">
                        {JSON.stringify(test.expected, null, 2)}
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] uppercase text-purple-400 font-bold tracking-wider">Actual Output</label>
                <div className={`p-2 rounded text-xs font-mono border overflow-x-auto ${isPassed
                    ? 'bg-green-500/5 text-green-400 border-green-500/10'
                    : 'bg-red-500/5 text-red-400 border-red-500/10'
                    }`}>
                    {test.actual === undefined ? 'undefined' : JSON.stringify(test.actual, null, 2)}
                </div>
            </div>
        </div>
    );
};

export default TestCaseItem;
