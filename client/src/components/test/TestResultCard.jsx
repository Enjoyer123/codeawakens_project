import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Lock } from 'lucide-react';

const TestResultCard = ({ result, displayType, onContinue }) => {
  if (result.locked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl text-center p-8 border-red-200">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-gray-800">Locked</h1>

          <div className="bg-red-50 border border-red-100 text-red-800 p-6 rounded-lg mb-8 text-left">
            <p className="font-bold text-lg mb-3">You typically need to complete the following levels before taking the {displayType}:</p>
            <ul className="list-disc pl-5 space-y-2">
              {result.missingLevels && result.missingLevels.map((level) => (
                <li key={level.level_id} className="text-md">
                  {level.level_name} (ID: {level.level_id})
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={() => window.location.href = '/user/mapselect'} size="lg" variant="outline">
            Return to Map Selection
          </Button>
        </Card>
      </div>
    );
  }

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
