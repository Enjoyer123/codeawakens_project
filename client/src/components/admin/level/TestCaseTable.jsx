import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';

const TestCaseTable = ({ testCases, onEdit, onDelete }) => {
  const tableHeaderClassName = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const tableCellClassName = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
  const actionsCellClassName = 'px-6 py-4 whitespace-nowrap text-sm font-medium';

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className={tableHeaderClassName}>Name</th>
            <th className={tableHeaderClassName}>Function</th>
            <th className={tableHeaderClassName}>Type</th>
            <th className={tableHeaderClassName}>Primary</th>
            <th className={tableHeaderClassName}>Order</th>
            <th className={tableHeaderClassName}>Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {testCases.map((tc) => (
            <tr key={tc.test_case_id} className="hover:bg-gray-50">
              <td className={tableCellClassName}>
                <div className="font-medium">{tc.test_case_name}</div>
                <div className="text-xs text-gray-500 truncate max-w-[200px]">
                  In: {JSON.stringify(tc.input_params)}
                </div>
              </td>
              <td className={tableCellClassName}>
                <Badge variant="outline" className="font-mono">
                  {tc.function_name}
                </Badge>
              </td>
              <td className={tableCellClassName}>
                <Badge variant="secondary">{tc.comparison_type}</Badge>
              </td>
              <td className={tableCellClassName}>
                {tc.is_primary ? (
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                    Primary
                  </Badge>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className={tableCellClassName}>{tc.display_order}</td>
              <td className={actionsCellClassName}>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(tc)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    แก้ไข
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(tc)}
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

export default TestCaseTable;
