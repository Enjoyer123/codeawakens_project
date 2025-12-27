import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { getImageUrl } from '@/utils/imageUtils';

const RewardTable = ({ rewards, onEdit, onDelete, onManageImages }) => {
  const tableHeaderClassName =
    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const tableCellClassName = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
  const actionsCellClassName = 'px-6 py-4 whitespace-nowrap text-sm font-medium';

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className={tableHeaderClassName}>Reward</th>
            <th className={tableHeaderClassName}>Level</th>
            <th className={tableHeaderClassName}>Type</th>
            <th className={tableHeaderClassName}>Required Score</th>
            <th className={tableHeaderClassName}>Status</th>
            <th className={tableHeaderClassName}>Images</th>
            <th className={tableHeaderClassName}>Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rewards.map((reward) => (
            <tr key={reward.reward_id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {reward.reward_name}
                  </div>
                  {reward.description && (
                    <div className="text-sm text-gray-500">
                      {reward.description}
                    </div>
                  )}
                </div>
              </td>
              <td className={tableCellClassName}>
                {reward.level && (
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {reward.level.level_name}
                    </div>
                    {reward.level.category && (
                      <div className="text-xs text-gray-500">
                        {reward.level.category.category_name}
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className={tableCellClassName}>
                <Badge variant="outline">{reward.reward_type}</Badge>
              </td>
              <td className={tableCellClassName}>
                {reward.required_score}
              </td>
              <td className={tableCellClassName}>
                <Badge variant={reward.is_automatic ? 'default' : 'secondary'}>
                  {reward.is_automatic ? 'Automatic' : 'Manual'}
                </Badge>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    const frames = [
                      reward.frame1,
                      reward.frame2,
                      reward.frame3,
                      reward.frame4,
                      reward.frame5,
                    ].filter(Boolean);

                    return frames.length > 0 ? (
                      <>
                        <Badge variant="secondary">
                          {frames.length} รูป
                        </Badge>
                        <div className="flex gap-1">
                          {frames.slice(0, 3).map((frame, index) => (
                            <img
                              key={`frame${index + 1}`}
                              src={getImageUrl(frame)}
                              alt={`Frame ${index + 1}`}
                              className="w-8 h-8 object-cover rounded border"
                            />
                          ))}
                          {frames.length > 3 && (
                            <div className="w-8 h-8 bg-gray-200 rounded border flex items-center justify-center text-xs">
                              +{frames.length - 3}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <span className="text-sm text-gray-400">ไม่มีรูป</span>
                    );
                  })()}
                </div>
              </td>
              <td className={actionsCellClassName}>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onManageImages(reward)}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    รูปภาพ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(reward)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    แก้ไข
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(reward)}
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

export default RewardTable;
