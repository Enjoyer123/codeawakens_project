import { Input } from '@/components/ui/input';

const LevelInfoForm = ({ formData, categories, prerequisiteLevels, isEditing, levelId, onFormDataChange }) => {
  const handleChange = (field, value) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4">Level Information</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">TITLE *</label>
          <Input
            value={formData.level_name}
            onChange={(e) => handleChange('level_name', e.target.value)}
            placeholder="Level name"
          />
        </div>

        <div>
          <label className="text-sm font-medium">CATEGORY *</label>
          <select
            value={formData.category_id}
            onChange={(e) => handleChange('category_id', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.category_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <Input
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Level description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Difficulty Level</label>
            <Input
              type="number"
              min="1"
              value={formData.difficulty_level}
              onChange={(e) => handleChange('difficulty_level', parseInt(e.target.value) || 1)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Difficulty</label>
            <select
              value={formData.difficulty}
              onChange={(e) => handleChange('difficulty', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>

          </div>

        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Required Level (Map Require)</label>
            <select
              value={formData.required_level_id}
              onChange={(e) => handleChange('required_level_id', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">None (Unlocked by default)</option>
              {prerequisiteLevels
                .filter(l => !isEditing || l.level_id !== parseInt(levelId))
                .map((level) => (
                  <option key={level.level_id} value={level.level_id}>
                    {level.level_name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Required Skill Level</label>
            <select
              value={formData.required_skill_level || ''}
              onChange={(e) => handleChange('required_skill_level', e.target.value || null)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="Zone_A">Zone A</option>
              <option value="Zone_B">Zone B</option>
              <option value="Zone_C">Zone C</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_unlocked}
              onChange={(e) => handleChange('is_unlocked', e.target.checked)}
            />
            <span className="text-sm font-medium">Unlocked</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.required_for_post_test}
              onChange={(e) => handleChange('required_for_post_test', e.target.checked)}
            />
            <span className="text-sm font-medium">Required for Post-Test</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.textcode}
              onChange={(e) => handleChange('textcode', e.target.checked)}
            />
            <span className="text-sm font-medium">Text Code</span>
          </label>
        </div>
      </div>

      {/* Level Type Selection (Mutually Exclusive) */}
      <div className="space-y-2 pt-4 border-t border-gray-100">
        <label className="text-sm font-bold text-gray-700">Level Type (Algorithm)</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Knapsack', field: 'knapsack_data' },
            { label: 'Coin Change', field: 'coin_change_data' },
            { label: 'Subset Sum', field: 'subset_sum_data' },
            { label: 'Applied Data', field: 'applied_data' }
          ].map((type) => (
            <label key={type.field} className="flex items-center gap-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData[type.field]}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  const newData = { ...formData };

                  if (isChecked) {
                    // Mutual exclusivity: Clear others
                    newData.knapsack_data = null;
                    newData.coin_change_data = null;
                    newData.subset_sum_data = null;
                    newData.applied_data = null;

                    // Enable selected (Initialize with empty object if null)
                    newData[type.field] = formData[type.field] || {};
                  } else {
                    // Disable
                    newData[type.field] = null;
                  }
                  onFormDataChange(newData);
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{type.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>

  );
};

export default LevelInfoForm;