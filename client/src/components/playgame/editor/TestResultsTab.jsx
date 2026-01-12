import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { FlaskConical, CheckCircle2, XCircle } from 'lucide-react';
import TestCaseItem from './TestCaseItem';

const TestResultsTab = ({ testCaseResult }) => {
    return (
        <TabsContent value="test" className="h-full m-0 p-0 absolute inset-0 z-10 data-[state=inactive]:hidden bg-stone-900 overflow-y-auto">
            {!testCaseResult ? (
                <div className="flex flex-col items-center justify-center h-full text-stone-500 gap-4">
                    <FlaskConical size={48} className="opacity-20" />
                    <p>Run code to see test results</p>
                </div>
            ) : (
                <div className="p-4 space-y-6 max-w-3xl mx-auto">
                    {/* Summary Header */}
                    <div className={`p-4 rounded-lg border ${testCaseResult.passed ? 'bg-green-900/20 border-green-900/50' : 'bg-red-900/20 border-red-900/50'} flex items-center gap-4`}>
                        <div className={`p-3 rounded-full ${testCaseResult.passed ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {testCaseResult.passed ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold ${testCaseResult.passed ? 'text-green-400' : 'text-red-400'}`}>
                                {testCaseResult.passed ? 'All Tests Passed' : 'Test Failed'}
                            </h3>
                            <p className="text-stone-400 text-sm">
                                {testCaseResult.message}
                            </p>
                        </div>
                    </div>

                    {/* Failed Tests */}
                    {testCaseResult.failedTests && testCaseResult.failedTests.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-red-400 font-semibold flex items-center gap-2">
                                <XCircle size={16} />
                                Failed Test Cases ({testCaseResult.failedTests.length})
                            </h4>
                            {testCaseResult.failedTests.map((test, index) => (
                                <TestCaseItem key={index} test={test} status="failed" />
                            ))}
                        </div>
                    )}

                    {/* Passed Tests */}
                    {testCaseResult.passedTests && testCaseResult.passedTests.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-green-400 font-semibold flex items-center gap-2">
                                <CheckCircle2 size={16} />
                                Passed Test Cases ({testCaseResult.passedTests.length})
                            </h4>
                            {testCaseResult.passedTests.map((test, index) => (
                                <TestCaseItem key={index} test={test} status="passed" />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </TabsContent>
    );
};

export default TestResultsTab;
