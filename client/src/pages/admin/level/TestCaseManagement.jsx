import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import { LoadingState, EmptyState } from '@/components/admin/tableStates/DataTableStates';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import { Edit, Trash2, Plus, Terminal } from 'lucide-react';
import { fetchTestCasesByLevel, createTestCase, updateTestCase, deleteTestCase } from '../../../services/testCaseService';
import { fetchLevelById } from '../../../services/levelService';

const TestCaseManagement = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { levelId } = useParams();
  const numericLevelId = parseInt(levelId, 10);

  const [level, setLevel] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog & Form States
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
  const [saveError, setSaveError] = useState(null);

  // Delete States
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testCaseToDelete, setTestCaseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const loadLevel = useCallback(async () => {
    try {
      const data = await fetchLevelById(getToken, numericLevelId);
      setLevel(data);
    } catch (err) {
      console.error('Failed to load level', err);
    }
  }, [getToken, numericLevelId]);

  const loadTestCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTestCasesByLevel(getToken, numericLevelId);
      setTestCases(data || []);
    } catch (err) {
      setError('Failed to load test cases. ' + (err.message || ''));
      setTestCases([]);
    } finally {
      setLoading(false);
    }
  }, [getToken, numericLevelId]);

  useEffect(() => {
    loadLevel();
    loadTestCases();
  }, [loadLevel, loadTestCases]);

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
    setSaveError(null);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingTestCase(null);
    setSaveError(null);
  }, []);

  const handleSave = useCallback(async () => {
    setSaveError(null);

    // Validation
    if (!formData.test_case_name.trim()) {
      setSaveError('กรุณากรอกชื่อ Test Case');
      return;
    }
    if (!formData.function_name.trim()) {
      setSaveError('กรุณากรอกชื่อ Function');
      return;
    }

    let parsedInput, parsedOutput;
    try {
      parsedInput = JSON.parse(formData.input_params);
    } catch (e) {
      setSaveError('Input Params ต้องเป็น JSON ที่ถูกต้อง');
      return;
    }
    try {
      parsedOutput = JSON.parse(formData.expected_output);
    } catch (e) {
      setSaveError('Expected Output ต้องเป็น JSON ที่ถูกต้อง');
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
        await updateTestCase(getToken, editingTestCase.test_case_id, payload);
      } else {
        await createTestCase(getToken, payload);
      }
      handleCloseDialog();
      await loadTestCases();
    } catch (err) {
      setSaveError('ไม่สามารถบันทึก Test Case ได้: ' + (err.message || 'Unknown error'));
    }
  }, [editingTestCase, getToken, formData, numericLevelId, handleCloseDialog, loadTestCases]);

  const handleDeleteClick = useCallback((testCase) => {
    setTestCaseToDelete(testCase);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!testCaseToDelete) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteTestCase(getToken, testCaseToDelete.test_case_id);
      setDeleteDialogOpen(false);
      setTestCaseToDelete(null);
      await loadTestCases();
    } catch (err) {
      setDeleteError('ไม่สามารถลบ Test Case ได้: ' + (err.message || 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  }, [testCaseToDelete, getToken, loadTestCases]);

  const tableHeaderClassName = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const tableCellClassName = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
  const actionsCellClassName = 'px-6 py-4 whitespace-nowrap text-sm font-medium';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title={`Test Cases: ${level?.level_name || levelId}`}
          subtitle="จัดการ Test Cases สำหรับการตรวจสอบความถูกต้องของโค้ด"
          backPath="/admin/levels"
          onAddClick={() => handleOpenDialog()}
          addButtonText="เพิ่ม Test Case"
        />

        <ErrorAlert message={error} />
        <ErrorAlert message={deleteError} />

        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-4">
          {loading ? (
            <LoadingState message="Loading test cases..." />
          ) : testCases.length === 0 ? (
            <EmptyState message="ยังไม่มี Test Case สำหรับด่านนี้" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={tableHeaderClassName}>Name</th>
                    <th className={tableHeaderClassName}>Function</th>
                    <th className={tableHeaderClassName}>Type</th>
                    <th className={tableHeaderClassName}>Primary</th>
                    <th className={tableHeaderClassName}>Order</th>
                    <th className={tableHeaderClassName}>Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {testCases.map((tc) => (
                    <tr key={tc.test_case_id} className="hover:bg-gray-50">
                      <td className={tableCellClassName}>
                        <div className="font-medium">{tc.test_case_name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                          In: {JSON.stringify(tc.input_params)}
                        </div>
                      </td>
                      <td className={tableCellClassName}>
                        <Badge variant="outline" className="font-mono">
                          {tc.function_name}
                        </Badge>
                      </td>
                      <td className={tableCellClassName}>
                        <Badge variant="secondary">{tc.comparison_type}</Badge>
                      </td>
                      <td className={tableCellClassName}>
                        {tc.is_primary ? (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                            Primary
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className={tableCellClassName}>{tc.display_order}</td>
                      <td className={actionsCellClassName}>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(tc)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            แก้ไข
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(tc)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            ลบ
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit Dialog */}
        {dialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto pt-10 pb-10">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 space-y-4 my-auto">
              <h2 className="text-lg font-semibold border-b pb-2">
                {editingTestCase ? 'แก้ไข Test Case' : 'เพิ่ม Test Case ใหม่'}
              </h2>
              
              <ErrorAlert message={saveError} />

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
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                      value={formData.function_name}
                      onChange={e => setFormData({ ...formData, function_name: e.target.value })}
                      placeholder="e.g. SORT"
                    />
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
                      Expected Output (JSON)
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono h-[120px]"
                      value={formData.expected_output}
                      onChange={e => setFormData({ ...formData, expected_output: e.target.value })}
                      placeholder='[1, 2, 3]'
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium mb-1">Comparison Type</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={formData.comparison_type}
                      onChange={e => setFormData({ ...formData, comparison_type: e.target.value })}
                    >
                      <option value="exact">Exact Match</option>
                      <option value="contains">Contains</option>
                      <option value="array_equals">Array Equals (Order insensitive)</option>
                      <option value="number_equals">Number Equals</option>
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

              <div className="flex justify-end gap-2 pt-4 border-t mt-2">
                <Button variant="outline" onClick={handleCloseDialog}>
                  ยกเลิก
                </Button>
                <Button onClick={handleSave}>
                  <Plus className="h-4 w-4 mr-2" />
                  บันทึก
                </Button>
              </div>
            </div>
          </div>
        )}

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => !deleting && setDeleteDialogOpen(open)}
          onConfirm={handleDeleteConfirm}
          itemName={testCaseToDelete?.test_case_name}
          title="ยืนยันการลบ Test Case"
          description={
            <>
              คุณแน่ใจหรือไม่ว่าต้องการลบ Test Case <strong>{testCaseToDelete?.test_case_name}</strong>?
            </>
          }
          deleting={deleting}
        />
      </div>
    </div>
  );
};

export default TestCaseManagement;
