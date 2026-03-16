import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ALGO_INPUT_CONFIG, buildEmptyFields, paramsToFields, fieldsToParams } from '@/components/admin/utils/testCaseUtils';
import { useCreateTestCase, useUpdateTestCase } from '../../../services/hooks/useTestCases';

// Sub-Component: ฟิลด์ Input ตาม Algorithm type
function AlgoInputFields({ functionName, inputFields, onChange }) {
    const config = ALGO_INPUT_CONFIG[functionName];
    if (!config) {
        return (
            <p className="text-sm text-gray-400 italic">
                เลือก Function Name ก่อนเพื่อดูฟิลด์ที่ต้องกรอก
            </p>
        );
    }

    return (
        <div className="grid gap-3">
            <p className="text-xs text-blue-700 font-medium bg-blue-50 rounded px-2 py-1">
                {config.label} — กรอกข้อมูลสำหรับ Test Case นี้
            </p>
            {config.fields.map(field => (
                <div key={field.key}>
                    <label className="block text-sm font-medium mb-1">
                        {field.label}
                        {field.hint && <span className="text-xs text-gray-400 ml-2">({field.hint})</span>}
                    </label>
                    {field.type === 'json_array' ? (
                        <textarea
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono h-[80px]"
                            value={inputFields[field.key] ?? ''}
                            onChange={e => onChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                        />
                    ) : (
                        <input
                            type="number"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            value={inputFields[field.key] ?? '0'}
                            onChange={e => onChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

const TestCaseFormDialog = ({ open, onOpenChange, editingTestCase, numericLevelId, onClose }) => {
    const createTestCaseMutation = useCreateTestCase();
    const updateTestCaseMutation = useUpdateTestCase();

    const [formData, setFormData] = useState({
        test_case_name: '',
        function_name: '',
        input_fields: {},
        expected_output: '[]',
        comparison_type: 'exact',
        is_primary: false,
        display_order: 0,
    });

    // Reset formData when dialog opens or editingTestCase changes
    useEffect(() => {
        if (open) {
            if (editingTestCase) {
                setFormData({
                    test_case_name: editingTestCase.test_case_name || '',
                    function_name: editingTestCase.function_name || '',
                    input_fields: paramsToFields(editingTestCase.input_params, editingTestCase.function_name),
                    expected_output: typeof editingTestCase.expected_output === 'string'
                        ? editingTestCase.expected_output
                        : JSON.stringify(editingTestCase.expected_output, null, 2),
                    comparison_type: editingTestCase.comparison_type || 'exact',
                    is_primary: editingTestCase.is_primary || false,
                    display_order: editingTestCase.display_order || 0,
                });
            } else {
                setFormData({
                    test_case_name: '',
                    function_name: '',
                    input_fields: {},
                    expected_output: '[]',
                    comparison_type: 'exact',
                    is_primary: false,
                    display_order: 0,
                });
            }
        }
    }, [open, editingTestCase]);

    const handleFunctionNameChange = useCallback((newFn) => {
        setFormData(prev => ({
            ...prev,
            function_name: newFn,
            input_fields: buildEmptyFields(newFn),
        }));
    }, []);

    const handleFieldChange = useCallback((key, value) => {
        setFormData(prev => ({
            ...prev,
            input_fields: { ...prev.input_fields, [key]: value },
        }));
    }, []);

    const handleSave = useCallback(async () => {
        if (!formData.test_case_name.trim()) {
            toast.error('กรุณากรอกชื่อ Test Case');
            return;
        }
        if (!formData.function_name.trim()) {
            toast.error('กรุณากรอกชื่อ Function');
            return;
        }

        let parsedInput = {};
        if (!formData.is_primary) {
            try {
                parsedInput = fieldsToParams(formData.input_fields, formData.function_name);
            } catch (e) {
                toast.error('ข้อมูล Input มี JSON ที่ไม่ถูกต้อง กรุณาตรวจสอบ Array fields');
                return;
            }
        }

        let parsedOutput;
        try {
            parsedOutput = JSON.parse(formData.expected_output);
        } catch (e) {
            toast.error('Expected Output ต้องเป็น JSON ที่ถูกต้อง');
            return;
        }

        const payload = {
            level_id: numericLevelId,
            test_case_name: formData.test_case_name.trim(),
            function_name: formData.function_name.trim(),
            input_params: parsedInput,
            expected_output: parsedOutput,
            comparison_type: formData.comparison_type,
            is_primary: formData.is_primary,
            display_order: parseInt(formData.display_order) || 0,
        };

        try {
            if (editingTestCase) {
                await updateTestCaseMutation.mutateAsync({
                    testCaseId: editingTestCase.test_case_id,
                    data: payload
                });
                toast.success('อัปเดต Test Case สำเร็จ');
            } else {
                await createTestCaseMutation.mutateAsync(payload);
                toast.success('เพิ่ม Test Case สำเร็จ');
            }
            onClose();
        } catch (err) {
            toast.error('ไม่สามารถบันทึก Test Case ได้: ' + (err.message || 'Unknown error'));
        }
    }, [editingTestCase, formData, numericLevelId, updateTestCaseMutation, createTestCaseMutation, onClose]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editingTestCase ? 'แก้ไข Test Case' : 'เพิ่ม Test Case ใหม่'}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4">
                    {/* Primary Toggle */}
                    <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100 mb-2">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${formData.is_primary ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                <Plus className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-blue-900">Primary Test Case</p>
                                <p className="text-xs text-blue-700">เทสเคสหลักที่ใช้ข้อมูลจากสิ่งที่วางบนด่านโดยตรง</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={formData.is_primary}
                                onChange={e => {
                                    setFormData({ ...formData, is_primary: e.target.checked });
                                }}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {/* Name & Function */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Test Case Name</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                value={formData.test_case_name}
                                onChange={e => setFormData({ ...formData, test_case_name: e.target.value })}
                                placeholder="e.g. Simple Run"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Function Name</label>
                            <select
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                                value={formData.function_name}
                                onChange={e => handleFunctionNameChange(e.target.value)}
                            >
                                <option value="">Select Function...</option>
                                <optgroup label="Graph Theory">
                                    <option value="DFS">DFS (Depth First Search)</option>
                                    <option value="BFS">BFS (Breadth First Search)</option>
                                    <option value="DIJ">DIJ (Dijkstra)</option>
                                    <option value="PRIM">PRIM (Minimum Spanning Tree)</option>
                                    <option value="KRUSKAL">KRUSKAL (Minimum Spanning Tree)</option>
                                </optgroup>
                                <optgroup label="Dynamic Programming">
                                    <option value="KNAPSACK">KNAPSACK</option>
                                    <option value="COINCHANGE">COINCHANGE</option>
                                    <option value="SUBSETSUM">SUBSETSUM</option>
                                </optgroup>
                                <optgroup label="Other Algorithms">
                                    <option value="SOLVE">SOLVE (N-Queen)</option>
                                    <option value="MAXCAPACITY">MAXCAPACITY (Max Flow)</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>

                    {/* Structured Input Fields */}
                    {!formData.is_primary ? (
                        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Input Parameters</p>
                            <AlgoInputFields
                                functionName={formData.function_name}
                                inputFields={formData.input_fields}
                                onChange={handleFieldChange}
                            />
                        </div>
                    ) : (
                        <div className="border border-dashed border-blue-200 rounded-lg p-3 bg-blue-50 text-center">
                            <p className="text-sm text-blue-600">
                                🎯 Primary test case — ข้อมูลจะถูกดึงจากสิ่งที่วางบนด่านโดยอัตโนมัติ
                            </p>
                        </div>
                    )}

                    {/* Expected Output */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Expected Output</label>
                        {formData.comparison_type === 'boolean_equals' ? (
                            <select
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                value={formData.expected_output === 'true' || formData.expected_output === true ? 'true' : 'false'}
                                onChange={(e) => setFormData({ ...formData, expected_output: e.target.value })}
                            >
                                <option value="true">True</option>
                                <option value="false">False</option>
                            </select>
                        ) : formData.comparison_type === 'number_equals' ? (
                            <input
                                type="number"
                                step="any"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                value={formData.expected_output}
                                onChange={(e) => setFormData({ ...formData, expected_output: e.target.value })}
                                placeholder="e.g. 10.5"
                            />
                        ) : (
                            <textarea
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono h-[100px]"
                                value={typeof formData.expected_output === 'string' ? formData.expected_output : JSON.stringify(formData.expected_output, null, 2)}
                                onChange={(e) => setFormData({ ...formData, expected_output: e.target.value })}
                                placeholder='[1, 2, 3]'
                            />
                        )}
                        {formData.comparison_type !== 'boolean_equals' && formData.comparison_type !== 'number_equals' && (
                            <p className="text-xs text-gray-500 mt-1">Accepts valid JSON format (e.g. [1, 2] or 40.5)</p>
                        )}
                    </div>

                    {/* Comparison Type & Display Order */}
                    <div className="grid grid-cols-2 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium mb-1">Comparison Type</label>
                            <select
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                value={formData.comparison_type}
                                onChange={(e) => {
                                    const newType = e.target.value;
                                    let newOutput = formData.expected_output;
                                    if (newType === 'boolean_equals') newOutput = 'true';
                                    else if (newType === 'number_equals') {
                                        const num = parseFloat(newOutput);
                                        newOutput = isNaN(num) ? '0' : String(num);
                                    } else if (newType === 'array_equals') {
                                        if (!newOutput || newOutput === 'true' || newOutput === 'false') newOutput = '[]';
                                        else if (!newOutput.trim().startsWith('[')) newOutput = `[${newOutput}]`;
                                    } else {
                                        if (!newOutput || newOutput === 'true' || newOutput === 'false') newOutput = '{}';
                                    }
                                    setFormData({ ...formData, comparison_type: newType, expected_output: newOutput });
                                }}
                            >
                                <option value="exact">Exact Match (JSON)</option>
                                <option value="array_equals">Array Equals (Order insensitive)</option>
                                <option value="number_equals">Number Equals</option>
                                <option value="boolean_equals">Boolean Equals</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Display Order</label>
                            <input
                                type="number"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                value={formData.display_order}
                                onChange={e => setFormData({ ...formData, display_order: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        ยกเลิก
                    </Button>
                    <Button onClick={handleSave}>
                        <Plus className="h-4 w-4 mr-2" />
                        บันทึก
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TestCaseFormDialog;
