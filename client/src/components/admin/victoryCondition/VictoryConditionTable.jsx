import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';

const VictoryConditionTable = ({ victoryConditions, onEdit, onDelete }) => {
  const tableHeaderClassName =
    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const tableCellClassName = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
  const actionsCellClassName = 'px-6 py-4 whitespace-nowrap text-sm font-medium';

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className={tableHeaderClassName}>
              Victory Condition ID
            </th>
            <th className={tableHeaderClassName}>Type</th>
            <th className={tableHeaderClassName}>Description</th>
            <th className={tableHeaderClassName}>Check</th>
            <th className={tableHeaderClassName}>Available</th>
            <th className={tableHeaderClassName}>Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {victoryConditions.map((victoryCondition) => (
            <tr
              key={victoryCondition.victory_condition_id}
              className="hover:bg-gray-50"
            >
              <td className={tableCellClassName}>
                {victoryCondition.victory_condition_id}
              </td>
              <td className={`${tableCellClassName} font-medium`}>
                {victoryCondition.type}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {victoryCondition.description}
              </td>
              <td className={`${tableCellClassName} text-gray-500`}>
                {victoryCondition.check}
              </td>
              <td className={tableCellClassName}>
                <Badge
                  variant={victoryCondition.is_available ? 'default' : 'secondary'}
                >
                  {victoryCondition.is_available ? 'Available' : 'Unavailable'}
                </Badge>
              </td>
              <td className={actionsCellClassName}>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(victoryCondition)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(victoryCondition)}
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
  );
};

export default VictoryConditionTable;
