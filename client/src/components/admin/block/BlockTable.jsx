import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';

const blockCategories = [
  { value: 'movement', label: 'Movement' },
  { value: 'logic', label: 'Logic' },
  { value: 'conditions', label: 'Conditions' },
  { value: 'loops', label: 'Loops' },
  { value: 'functions', label: 'Functions' },
  { value: 'variables', label: 'Variables' },
  { value: 'operators', label: 'Operators' },
];

const BlockTable = ({ blocks, onEdit, onDelete }) => {
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

  const tableHeaderClassName =
    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const tableCellClassName = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
  const actionsCellClassName = 'px-6 py-4 whitespace-nowrap text-sm font-medium';

  return (
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
              <td className={tableCellClassName}>{block.block_id}</td>
              <td className={`${tableCellClassName} font-medium`}>
                {block.block_key}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {block.block_name}
              </td>
              <td className={tableCellClassName}>
                <Badge className={getCategoryBadgeColor(block.category)}>
                  {blockCategories.find((c) => c.value === block.category)?.label || block.category}
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
                  <Button variant="outline" size="sm" onClick={() => onEdit(block)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(block)}
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

export default BlockTable;
