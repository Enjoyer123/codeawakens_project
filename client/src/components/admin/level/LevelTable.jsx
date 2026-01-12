import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, Play, Lightbulb, Blocks, Terminal, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LevelTable = ({ 
    levels, 
    onDelete, 
    onViewPatterns, 
    onNavigate 
}) => {
  const navigate = useNavigate();

  // If onNavigate is provided, use it, otherwise use local navigate
  const handleNavigate = onNavigate || navigate;

  const tableHeaderClassName =
    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const tableCellClassName = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
  const actionsCellClassName = 'px-6 py-4 whitespace-nowrap text-sm font-medium';

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className={tableHeaderClassName}>Level</th>
            <th className={tableHeaderClassName}>Category</th>
            <th className={tableHeaderClassName}>Difficulty</th>
            <th className={tableHeaderClassName}>Status</th>
            <th className={tableHeaderClassName}>Creator</th>
            <th className={tableHeaderClassName}>Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {levels.map((level) => (
            <tr key={level.level_id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {level.level_name}
                  </div>
                  {level.description && (
                    <div className="text-sm text-gray-500">
                      {level.description}
                    </div>
                  )}
                </div>
              </td>
              <td className={tableCellClassName}>
                {level.category && (
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: level.category.color_code || '#gray',
                      color: level.category.color_code || '#gray'
                    }}
                  >
                    {level.category.category_name}
                  </Badge>
                )}
              </td>
              <td className={tableCellClassName}>
                <div className="text-sm text-gray-900">
                  <Badge variant="secondary">{level.difficulty}</Badge>
                  <span className="ml-2 text-gray-500">
                    ({level.difficulty_level})
                  </span>
                </div>
              </td>
              <td className={tableCellClassName}>
                <div className="flex flex-col gap-1">
                  <Badge variant={level.is_unlocked ? 'default' : 'secondary'}>
                    {level.is_unlocked ? 'Unlocked' : 'Locked'}
                  </Badge>
                  <Badge variant={level.textcode ? 'default' : 'outline'}>
                    {level.textcode ? 'Text Code' : 'Blockly'}
                  </Badge>
                </div>
              </td>
              <td className={tableCellClassName}>
                {level.creator?.username || 'Unknown'}
              </td>
              <td className={actionsCellClassName}>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigate(`/admin/levels/${level.level_id}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    แก้ไข
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigate(`/admin/levels/${level.level_id}/hints`)}
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Hints
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigate(`/admin/levels/${level.level_id}/guides`)}
                    className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Guides
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigate(`/admin/levels/${level.level_id}/test-cases`)}
                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                  >
                    <Terminal className="h-4 w-4 mr-2" />
                    Test Cases
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewPatterns(level)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    ดูรูปแบบคำตอบ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigate(`/admin/levels/${level.level_id}/starters/create`)}
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    <Blocks className="h-4 w-4 mr-2" />
                    เพิ่ม Starter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigate(`/admin/levels/${level.level_id}/preview`)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    ดูตัวอย่าง
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(level)}
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

export default LevelTable;
