import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

const CoinChangeForm = ({ data, onChange }) => {
    const warriors = data?.warriors || [];

    const updateField = (field, value) => onChange({ ...data, [field]: value });

    const updateWarrior = (index, value) => {
        const newWarriors = [...warriors];
        newWarriors[index] = value;
        updateField('warriors', newWarriors);
    };

    const removeWarrior = (index) => {
        updateField('warriors', warriors.filter((_, idx) => idx !== index));
    };

    const addWarrior = () => {
        if (warriors.length >= 7) {
            alert('เพิ่มเหรียญ (Warriors) ได้สูงสุด 7 ชนิด');
            return;
        }
        updateField('warriors', [...warriors, null]);
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-medium text-gray-600">Monster Power (พลังบอส)</label>
                <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={data?.monster_power ?? ''}
                    onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (!val && val !== 0) return updateField('monster_power', null);
                        if (val > 1000) val = 1000;
                        updateField('monster_power', val);
                    }}
                    placeholder="สูงสุด 1000"
                    className="mt-1"
                />
            </div>
            <div>
                <label className="text-xs font-medium text-gray-600 block mb-2">Warriors (ค่าเหรียญแต่ละตัว)</label>
                {warriors.map((w, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-400 w-6">#{i + 1}</span>
                        <Input
                            type="number"
                            min="1"
                            value={w ?? ''}
                            onChange={(e) => updateWarrior(i, parseInt(e.target.value) || null)}
                            placeholder="ค่าพลัง"
                            className="h-8 text-sm"
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeWarrior(i)} className="h-8 w-8 p-0 text-red-400 hover:text-red-600">
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={addWarrior} className="text-xs mt-1">
                    <Plus className="h-3 w-3 mr-1" /> เพิ่ม Warrior
                </Button>
            </div>
        </div>
    );
};

export default CoinChangeForm;
