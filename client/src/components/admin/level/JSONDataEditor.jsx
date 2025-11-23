import { useState } from 'react';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';

const JSONDataEditor = ({ formData, onJsonFieldChange }) => {
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    try {
      setError(null);
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      onJsonFieldChange(field, parsed);
    } catch (err) {
      setError(`Invalid JSON format for ${field}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4">JSON Data</h2>
      <ErrorAlert message={error} />
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Nodes (JSON)</label>
          <textarea
            value={JSON.stringify(formData.nodes, null, 2)}
            onChange={(e) => handleChange('nodes', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
            rows={4}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Edges (JSON)</label>
          <textarea
            value={JSON.stringify(formData.edges, null, 2)}
            onChange={(e) => handleChange('edges', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
            rows={4}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Monsters (JSON)</label>
          <textarea
            value={JSON.stringify(formData.monsters, null, 2)}
            onChange={(e) => handleChange('monsters', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
            rows={4}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Obstacles (JSON)</label>
          <textarea
            value={JSON.stringify(formData.obstacles, null, 2)}
            onChange={(e) => handleChange('obstacles', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
            rows={4}
          />
        </div>
      </div>
    </div>
  );
};

export default JSONDataEditor;

