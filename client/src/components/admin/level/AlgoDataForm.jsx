import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

/**
 * AlgoDataForm — form-based editor for algorithm-specific level data
 * Replaces the raw JSON textarea with proper input fields per algo type
 */
const AlgoDataForm = ({ algoKey, data, onChange }) => {
    const [showJson, setShowJson] = useState(false);
    const [jsonString, setJsonString] = useState('');
    const [jsonError, setJsonError] = useState(null);

    const update = (path, value) => {
        const newData = structuredClone(data);
        const keys = path.split('.');
        let obj = newData;
        for (let i = 0; i < keys.length - 1; i++) {
            if (obj[keys[i]] === undefined) obj[keys[i]] = {};
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
        onChange(newData);
    };

    const handleJsonToggle = () => {
        if (!showJson) {
            setJsonString(JSON.stringify(data, null, 2));
            setJsonError(null);
        }
        setShowJson(!showJson);
    };

    const handleJsonChange = (e) => {
        const val = e.target.value;
        setJsonString(val);
        try {
            const parsed = JSON.parse(val);
            setJsonError(null);
            onChange(parsed);
        } catch {
            setJsonError("Invalid JSON");
        }
    };

    // Shared header
    const header = (
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase">{algoKey.replace(/_/g, ' ')}</h3>
            <Button variant="ghost" size="sm" onClick={handleJsonToggle} className="text-[10px] text-gray-400">
                {showJson ? 'Form View' : 'JSON View'}
            </Button>
        </div>
    );

    // Raw JSON fallback
    if (showJson) {
        return (
            <div className="space-y-2">
                {header}
                <textarea
                    value={jsonString}
                    onChange={handleJsonChange}
                    className={`w-full h-64 font-mono text-xs p-3 border rounded-md ${jsonError ? 'border-red-300' : 'border-gray-300'}`}
                    spellCheck="false"
                />
                {jsonError && <p className="text-xs text-red-500">{jsonError}</p>}
            </div>
        );
    }

    // --- CoinChange ---
    if (algoKey === 'coin_change_data') {
        const warriors = data?.warriors || [];
        return (
            <div className="space-y-4">
                {header}
                <div>
                    <label className="text-xs font-medium text-gray-600">Monster Power (พลังบอส)</label>
                    <Input
                        type="number"
                        min="1"
                        value={data?.monster_power ?? ''}
                        onChange={(e) => update('monster_power', parseInt(e.target.value) || null)}
                        placeholder="เช่น 32"
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
                                onChange={(e) => {
                                    const newWarriors = [...warriors];
                                    newWarriors[i] = parseInt(e.target.value) || null;
                                    update('warriors', newWarriors);
                                }}
                                placeholder="ค่าพลัง"
                                className="h-8 text-sm"
                            />
                            <Button variant="ghost" size="sm" onClick={() => {
                                const newWarriors = warriors.filter((_, idx) => idx !== i);
                                update('warriors', newWarriors);
                            }} className="h-8 w-8 p-0 text-red-400 hover:text-red-600">
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => update('warriors', [...warriors, null])} className="text-xs mt-1">
                        <Plus className="h-3 w-3 mr-1" /> เพิ่ม Warrior
                    </Button>
                </div>
            </div>
        );
    }

    // --- Knapsack ---
    if (algoKey === 'knapsack_data') {
        const items = data?.items || [];
        return (
            <div className="space-y-4">
                {header}
                <div>
                    <label className="text-xs font-medium text-gray-600">Capacity (น้ำหนักสูงสุด kg)</label>
                    <Input
                        type="number"
                        min="1"
                        value={data?.capacity ?? ''}
                        onChange={(e) => update('capacity', parseInt(e.target.value) || null)}
                        placeholder="เช่น 50"
                        className="mt-1"
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-600">Bag Name (ชื่อกระเป๋า)</label>
                    <Input
                        type="text"
                        value={data?.bag?.label ?? ''}
                        onChange={(e) => update('bag.label', e.target.value)}
                        placeholder="เช่น กระเป๋าเป้"
                        className="mt-1 mb-2"
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-600 block mb-2">Items (สมบัติ)</label>
                    {items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 mb-2 bg-gray-50 p-2 rounded">
                            <span className="text-xs text-gray-400 w-6">#{i + 1}</span>
                            <div className="flex-1 grid grid-cols-3 gap-1">
                                <Input
                                    type="number"
                                    min="1"
                                    value={item?.weight ?? ''}
                                    onChange={(e) => {
                                        const newItems = structuredClone(items);
                                        newItems[i] = { ...newItems[i], weight: parseInt(e.target.value) || null };
                                        update('items', newItems);
                                    }}
                                    placeholder="kg"
                                    className="h-7 text-xs"
                                />
                                <Input
                                    type="number"
                                    min="1"
                                    value={item?.price ?? ''}
                                    onChange={(e) => {
                                        const newItems = structuredClone(items);
                                        newItems[i] = { ...newItems[i], price: parseInt(e.target.value) || null };
                                        update('items', newItems);
                                    }}
                                    placeholder="฿"
                                    className="h-7 text-xs"
                                />
                                <Input
                                    value={item?.label ?? ''}
                                    onChange={(e) => {
                                        const newItems = structuredClone(items);
                                        newItems[i] = { ...newItems[i], label: e.target.value };
                                        update('items', newItems);
                                    }}
                                    placeholder="ชื่อ"
                                    className="h-7 text-xs"
                                />
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => {
                                const newItems = items.filter((_, idx) => idx !== i);
                                update('items', newItems);
                            }} className="h-7 w-7 p-0 text-red-400 hover:text-red-600">
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-1">
                        <span className="w-6"></span>
                        <span className="flex-1 grid grid-cols-3 gap-1"><span>Weight</span><span>Price</span><span>Label</span></span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                        const spacing = 150;
                        const startX = 150;
                        const newId = items.length + 1;
                        update('items', [...items, { id: newId, x: startX + items.length * spacing, y: 150, label: '', price: null, weight: null }]);
                    }} className="text-xs mt-1">
                        <Plus className="h-3 w-3 mr-1" /> เพิ่ม Item
                    </Button>
                </div>
            </div>
        );
    }

    // --- SubsetSum ---
    if (algoKey === 'subset_sum_data') {
        const warriors = data?.warriors || [];
        const warriorsDisplay = data?.warriors_display || [];
        return (
            <div className="space-y-4">
                {header}
                <div>
                    <label className="text-xs font-medium text-gray-600">Target Sum (ผลรวมเป้าหมาย)</label>
                    <Input
                        type="number"
                        min="1"
                        value={data?.target_sum ?? ''}
                        onChange={(e) => update('target_sum', parseInt(e.target.value) || null)}
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
                                onChange={(e) => {
                                    const power = parseInt(e.target.value) || null;
                                    const newDisplay = structuredClone(warriorsDisplay);
                                    newDisplay[i] = { ...newDisplay[i], power, label: power?.toString() || '' };
                                    const newWarriors = newDisplay.map(wd => wd?.power);
                                    onChange({ ...data, warriors: newWarriors, warriors_display: newDisplay });
                                }}
                                placeholder="พลัง"
                                className="h-8 text-sm"
                            />
                            <Input
                                value={w?.label ?? ''}
                                onChange={(e) => {
                                    const newDisplay = structuredClone(warriorsDisplay);
                                    newDisplay[i] = { ...newDisplay[i], label: e.target.value };
                                    onChange({ ...data, warriors_display: newDisplay });
                                }}
                                placeholder="ชื่อ"
                                className="h-8 text-sm"
                            />
                            <Button variant="ghost" size="sm" onClick={() => {
                                const newDisplay = warriorsDisplay.filter((_, idx) => idx !== i);
                                const newWarriors = newDisplay.map(wd => wd?.power);
                                onChange({ ...data, warriors: newWarriors, warriors_display: newDisplay });
                            }} className="h-8 w-8 p-0 text-red-400 hover:text-red-600">
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => {
                        const spacing = 150;
                        const startX = 150;
                        const newId = warriorsDisplay.length + 1;
                        const newDisplay = [...warriorsDisplay, { id: newId, x: startX + warriorsDisplay.length * spacing, y: 150, label: '', power: null }];
                        const newWarriors = newDisplay.map(wd => wd?.power);
                        onChange({ ...data, warriors: newWarriors, warriors_display: newDisplay });
                    }} className="text-xs mt-1">
                        <Plus className="h-3 w-3 mr-1" /> เพิ่ม Warrior
                    </Button>
                </div>
            </div>
        );
    }

    // --- N-Queen ---
    if (algoKey === 'nqueen_data') {
        return (
            <div className="space-y-4">
                {header}
                <div>
                    <label className="text-xs font-medium text-gray-600">Board Size — N (ขนาดกระดาน N×N)</label>
                    <Input
                        type="number"
                        min="4"
                        max="12"
                        value={data?.n ?? ''}
                        onChange={(e) => update('n', parseInt(e.target.value) || null)}
                        placeholder="เช่น 4, 8"
                        className="mt-1"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                        กระดานหมากรุก N×N — ผู้เล่นต้องวาง Queen N ตัวไม่ให้กินกันได้
                    </p>
                </div>
            </div>
        );
    }

    // --- Emei Mountain (Graph-based) ---
    if (algoKey === 'applied_data') {
        const payload = data?.payload || {};
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-700 uppercase">Emei Mountain</h3>
                    <Button variant="ghost" size="sm" onClick={handleJsonToggle} className="text-[10px] text-gray-400">
                        {showJson ? 'Form View' : 'JSON View'}
                    </Button>
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-600">Tourists (จำนวนนักท่องเที่ยว)</label>
                    <Input
                        type="number"
                        min="1"
                        value={payload?.tourists ?? ''}
                        onChange={(e) => update('payload.tourists', parseInt(e.target.value) || null)}
                        placeholder="เช่น 20"
                        className="mt-1"
                    />
                </div>
                <p className="text-[10px] text-gray-400">
                    Node, Start, End, Edges → วาดบน canvas ด้านขวาได้เลย
                </p>
            </div>
        );
    }

    // Fallback: unknown algo type
    return (
        <div className="space-y-2">
            {header}
            <p className="text-xs text-gray-400">Unknown algorithm type. Use JSON View to edit.</p>
        </div>
    );
};

export default AlgoDataForm;
