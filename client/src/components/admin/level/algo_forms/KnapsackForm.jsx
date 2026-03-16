import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

const KnapsackForm = ({ data, onChange }) => {
    const items = data?.items || [];
    
    // Helper updates
    const updateField = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    const updateBagLabel = (label) => {
        onChange({ ...data, bag: { ...(data.bag || {}), label } });
    };

    const updateItem = (index, updates) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], ...updates };
        updateField('items', newItems);
    };

    const removeItem = (index) => {
        updateField('items', items.filter((_, idx) => idx !== index));
    };

    const addItem = () => {
        const spacing = 150;
        const startX = 150;
        const newId = items.length > 0 ? Math.max(...items.map(i => i.id || 0)) + 1 : 1;
        updateField('items', [...items, { 
            id: newId, 
            x: startX + items.length * spacing, 
            y: 150, 
            label: '', 
            price: null, 
            weight: null 
        }]);
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-medium text-gray-600">Capacity (น้ำหนักสูงสุด kg)</label>
                <Input
                    type="number"
                    min="1"
                    value={data?.capacity ?? ''}
                    onChange={(e) => updateField('capacity', parseInt(e.target.value) || null)}
                    placeholder="เช่น 50"
                    className="mt-1"
                />
            </div>
            <div>
                <label className="text-xs font-medium text-gray-600">Bag Name (ชื่อกระเป๋า)</label>
                <Input
                    type="text"
                    value={data?.bag?.label ?? ''}
                    onChange={(e) => updateBagLabel(e.target.value)}
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
                                onChange={(e) => updateItem(i, { weight: parseInt(e.target.value) || null })}
                                placeholder="kg"
                                className="h-7 text-xs"
                            />
                            <Input
                                type="number"
                                min="1"
                                value={item?.price ?? ''}
                                onChange={(e) => updateItem(i, { price: parseInt(e.target.value) || null })}
                                placeholder="฿"
                                className="h-7 text-xs"
                            />
                            <Input
                                value={item?.label ?? ''}
                                onChange={(e) => updateItem(i, { label: e.target.value })}
                                placeholder="ชื่อ"
                                className="h-7 text-xs"
                            />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeItem(i)} className="h-7 w-7 p-0 text-red-400 hover:text-red-600">
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                ))}
                <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-1">
                    <span className="w-6"></span>
                    <span className="flex-1 grid grid-cols-3 gap-1"><span>Weight</span><span>Price</span><span>Label</span></span>
                </div>
                <Button variant="outline" size="sm" onClick={addItem} className="text-xs mt-1">
                    <Plus className="h-3 w-3 mr-1" /> เพิ่ม Item
                </Button>
            </div>
        </div>
    );
};

export default KnapsackForm;
