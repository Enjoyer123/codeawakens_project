import { Input } from '@/components/ui/input';

const EmeiForm = ({ data, onChange }) => {
    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-medium text-gray-600">Tourists (จำนวนนักท่องเที่ยว)</label>
                <Input
                    type="number"
                    min="1"
                    value={data?.tourists ?? ''}
                    onChange={(e) => onChange({ ...data, tourists: parseInt(e.target.value) || null })}
                    placeholder="เช่น 20"
                    className="mt-1"
                />
            </div>
            <p className="text-[10px] text-gray-400">
                Node, Start, End, Edges → วาดบน canvas ด้านขวาได้เลย
            </p>
        </div>
    );
};

export default EmeiForm;
