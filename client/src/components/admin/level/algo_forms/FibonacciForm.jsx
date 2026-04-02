import { Input } from '@/components/ui/input';

const FibonacciForm = ({ data, onChange }) => {
    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-medium text-gray-600">Fibonacci Number — n (ค่าลำดับที่ต้องการหา)</label>
                <Input
                    type="number"
                    min="1"
                    max="20"
                    value={data?.n ?? ''}
                    onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) return onChange({ ...data, n: null });
                        // Clamp value from 1 to 20 for safety/practicality in visualization
                        if (val > 20) val = 20;
                        if (val < 1) val = 1;
                        onChange({ ...data, n: val });
                    }}
                    placeholder="เช่น 5, 7, 10"
                    className="mt-1"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                    คำนวณ Fibonacci ลำดับที่ n — ผู้เล่นต้องเขียนโปรแกรมเพื่อหาค่านี้
                </p>
            </div>
        </div>
    );
};

export default FibonacciForm;
