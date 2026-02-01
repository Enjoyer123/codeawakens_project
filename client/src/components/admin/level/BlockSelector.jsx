import { Image as ImageIcon } from 'lucide-react';
import { getImageUrl } from '@/utils/imageUtils';

const BlockSelector = ({ allBlocks, selectedBlocks, onBlocksChange }) => {
  const blockCategories = ['movement', 'logic', 'conditions', 'loops', 'functions', 'variables', 'operators'];
  const groupedBlocks = blockCategories.reduce((acc, category) => {
    acc[category] = allBlocks.filter(b => b.category === category);
    return acc;
  }, {});

  const handleBlockToggle = (blockId, checked) => {
    if (checked) {
      onBlocksChange([...selectedBlocks, blockId]);
    } else {
      onBlocksChange(selectedBlocks.filter(id => id !== blockId));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">ADD BLOCK</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const allBlockIds = allBlocks.map(b => b.block_id);
              onBlocksChange(allBlockIds);
            }}
            className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => {
              onBlocksChange([]);
            }}
            className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors"
          >
            Unselect All
          </button>
        </div>
      </div>
      <div className="space-y-2 max-auto ">
        {blockCategories.map(category => (
          <div key={category} className="border rounded p-2">
            <div className="font-semibold capitalize mb-2">{category}</div>
            <div className="space-y-1">
              {groupedBlocks[category]?.map(block => (
                <label key={block.block_id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedBlocks.includes(block.block_id)}
                    onChange={(e) => handleBlockToggle(block.block_id, e.target.checked)}
                    className="flex-shrink-0"
                  />
                  {block.block_image ? (
                    <img
                      src={getImageUrl(block.block_image)}
                      alt={block.block_name}
                      className="h-50 w-50 object-cover rounded border flex-shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 flex items-center justify-center border border-dashed rounded text-gray-300 flex-shrink-0">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <span className="text-lg flex-1">{block.block_name}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockSelector;
