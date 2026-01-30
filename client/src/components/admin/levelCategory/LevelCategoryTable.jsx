import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { getImageUrl } from '@/utils/imageUtils';
import { ITEM_TYPE_SHORT_LABELS } from '@/constants/itemTypes';

const LevelCategoryTable = ({ levelCategories, onEdit, onDelete, onManageImages }) => {
  const tableHeaderClassName =
    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const tableCellClassName = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
  const actionsCellClassName = 'px-6 py-4 whitespace-nowrap text-sm font-medium';
  const colorSwatchClassName = 'w-6 h-6 rounded border border-gray-300';

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className={tableHeaderClassName}>Category ID</th>
            <th className={tableHeaderClassName}>Category Name</th>
            <th className={tableHeaderClassName}>Description</th>
            <th className={tableHeaderClassName}>Item Enable</th>
            <th className={tableHeaderClassName}>Items</th>
            <th className={tableHeaderClassName}>Difficulty Order</th>
            <th className={tableHeaderClassName}>Color Code</th>
            <th className={tableHeaderClassName}>Block Key</th>
            <th className={tableHeaderClassName}>Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {levelCategories.map((category) => (
            <tr key={category.category_id} className="hover:bg-gray-50">
              <td className={tableCellClassName}>
                {category.category_id}
              </td>
              <td className={`${tableCellClassName} font-medium`}>
                {category.category_name}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {category.description}
              </td>
              <td className={tableCellClassName}>
                <Badge
                  variant={category.item_enable ? 'default' : 'secondary'}
                >
                  {category.item_enable ? 'Enabled' : 'Disabled'}
                </Badge>
              </td>
              <td className={tableCellClassName}>
                {category.item_enable && category.category_items && category.category_items.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {category.category_items.map((categoryItem, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {ITEM_TYPE_SHORT_LABELS[categoryItem.item_type] || categoryItem.item_type}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </td>
              <td className={tableCellClassName}>
                {category.difficulty_order}
              </td>
              <td className={tableCellClassName}>
                <div className="flex items-center gap-2">
                  <div
                    className={colorSwatchClassName}
                    style={{ backgroundColor: category.color_code }}
                  />
                  <span className="text-sm text-gray-600">
                    {category.color_code}
                  </span>
                </div>
              </td>
              {/* New Background column */}
              <td className={tableCellClassName}>
                {category.background_image ? (
                  <img
                    src={getImageUrl(category.background_image)}
                    alt="Bg"
                    className="w-8 h-8 object-cover rounded border"
                  />
                ) : (
                  <span className="text-sm text-gray-400">ไม่มี</span>
                )}
              </td>
              <td className={tableCellClassName}>
                {category.block_key ? (
                  <div className="max-w-xs">
                    <Badge variant="secondary" className="text-xs">
                      {Array.isArray(category.block_key)
                        ? `${category.block_key.length} items`
                        : typeof category.block_key === 'object'
                          ? Object.keys(category.block_key).length > 0
                            ? `${Object.keys(category.block_key).length} keys`
                            : 'Empty'
                          : 'Set'}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {JSON.stringify(category.block_key).substring(0, 50)}
                      {JSON.stringify(category.block_key).length > 50 ? '...' : ''}
                    </p>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </td>
              <td className={actionsCellClassName}>
                <div className="flex items-center gap-2">
                  {/* New Image action button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onManageImages && onManageImages(category)}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    รูปภาพ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(category)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    แก้ไข
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(category)}
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

export default LevelCategoryTable;
