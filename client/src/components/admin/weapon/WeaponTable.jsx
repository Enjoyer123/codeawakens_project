import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { getImageUrl } from '@/utils/imageUtils';

const WeaponTable = ({ weapons, onEdit, onDelete, onManageImages }) => {
  const tableHeaderClassName =
    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const tableCellClassName = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
  const actionsCellClassName = 'px-6 py-4 whitespace-nowrap text-sm font-medium';

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className={tableHeaderClassName}>Weapon</th>
            <th className={tableHeaderClassName}>Key</th>
            <th className={tableHeaderClassName}>Type</th>
            <th className={tableHeaderClassName}>Power</th>
            <th className={tableHeaderClassName}>Images</th>
            <th className={tableHeaderClassName}>Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {weapons.map((weapon) => (
            <tr key={weapon.weapon_id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{weapon.emoji || '⚔️'}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {weapon.weapon_name}
                    </div>
                    {weapon.description && (
                      <div className="text-sm text-gray-500">
                        {weapon.description}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className={tableCellClassName}>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {weapon.weapon_key}
                </code>
              </td>
              <td className={tableCellClassName}>
                <Badge variant="outline">{weapon.weapon_type}</Badge>
              </td>
              <td className={tableCellClassName}>{weapon.combat_power}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {weapon.weapon_images && weapon.weapon_images.length > 0 ? (
                    <>
                      <Badge variant="secondary">
                        {weapon.weapon_images.length} รูป
                      </Badge>
                      <div className="flex gap-1">
                        {weapon.weapon_images.slice(0, 3).map((img) => (
                          <img
                            key={img.file_id}
                            src={getImageUrl(img.path_file)}
                            alt=""
                            className="w-8 h-8 object-cover rounded border"
                          />
                        ))}
                        {weapon.weapon_images.length > 3 && (
                          <div className="w-8 h-8 bg-gray-200 rounded border flex items-center justify-center text-xs">
                            +{weapon.weapon_images.length - 3}
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
                    onClick={() => onManageImages(weapon)}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    รูปภาพ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(weapon)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    แก้ไข
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(weapon)}
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

export default WeaponTable;
