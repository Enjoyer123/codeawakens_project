import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const StepEditor = ({
  currentStepIndex,
  question,
  setQuestion,
  reasoning,
  setReasoning,
  suggestion,
  setSuggestion,
  difficulty,
  setDifficulty,
  highlightBlocks,
  setHighlightBlocks,
  onPrev,
  onNext,
  stepsCount
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">
        Step {currentStepIndex + 1}
      </h2>

      <div className="space-y-4">
        <div>
          <Label htmlFor="stepQuestion">คำถาม *</Label>
          <Textarea
            id="stepQuestion"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="เช่น: หลังจากวางบล็อก move_forward แล้วควรทำอย่างไรต่อ?"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="stepReasoning">เหตุผล</Label>
          <Textarea
            id="stepReasoning"
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            placeholder="เช่น: การเดินต่อเนื่องเป็นพื้นฐานในการเคลื่อนที่ไปข้างหน้า"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="stepSuggestion">คำแนะนำ</Label>
          <Textarea
            id="stepSuggestion"
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            placeholder="เช่น: ลองเพิ่ม move_forward block อีกครั้งเพื่อเดินต่อ"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="stepDifficulty">ระดับความยาก</Label>
          <select
            id="stepDifficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="basic">Basic</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <Label htmlFor="stepHighlightBlocks">Highlight Blocks (คั่นด้วย comma)</Label>
          <Input
            id="stepHighlightBlocks"
            value={highlightBlocks}
            onChange={(e) => setHighlightBlocks(e.target.value)}
            placeholder="เช่น: move_forward, turn_left"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onPrev}
            disabled={currentStepIndex === 0}
            variant="outline"
            className="flex-1"
          >
            ← ก่อนหน้า
          </Button>
          <Button
            onClick={onNext}
            variant="outline"
            className="flex-1"
          >
            ถัดไป →
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          Step ที่บันทึกแล้ว: {stepsCount}
        </div>
      </div>
    </div>
  );
};

export default StepEditor;
