import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

const TestResultCard = ({ result, displayType, onContinue }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl text-center p-8">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold mb-4">{displayType} Completed!</h1>

        {result.alreadyDone && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6">
            <p className="font-bold text-lg mb-1">คุณทำแบบทดสอบนี้ไปแล้ว</p>
            <p>หากต้องการสอบใหม่ กรุณาติดต่อผู้ดูแลระบบ</p>
          </div>
        )}

        <div className="text-xl mb-6">
          Your Score: <span className="font-bold text-primary">{result.score}</span>
          {result.total ? ` / ${result.total}` : ''}
        </div>
        {result.percentage !== undefined && (
          <p className="text-gray-600 mb-8">
            ({result.percentage.toFixed(1)}%)
          </p>
        )}
        <Button onClick={onContinue} size="lg">
          Continue to Game
        </Button>
      </Card>
    </div>
  );
};

export default TestResultCard;
