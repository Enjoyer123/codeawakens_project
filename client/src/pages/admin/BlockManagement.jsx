import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllBlocks,
  createBlock,
  updateBlock,
  deleteBlock,
} from '../../services/blockService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog';
import AdminPageHeader from '@/components/shared/AdminPageHeader';
import SearchInput from '@/components/shared/SearchInput';
import ErrorAlert from '@/components/shared/ErrorAlert';
import PaginationControls from '@/components/shared/PaginationControls';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import BlockFormDialog from '@/components/admin/BlockFormDialog';
import { usePagination } from '@/hooks/usePagination';
import { createDeleteErrorMessage } from '@/utils/errorHandler';

const blockCategories = [
  { value: 'movement', label: 'Movement' },
  { value: 'logic', label: 'Logic' },
  { value: 'conditions', label: 'Conditions' },
  { value: 'loops', label: 'Loops' },
  { value: 'functions', label: 'Functions' },
  { value: 'variables', label: 'Variables' },
  { value: 'operators', label: 'Operators' },
];

const BlockManagement = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { page, rowsPerPage, handlePageChange } = usePagination(1, 10);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 10,
  });

  // Block form states
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [blockForm, setBlockForm] = useState({
    block_key: '',
    block_name: '',
    description: '',
    category: 'movement',
    blockly_type: '',
    is_available: true,
    syntax_example: '',
  });
  const [saveError, setSaveError] = useState(null);

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const loadBlocks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllBlocks(getToken, page, rowsPerPage, searchQuery);
      setBlocks(data.blocks || []);
      setPagination(data.pagination || {
        total: 0,
        totalPages: 0,
        page: 1,
        limit: rowsPerPage,
      });
    } catch (err) {
      setError('Failed to load blocks. ' + (err.message || ''));
      setBlocks([]);
      setPagination({
        total: 0,
        totalPages: 0,
        page: 1,
        limit: rowsPerPage,
      });
    } finally {
      setLoading(false);
    }
  }, [getToken, page, rowsPerPage, searchQuery]);

  // Load blocks when page or search changes
  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    handlePageChange(1);
  }, [handlePageChange]);

  const handleOpenBlockDialog = useCallback((block = null) => {
    if (block) {
      setEditingBlock(block);
      setBlockForm({
        block_key: block.block_key,
        block_name: block.block_name,
        description: block.description || '',
        category: block.category,
        blockly_type: block.blockly_type || '',
        is_available: block.is_available,
        syntax_example: block.syntax_example || '',
      });
    } else {
      setEditingBlock(null);
      setBlockForm({
        block_key: '',
        block_name: '',
        description: '',
        category: 'movement',
        blockly_type: '',
        is_available: true,
        syntax_example: '',
      });
    }
    setSaveError(null);
    setBlockDialogOpen(true);
  }, []);

  const handleCloseBlockDialog = useCallback(() => {
    setBlockDialogOpen(false);
    setEditingBlock(null);
    setSaveError(null);
    setBlockForm({
      block_key: '',
      block_name: '',
      description: '',
      category: 'movement',
      blockly_type: '',
      is_available: true,
      syntax_example: '',
    });
  }, []);

  const handleSaveBlock = useCallback(async () => {
    setSaveError(null);
    
    const formData = {
      ...blockForm,
      block_key: blockForm.block_key.trim(),
      block_name: blockForm.block_name.trim(),
      description: blockForm.description?.trim() || null,
      blockly_type: blockForm.blockly_type?.trim() || null,
      syntax_example: blockForm.syntax_example?.trim() || null,
    };

    try {
      if (editingBlock) {
        await updateBlock(getToken, editingBlock.block_id, formData);
      } else {
        await createBlock(getToken, formData);
      }
      handleCloseBlockDialog();
      await loadBlocks();
      return { success: true };
    } catch (err) {
      const errorMessage = 'ไม่สามารถบันทึก block ได้: ' + (err.message || 'Unknown error');
      setSaveError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [blockForm, editingBlock, getToken, handleCloseBlockDialog, loadBlocks]);

  const handleDeleteClick = useCallback((block) => {
    setBlockToDelete(block);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!blockToDelete) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteBlock(getToken, blockToDelete.block_id);
      setDeleteDialogOpen(false);
      setBlockToDelete(null);
      await loadBlocks();
    } catch (err) {
      const errorMessage = createDeleteErrorMessage('block', err);
      setDeleteError(errorMessage);
    } finally {
      setDeleting(false);
    }
  }, [blockToDelete, getToken, loadBlocks]);

  const handleDeleteDialogChange = useCallback((open) => {
    if (!deleting) {
      setDeleteDialogOpen(open);
      if (!open) {
        setBlockToDelete(null);
        setDeleteError(null);
      }
    }
  }, [deleting]);

  const getCategoryBadgeColor = (category) => {
    const colors = {
      movement: 'bg-blue-100 text-blue-800',
      logic: 'bg-purple-100 text-purple-800',
      conditions: 'bg-green-100 text-green-800',
      loops: 'bg-yellow-100 text-yellow-800',
      functions: 'bg-pink-100 text-pink-800',
      variables: 'bg-indigo-100 text-indigo-800',
      operators: 'bg-orange-100 text-orange-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getDeleteDescription = (blockName) => 
    `คุณแน่ใจหรือไม่ว่าต้องการลบบล็อก "${blockName}"? การกระทำนี้ไม่สามารถยกเลิกได้`;

  const tableHeaderClassName = 
    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const tableCellClassName = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
  const actionsCellClassName = 'px-6 py-4 whitespace-nowrap text-sm font-medium';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title="Block Management"
          subtitle="จัดการบล็อก"
          onAddClick={() => handleOpenBlockDialog()}
          addButtonText="เพิ่มบล็อก"
        />

        <ErrorAlert message={error} />
        <ErrorAlert message={saveError} />
        <ErrorAlert message={deleteError} />

        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="ค้นหาบล็อก (key, name, description)..."
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <LoadingState message="Loading blocks..." />
          ) : blocks.length === 0 ? (
            <EmptyState 
              message="ไม่พบข้อมูลบล็อก"
              searchQuery={searchQuery}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className={tableHeaderClassName}>Block ID</th>
                      <th className={tableHeaderClassName}>Block Key</th>
                      <th className={tableHeaderClassName}>Block Name</th>
                      <th className={tableHeaderClassName}>Category</th>
                      <th className={tableHeaderClassName}>Blockly Type</th>
                      <th className={tableHeaderClassName}>Available</th>
                      <th className={tableHeaderClassName}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {blocks.map((block) => (
                      <tr key={block.block_id} className="hover:bg-gray-50">
                        <td className={tableCellClassName}>
                          {block.block_id}
                        </td>
                        <td className={`${tableCellClassName} font-medium`}>
                          {block.block_key}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {block.block_name}
                        </td>
                        <td className={tableCellClassName}>
                          <Badge className={getCategoryBadgeColor(block.category)}>
                            {blockCategories.find(c => c.value === block.category)?.label || block.category}
                          </Badge>
                        </td>
                        <td className={`${tableCellClassName} text-gray-500`}>
                          {block.blockly_type || '-'}
                        </td>
                        <td className={tableCellClassName}>
                          <Badge variant={block.is_available ? 'default' : 'secondary'}>
                            {block.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                        </td>
                        <td className={actionsCellClassName}>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenBlockDialog(block)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(block)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                currentPage={page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                rowsPerPage={rowsPerPage}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>

        <BlockFormDialog
          open={blockDialogOpen}
          onOpenChange={handleCloseBlockDialog}
          editingBlock={editingBlock}
          formData={blockForm}
          onFormChange={setBlockForm}
          onSave={handleSaveBlock}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={handleDeleteDialogChange}
          onConfirm={handleDeleteConfirm}
          title="ยืนยันการลบบล็อก"
          description={getDeleteDescription(blockToDelete?.block_name)}
          confirmText="ลบ"
          cancelText="ยกเลิก"
          isLoading={deleting}
        />
      </div>
    </div>
  );
};

export default BlockManagement;
