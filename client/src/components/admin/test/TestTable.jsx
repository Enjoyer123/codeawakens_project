import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { getImageUrl } from '@/utils/imageUtils';

const TestTable = ({ tests, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Order/ID</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Image</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Question</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Choices</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Active</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tests.map((test) => (
            <tr key={test.test_id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-500">#{test.test_id}</td>
              <td className="px-6 py-4">
                {test.test_image ? (
                  <img 
                    src={getImageUrl(test.test_image)} 
                    alt="Question" 
                    className="h-12 w-12 object-contain rounded bg-gray-50 border"
                  />
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">{test.question}</div>
                {test.description && <div className="text-xs text-gray-500">{test.description}</div>}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                <ul className="list-disc pl-4 space-y-1">
                  {test.choices.map(c => (
                    <li key={c.test_choice_id} className={c.is_correct ? "text-green-600 font-medium" : ""}>
                      {c.choice_text}
                    </li>
                  ))}
                </ul>
              </td>
              <td className="px-6 py-4">
                <Badge variant={test.is_active ? 'default' : 'secondary'}>
                  {test.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(test)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDelete(test)} className="text-red-600 hover:bg-red-50">
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

export default TestTable;
