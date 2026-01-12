import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { getImageUrl } from '@/utils/imageUtils';

const LevelGuideTable = ({ guides, onEdit, onDelete, onManageImages }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Images</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {guides.map((guide) => (
            <tr key={guide.guide_id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{guide.title}</div>
                {guide.description && (
                  <div className="text-xs text-gray-500 truncate max-w-xs">{guide.description}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{guide.display_order}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={guide.is_active ? 'default' : 'secondary'}>
                  {guide.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  {guide.guide_images && guide.guide_images.length > 0 ? (
                    <>
                      <Badge variant="secondary">{guide.guide_images.length}</Badge>
                      {guide.guide_images.slice(0, 2).map((img) => (
                        <img
                          key={img.guide_file_id}
                          src={getImageUrl(img.path_file)}
                          className="w-8 h-8 object-cover rounded border"
                          alt=""
                        />
                      ))}
                    </>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center gap-2">
                   <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onManageImages(guide)}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    รูปภาพ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(guide)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    แก้ไข
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(guide)}
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

export default LevelGuideTable;
