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
      <h2 className="text-xl font-bold mb-4">ADD BLOCK</h2>
      <div className="space-y-2 max-auto ">
        {blockCategories.map(category => (
          <div key={category} className="border rounded p-2">
            <div className="font-semibold capitalize mb-2">{category}</div>
            <div className="space-y-1">
              {groupedBlocks[category]?.map(block => (
                <label key={block.block_id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBlocks.includes(block.block_id)}
                    onChange={(e) => handleBlockToggle(block.block_id, e.target.checked)}
                  />
                  <span className="text-sm">{block.block_name}</span>
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