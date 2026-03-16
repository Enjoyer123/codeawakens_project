import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

const SubsetSumForm = ({ data, onChange }) => {
    // Both arrays must be synced 
    const warriorsDisplay = data?.warriors_display || [];

    const updateTargetSum = (val) => onChange({ ...data, target_sum: val });

    const syncWarriors = (newDisplay) => {
        const newWarriors = newDisplay.map(wd => wd?.power);
        onChange({ ...data, warriors: newWarriors, warriors_display: newDisplay });
    };

    const updateWarrior = (index, updates) => {
        const newDisplay = [...warriorsDisplay];
        newDisplay[index] = { ...newDisplay[index], ...updates };
        
        // Auto-sync label with power if the power changed directly 
        if (updates.power !== undefined) {
            newDisplay[index].label = updates.power?.toString() || '';
        }
        syncWarriors(newDisplay);
    };

    const removeWarrior = (index) => {
        const newDisplay = warriorsDisplay.filter((_, idx) => idx !== index);
        syncWarriors(newDisplay);
    };

    const addWarrior = () => {
        const spacing = 150;
        const startX = 150;
        const newId = warriorsDisplay.length > 0 ? Math.max(...warriorsDisplay.map(i => i.id || 0)) + 1 : 1;
        
        const newWarrior = { 
            id: newId, 
            x: startX + warriorsDisplay.length * spacing, 
            y: 150, 
            label: '', 
            power: null 
        };
        syncWarriors([...warriorsDisplay, newWarrior]);
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-medium text-gray-600">Target Sum (ผลรวมเป้าหมาย)</label>
                <Input
                    type="number"
                    min="1"
                    value={data?.target_sum ?? ''}
                    onChange={(e) => updateTargetSum(parseInt(e.target.value) || null)}
                    placeholder="เช่น 15"
                    className="mt-1"
                />
            </div>
            <div>
                <label className="text-xs font-medium text-gray-600 block mb-2">Warriors (พลังนักรบ)</label>
                {warriorsDisplay.map((w, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-400 w-6">#{i + 1}</span>
                        <Input
                            type="number"
                            min="1"
                            value={w?.power ?? ''}
                            onChange={(e) => updateWarrior(i, { power: parseInt(e.target.value) || null })}
                            placeholder="พลัง"
                            className="h-8 text-sm"
                        />
                        <Input
                            value={w?.label ?? ''}
                            onChange={(e) => updateWarrior(i, { label: e.target.value })}
                            placeholder="ชื่อ"
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

export default SubsetSumForm;
