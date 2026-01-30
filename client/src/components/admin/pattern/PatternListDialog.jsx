import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { fetchAllPatterns, deletePattern } from '../../../services/patternService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Trash2, Loader, Edit } from 'lucide-react';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import ContentLoader from '@/components/shared/Loading/ContentLoader';

const PatternListDialog = ({ open, onOpenChange, levelId, levelName }) => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patternToDelete, setPatternToDelete] = useState(null);

  useEffect(() => {
    if (open && levelId) {
      loadPatterns();
    }
  }, [open, levelId]);

  const loadPatterns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllPatterns(getToken, 1, 100, levelId);
      setPatterns(data.patterns || []);
    } catch (err) {
      setError('Failed to load patterns: ' + (err.message || ''));
      console.error('Error loading patterns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (pattern) => {
    setPatternToDelete(pattern);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!patternToDelete) return;

    try {
      await deletePattern(getToken, patternToDelete.pattern_id);
      setPatterns(patterns.filter(p => p.pattern_id !== patternToDelete.pattern_id));
      setDeleteDialogOpen(false);
      setPatternToDelete(null);
    } catch (err) {
      setError('Failed to delete pattern: ' + (err.message || ''));
      console.error('Error deleting pattern:', err);
    }
  };

  const handleAddPattern = () => {
    navigate(`/admin/levels/${levelId}/patterns/create`);
  };

  const handleEditPattern = (patternId) => {
    navigate(`/admin/levels/${levelId}/patterns/${patternId}/edit`);
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

          {loading ? (
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
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPattern(pattern.pattern_id)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(pattern)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
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
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบรูปแบบคำตอบ "${patternToDelete?.pattern_name}"?`}
      />
    </>
  );
};

export default PatternListDialog;


