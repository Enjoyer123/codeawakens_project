import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
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

const TestCaseManagement = () => {
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const { levelId } = useParams();
    const numericLevelId = parseInt(levelId, 10);

    // TanStack Query Hooks
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

    // Derived State
    const testCases = testCasesData || [];

    // Dialog & Form States

    // Dialog & Form States
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTestCase, setEditingTestCase] = useState(null);
    const [formData, setFormData] = useState({
        test_case_name: '',
        function_name: '',
        input_params: '',
        expected_output: '',
        comparison_type: 'exact',
        is_primary: false,
        display_order: 0,
    });
    const [testCaseToDelete, setTestCaseToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // No manual load effects needed

    const handleOpenDialog = useCallback((testCase = null) => {
        if (testCase) {
            setEditingTestCase(testCase);
            setFormData({
                test_case_name: testCase.test_case_name || '',
                function_name: testCase.function_name || '',
                input_params: JSON.stringify(testCase.input_params, null, 2),
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
                input_params: '{}',
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
            input_params: '{}',
            expected_output: '[]',
            comparison_type: 'exact',
            is_primary: false,
            display_order: 0,
        });
    }, []);

    const handleSave = useCallback(async () => {

        // Validation
        if (!formData.test_case_name.trim()) {
            toast.error('กรุณากรอกชื่อ Test Case');
            return;
        }
        if (!formData.function_name.trim()) {
            toast.error('กรุณากรอกชื่อ Function');
            return;
        }

        let parsedInput, parsedOutput;
        try {
            parsedInput = JSON.parse(formData.input_params);
        } catch (e) {
            toast.error('Input Params ต้องเป็น JSON ที่ถูกต้อง');
            return;
        }
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Test Case Name</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        value={formData.test_case_name}
                                        onChange={e => setFormData({ ...formData, test_case_name: e.target.value })}
                                        placeholder="e.g. Simple Sort"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Function Name</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                                        value={formData.function_name}
                                        onChange={e => setFormData({ ...formData, function_name: e.target.value })}
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
                                            <option value="ANTDP">ANTDP (Ant Colony)</option>
                                        </optgroup>
                                        <optgroup label="Other Algorithms">
                                            <option value="SOLVE">SOLVE (N-Queen)</option>
                                            <option value="SOLVEROPE">SOLVEROPE (Rope Partition)</option>
                                            <option value="MAXCAPACITY">MAXCAPACITY (Max Flow)</option>
                                        </optgroup>
                                    </select>
                                    <p className="text-xs text-muted-foreground text-gray-500 mt-1">
                                        Select the function name that corresponds to the Algorithm Block used in this level.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Input Params (JSON)
                                    </label>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono h-[120px]"
                                        value={formData.input_params}
                                        onChange={e => setFormData({ ...formData, input_params: e.target.value })}
                                        placeholder='{"arr": [3, 1, 2]}'
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Expected Output
                                    </label>
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
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono h-[120px]"
                                            value={typeof formData.expected_output === 'string' ? formData.expected_output : JSON.stringify(formData.expected_output, null, 2)}
                                            onChange={(e) => setFormData({ ...formData, expected_output: e.target.value })}
                                            placeholder='[1, 2, 3]'
                                        />
                                    )}
                                    {formData.comparison_type !== 'boolean_equals' && formData.comparison_type !== 'number_equals' && (
                                        <p className="text-xs text-gray-500 mt-1">Accepts valid JSON format (e.g. [1, 2] or 40.5)</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 items-end">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Comparison Type</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        value={formData.comparison_type}
                                        onChange={(e) => {
                                            const newType = e.target.value;
                                            let newOutput = formData.expected_output;

                                            // Auto-reset expected output based on target type
                                            if (newType === 'boolean_equals') {
                                                newOutput = 'true';
                                            } else if (newType === 'number_equals') {
                                                // Try to parse existing as number, else reset to 0
                                                const num = parseFloat(newOutput);
                                                newOutput = isNaN(num) ? '0' : String(num);
                                            } else if (newType === 'array_equals') {
                                                // Switching to Array Equals -> Ensure it looks like an array
                                                if (!newOutput || newOutput === 'true' || newOutput === 'false') {
                                                    newOutput = '[]';
                                                } else if (!newOutput.trim().startsWith('[')) {
                                                    // Wrap scalar (like '0' or '10.5') in array
                                                    newOutput = `[${newOutput}]`;
                                                }
                                            } else {
                                                // Switching to Exact Match (JSON) -> 0 or scalars are fine
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
                                <div className="pb-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_primary}
                                            onChange={e => setFormData({ ...formData, is_primary: e.target.checked })}
                                        />
                                        <span className="text-sm font-medium">Primary Test Case</span>
                                    </label>
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
        </div >
    );
};

export default TestCaseManagement;
