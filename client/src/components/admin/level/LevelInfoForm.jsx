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
          <label className="text-sm font-medium">Require Pre-Score (Default: 0)</label>
          <Input
            type="number"
            min="0"
            value={formData.require_pre_score}
            onChange={(e) => handleChange('require_pre_score', parseInt(e.target.value) || 0)}
            placeholder="Score required to unlock"
          />
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
    </div>
  );
};

export default LevelInfoForm;