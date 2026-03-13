import { Input } from '@/components/ui/input';

// Algo type definitions (used for checkbox + algo_data.type mapping)
const ALGO_TYPES = [
  { type: 'KNAPSACK', label: 'Knapsack' },
  { type: 'COINCHANGE', label: 'Coin Change' },
  { type: 'SUBSETSUM', label: 'Subset Sum' },
  { type: 'NQUEEN', label: 'N-Queen' },
  { type: 'EMEI', label: 'Emei Mountain (ง้อไบ๊)' }
];

// Default payload templates per algo type
const ALGO_PAYLOAD_TEMPLATES = {
  KNAPSACK: {
    bag: { x: 400, y: 450, label: "" },
    items: [
      { x: 150, y: 150, id: 1, label: "", price: null, weight: null },
      { x: 400, y: 150, id: 2, label: "", price: null, weight: null },
      { x: 650, y: 150, id: 3, label: "", price: null, weight: null }
    ],
    capacity: null
  },
  SUBSETSUM: {
    side1: { x: 200, y: 450, label: "ฝั่ง 1" },
    side2: { x: 600, y: 450, label: "ฝั่ง 2" },
    warriors: [null, null, null],
    target_sum: null,
    warriors_display: [
      { x: 150, y: 150, id: 1, label: "", power: null },
      { x: 400, y: 150, id: 2, label: "", power: null },
      { x: 650, y: 150, id: 3, label: "", power: null }
    ],
  },
  COINCHANGE: {
    monster_power: null,
    warriors: [null, null, null, null]
  },
  EMEI: {
    tourists: null
  },
  NQUEEN: {
    n: 4
  }
};

const LevelInfoForm = ({ formData, categories, prerequisiteLevels, isEditing, levelId, onFormDataChange }) => {
  const handleChange = (field, value) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  // ดึง algo type ปัจจุบัน
  const currentAlgoType = formData.algo_data?.type || null;

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
          <label className="text-sm font-medium">TOPIC *</label>
          <select
            value={formData.category_id}
            onChange={(e) => handleChange('category_id', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Select topic</option>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Map Require</label>
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

        {/* Level Type Selection (Mutually Exclusive) — ใช้ algo_data.type */}
        <div className="space-y-2 pt-4 border-t border-gray-100">
          <label className="text-sm font-bold text-gray-700">Level Type (Algorithm)</label>
          <div className="grid grid-cols-2 gap-2">
            {ALGO_TYPES.map((algoType) => (
              <label key={algoType.type} className="flex items-center gap-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentAlgoType === algoType.type}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    const newData = { ...formData };

                    if (isChecked) {
                      // สร้าง algo_data ใหม่ (ใช้ payload เดิมถ้ามี, ไม่งั้นใช้ template)
                      const existingPayload = (currentAlgoType === algoType.type && formData.algo_data?.payload)
                        ? formData.algo_data.payload
                        : ALGO_PAYLOAD_TEMPLATES[algoType.type] || {};
                      newData.algo_data = { type: algoType.type, payload: existingPayload };
                    } else {
                      newData.algo_data = null;
                    }
                    onFormDataChange(newData);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{algoType.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelInfoForm;