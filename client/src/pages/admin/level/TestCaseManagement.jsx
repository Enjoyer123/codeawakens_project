import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import { Plus } from 'lucide-react';
import { useTestCasesByLevel, useCreateTestCase, useUpdateTestCase, useDeleteTestCase } from '../../../services/hooks/useTestCases';
import { useLevel } from '../../../services/hooks/useLevel';
import TestCaseTable from '@/components/admin/level/TestCaseTable';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import PageError from '@/components/shared/Error/PageError';

// =========================================================================
// Config: ฟิลด์ที่ต้องกรอกสำหรับแต่ละ Algorithm type
// key ใน fields ต้องตรงกับที่ buildTestLevelData ใน algoTestRunner.js ใช้
// =========================================================================
const ALGO_INPUT_CONFIG = {
    // Graph Algorithms
    DFS: {
        label: 'Graph Traversal', fields: [
            { key: 'edges', label: 'Edges', type: 'json_array', placeholder: '[[0,1],[0,2],[1,3]]', hint: 'Array of [from, to] or [from, to, weight]' },
            { key: 'start', label: 'Start Node', type: 'number', placeholder: '0' },
            { key: 'goal', label: 'Goal Node', type: 'number', placeholder: '3' },
        ]
    },
    BFS: {
        label: 'Graph Traversal', fields: [
            { key: 'edges', label: 'Edges', type: 'json_array', placeholder: '[[0,1],[0,2],[1,3]]', hint: 'Array of [from, to] or [from, to, weight]' },
            { key: 'start', label: 'Start Node', type: 'number', placeholder: '0' },
            { key: 'goal', label: 'Goal Node', type: 'number', placeholder: '3' },
        ]
    },
    DIJ: {
        label: 'Dijkstra', fields: [
            { key: 'edges', label: 'Edges', type: 'json_array', placeholder: '[[0,1,4],[0,2,1],[2,1,2]]', hint: 'Array of [from, to, weight]' },
            { key: 'start', label: 'Start Node', type: 'number', placeholder: '0' },
            { key: 'goal', label: 'Goal Node', type: 'number', placeholder: '3' },
        ]
    },
    PRIM: {
        label: 'Prim MST', fields: [
            { key: 'edges', label: 'Edges', type: 'json_array', placeholder: '[[0,1,4],[0,2,1],[2,1,2]]', hint: 'Array of [from, to, weight]' },
            { key: 'start', label: 'Start Node', type: 'number', placeholder: '0' },
        ]
    },
    KRUSKAL: {
        label: 'Kruskal MST', fields: [
            { key: 'edges', label: 'Edges', type: 'json_array', placeholder: '[[0,1,4],[0,2,1],[2,1,2]]', hint: 'Array of [from, to, weight]' },
        ]
    },
    // Dynamic Programming
    KNAPSACK: {
        label: 'Knapsack', fields: [
            { key: 'items', label: 'Items', type: 'json_array', placeholder: '[{"weight":2,"price":3},{"weight":3,"price":4}]', hint: 'Array of {weight, price}' },
            { key: 'capacity', label: 'Capacity', type: 'number', placeholder: '5' },
        ]
    },
    COINCHANGE: {
        label: 'Coin Change', fields: [
            { key: 'warriors', label: 'Coins', type: 'json_array', placeholder: '[1, 3, 5]', hint: 'Array of coin denominations' },
            { key: 'monster_power', label: 'Target Amount', type: 'number', placeholder: '7' },
        ]
    },
    SUBSETSUM: {
        label: 'Subset Sum', fields: [
            { key: 'warriors', label: 'Warriors (weights)', type: 'json_array', placeholder: '[3, 1, 4, 2]', hint: 'Array of item weights' },
            { key: 'target_sum', label: 'Target Sum', type: 'number', placeholder: '5' },
        ]
    },
    // Other Algorithms
    SOLVE: {
        label: 'N-Queen', fields: [
            { key: 'n', label: 'Board Size (N)', type: 'number', placeholder: '4' },
        ]
    },
    MAXCAPACITY: {
        label: 'Max Flow (Emei)', fields: [
            { key: 'n', label: 'number of nodes', type: 'number', placeholder: '4' },
            { key: 'edges', label: 'Edges', type: 'json_array', placeholder: '[[0,1,10],[0,2,5],[1,3,8]]', hint: 'Array of [from, to, capacity]' },
            { key: 'start', label: 'Source Node', type: 'number', placeholder: '0' },
            { key: 'end', label: 'Sink Node', type: 'number', placeholder: '3' },
            { key: 'tourists', label: 'Tourists Count', type: 'number', placeholder: '20' },
        ]
    },
    SOLVEROPE: {
        label: 'Rope Partition', fields: [
            { key: 'lengths', label: 'Lengths', type: 'json_array', placeholder: '[5, 3, 8, 2]', hint: 'Array of rope segment lengths' },
        ]
    },
};

// =========================================================================
// Helper: สร้าง input_fields object ว่างๆ ตาม function_name
// =========================================================================
function buildEmptyFields(functionName) {
    const config = ALGO_INPUT_CONFIG[functionName];
    if (!config) return {};
    return Object.fromEntries(config.fields.map(f => [f.key, f.type === 'number' ? '0' : '']));
}

// =========================================================================
// Helper: แปลง input_params object (จาก DB) → input_fields สำหรับ Form
// =========================================================================
function paramsToFields(inputParams, functionName) {
    const config = ALGO_INPUT_CONFIG[functionName];
    if (!config || !inputParams) return buildEmptyFields(functionName);
    return Object.fromEntries(
        config.fields.map(f => {
            const val = inputParams[f.key];
            if (val === undefined || val === null) return [f.key, f.type === 'number' ? '0' : ''];
            if (f.type === 'json_array') return [f.key, JSON.stringify(val)];
            return [f.key, String(val)];
        })
    );
}

// =========================================================================
// Helper: แปลง input_fields (จาก Form) → input_params JSON สำหรับ save
// =========================================================================
function fieldsToParams(inputFields, functionName) {
    const config = ALGO_INPUT_CONFIG[functionName];
    if (!config) return {};
    const result = {};
    for (const f of config.fields) {
        const raw = inputFields[f.key];
        if (raw === undefined || raw === '' || raw === null) continue;
        if (f.type === 'number') {
            result[f.key] = parseFloat(raw);
        } else if (f.type === 'json_array') {
            result[f.key] = JSON.parse(raw); // will throw if invalid JSON — caught in handleSave
        }
    }
    return result;
}

// =========================================================================
// Sub-Component: ฟิลด์ Input ตาม Algorithm type
// =========================================================================
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
                📋 {config.label} — กรอกข้อมูลสำหรับ Test Case นี้
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

// =========================================================================
// Main Component
// =========================================================================
const TestCaseManagement = () => {

    const { levelId } = useParams();
    const numericLevelId = parseInt(levelId, 10);

    const { data: level } = useLevel(numericLevelId);
    const {
        data: testCasesData,
        isLoading: loading,
        isError,
        error: queryError
    } = useTestCasesByLevel(numericLevelId);

    if (isError) {
        return <PageError message={queryError?.message} title="Failed to load test cases" />;
    }

    const createTestCaseMutation = useCreateTestCase();
    const updateTestCaseMutation = useUpdateTestCase();
    const deleteTestCaseMutation = useDeleteTestCase();

    const testCases = testCasesData || [];

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTestCase, setEditingTestCase] = useState(null);
    const [formData, setFormData] = useState({
        test_case_name: '',
        function_name: '',
        input_fields: {},         // structured fields (replaces raw input_params string)
        expected_output: '[]',
        comparison_type: 'exact',
        is_primary: false,
        display_order: 0,
    });
    const [testCaseToDelete, setTestCaseToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const handleOpenDialog = useCallback((testCase = null) => {
        if (testCase) {
            setEditingTestCase(testCase);
            setFormData({
                test_case_name: testCase.test_case_name || '',
                function_name: testCase.function_name || '',
                input_fields: paramsToFields(testCase.input_params, testCase.function_name),
                expected_output: JSON.stringify(testCase.expected_output, null, 2),
                comparison_type: testCase.comparison_type || 'exact',
                is_primary: testCase.is_primary || false,
                display_order: testCase.display_order || 0,
            });
        } else {
            setEditingTestCase(null);
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
        setDialogOpen(true);
    }, []);

    const handleCloseDialog = useCallback(() => {
        setDialogOpen(false);
        setEditingTestCase(null);
        setFormData({
            test_case_name: '',
            function_name: '',
            input_fields: {},
            expected_output: '[]',
            comparison_type: 'exact',
            is_primary: false,
            display_order: 0,
        });
    }, []);

    // เมื่อ function_name เปลี่ยน → reset input fields ให้ตรงกับ type ใหม่
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

        // Assemble input_params from structured fields (skip if primary)
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
            handleCloseDialog();
        } catch (err) {
            toast.error('ไม่สามารถบันทึก Test Case ได้: ' + (err.message || 'Unknown error'));
        }
    }, [editingTestCase, formData, numericLevelId, updateTestCaseMutation, createTestCaseMutation, handleCloseDialog]);

    const handleDeleteClick = useCallback((testCase) => {
        setTestCaseToDelete(testCase);
        setDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!testCaseToDelete) return;
        try {
            setDeleting(true);
            await deleteTestCaseMutation.mutateAsync(testCaseToDelete.test_case_id);
            toast.success('ลบ Test Case สำเร็จ');
            setDeleteDialogOpen(false);
            setTestCaseToDelete(null);
        } catch (err) {
            toast.error('ไม่สามารถลบ Test Case ได้: ' + (err.message || 'Unknown error'));
        } finally {
            setDeleting(false);
        }
    }, [testCaseToDelete, deleteTestCaseMutation]);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <AdminPageHeader
                    title={`Test Cases: ${level?.level_name || levelId}`}
                    subtitle="จัดการ Test Cases สำหรับการตรวจสอบความถูกต้องของโค้ด"
                    backPath={`/admin/levels`}
                    onAddClick={() => handleOpenDialog()}
                    addButtonText="เพิ่ม Test Case"
                />

                <div className="bg-white rounded-lg shadow-md overflow-hidden mt-4">
                    {loading ? (
                        <LoadingState message="Loading test cases..." />
                    ) : testCases.length === 0 ? (
                        <EmptyState message="ยังไม่มี Test Case สำหรับด่านนี้" />
                    ) : (
                        <TestCaseTable
                            testCases={testCases}
                            onEdit={handleOpenDialog}
                            onDelete={handleDeleteClick}
                        />
                    )}
                </div>

                {/* Create/Edit Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                                            <option value="SOLVEROPE">SOLVEROPE (Rope Partition)</option>
                                            <option value="MAXCAPACITY">MAXCAPACITY (Max Flow)</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>

                            {/* Structured Input Fields (hidden when Primary) */}
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
                            <Button variant="outline" onClick={handleCloseDialog}>
                                ยกเลิก
                            </Button>
                            <Button onClick={handleSave}>
                                <Plus className="h-4 w-4 mr-2" />
                                บันทึก
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <DeleteConfirmDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    onConfirm={handleDeleteConfirm}
                    itemName={testCaseToDelete?.test_case_name}
                    title="ยืนยันการลบ Test Case"
                    deleting={deleting}
                />
            </div>
        </div>
    );
};

export default TestCaseManagement;
