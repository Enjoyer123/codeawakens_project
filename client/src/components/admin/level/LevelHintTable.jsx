import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { getImageUrl } from '@/utils/imageUtils';

const LevelHintTable = ({ hints, onEdit, onDelete, onManageImages }) => {
  const tableHeaderClassName =
    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const tableCellClassName = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
  const actionsCellClassName = 'px-6 py-4 whitespace-nowrap text-sm font-medium';

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className={tableHeaderClassName}>Hint</th>
            <th className={tableHeaderClassName}>Display Order</th>
            <th className={tableHeaderClassName}>Status</th>
            <th className={tableHeaderClassName}>Images</th>
            <th className={tableHeaderClassName}>Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {hints.map((hint) => (
            <tr key={hint.hint_id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {hint.title}
                  </div>
                  {hint.description && (
                    <div className="text-sm text-gray-500">
                      {hint.description}
                    </div>
                  )}
                </div>
              </td>
              <td className={tableCellClassName}>{hint.display_order}</td>
              <td className={tableCellClassName}>
                <Badge variant={hint.is_active ? 'default' : 'secondary'}>
                  {hint.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {hint.hint_images && hint.hint_images.length > 0 ? (
                    <>
                      <Badge variant="secondary">
                        {hint.hint_images.length} รูป
                      </Badge>
                      <div className="flex gap-1">
                        {hint.hint_images.slice(0, 3).map((img) => (
                          <img
                            key={img.hint_image_id}
                            src={getImageUrl(img.path_file)}
                            alt=""
                            className="w-8 h-8 object-cover rounded border"
                          />
                        ))}
                        {hint.hint_images.length > 3 && (
                          <div className="w-8 h-8 bg-gray-200 rounded border flex items-center justify-center text-xs">
                            +{hint.hint_images.length - 3}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">ไม่มีรูป</span>
                  )}
                </div>
              </td>
              <td className={actionsCellClassName}>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onManageImages(hint)}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    รูปภาพ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(hint)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    แก้ไข
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(hint)}
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
  );
};

export default LevelHintTable;
