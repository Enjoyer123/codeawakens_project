import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { usePatterns, useDeletePattern } from '@/services/hooks/usePattern';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Trash2, Loader, Pencil, Puzzle } from 'lucide-react';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import PatternInfoDialog from '@/components/admin/pattern/PatternInfoDialog';
import ContentLoader from '@/components/shared/Loading/ContentLoader';

const PatternListDialog = ({ open, onOpenChange, levelId, levelName }) => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patternToDelete, setPatternToDelete] = useState(null);

  // Info Edit State
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [patternToEditInfo, setPatternToEditInfo] = useState(null);

  // Use TanStack Query hooks
  const { data: patternsData, isLoading, error: queryError } = usePatterns(levelId);
  const deletePatternMutation = useDeletePattern();

  const patterns = patternsData?.patterns || [];
  const error = queryError ? 'Failed to load patterns: ' + queryError.message : null;

  const handleDeleteClick = (pattern) => {
    setPatternToDelete(pattern);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!patternToDelete) return;

    try {
      await deletePatternMutation.mutateAsync(patternToDelete.pattern_id);
      setDeleteDialogOpen(false);
      setPatternToDelete(null);
    } catch (err) {
      console.error('Error deleting pattern:', err);
      // Optional: show toast error
    }
  };

  const handleAddPattern = () => {
    setPatternToEditInfo(null); // Create mode
    setInfoDialogOpen(true);
  };

  const handleEditPatternLogic = (patternId) => {
    navigate(`/admin/levels/${levelId}/patterns/${patternId}/edit`);
  };

  const handleEditInfo = (patternId) => {
    setPatternToEditInfo(patternId);
    setInfoDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                รูปแบบคำตอบของด่าน: {levelName || `Level ${levelId}`}
              </DialogTitle>
              <Button
                onClick={handleAddPattern}
                className="ml-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มรูปแบบคำตอบ
              </Button>
            </div>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {deletePatternMutation.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              Error deleting pattern: {deletePatternMutation.error?.message}
            </div>
          )}

          {isLoading ? (
            <ContentLoader message="Loading patterns..." height="h-64" />
          ) : patterns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              ยังไม่มีรูปแบบคำตอบสำหรับด่านนี้
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {patterns.map((pattern) => (
                <Card key={pattern.pattern_id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">
                        {pattern.pattern_name}
                      </h3>
                      {pattern.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {pattern.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {pattern.pattern_type && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {pattern.pattern_type.type_name} ({pattern.pattern_type.quality_level})
                          </span>
                        )}
                        {pattern.weapon && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            {pattern.weapon.weapon_name}
                          </span>
                        )}
                      </div>
                      {pattern.hints && Array.isArray(pattern.hints) && (
                        <p className="text-xs text-gray-500 mt-2">
                          จำนวน hints: {pattern.hints.length}
                        </p>
                      )}
                    </div>
                    <div className="flex bg-gray-50 p-1 rounded-md gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditInfo(pattern.pattern_id)}
                        className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 h-8 px-2"
                        title="แก้ไขข้อมูลทั่วไป"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <div className="w-[1px] bg-gray-200 my-1"></div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPatternLogic(pattern.pattern_id)}
                        className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 h-8 px-2"
                        title="แก้ไข Logic (Blockly)"
                      >
                        <Puzzle className="h-4 w-4" />
                      </Button>
                      <div className="w-[1px] bg-gray-200 my-1"></div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(pattern)}
                        className="text-gray-600 hover:text-red-600 hover:bg-red-50 h-8 px-2"
                        disabled={deletePatternMutation.isPending}
                        title="ลบ"
                      >
                        {deletePatternMutation.isPending && patternToDelete?.pattern_id === pattern.pattern_id ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="ลบรูปแบบคำตอบ"
        itemName={patternToDelete?.pattern_name}
        deleting={deletePatternMutation.isPending}
      />

      {(infoDialogOpen) && (
        <PatternInfoDialog
          open={infoDialogOpen}
          onOpenChange={setInfoDialogOpen}
          patternId={patternToEditInfo}
          levelId={levelId}
        />
      )}
    </>
  );
};

export default PatternListDialog;


