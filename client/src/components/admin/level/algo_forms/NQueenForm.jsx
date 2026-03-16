import { Input } from '@/components/ui/input';

const NQueenForm = ({ data, onChange }) => {
    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-medium text-gray-600">Board Size — N (ขนาดกระดาน N×N)</label>
                <Input
                    type="number"
                    min="4"
                    max="12"
                    value={data?.n ?? ''}
                    onChange={(e) => onChange({ ...data, n: parseInt(e.target.value) || null })}
                    placeholder="เช่น 4, 8"
                    className="mt-1"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                    กระดานหมากรุก N×N — ผู้เล่นต้องวาง Queen N ตัวไม่ให้กินกันได้
                </p>
            </div>
        </div>
    );
};

export default NQueenForm;
