import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Lock } from 'lucide-react';

const TestResultCard = ({ result, displayType, onContinue }) => {
  if (result.locked) {
    return (
      <div className="min-h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-100 transform transition-all">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Lock className="w-8 h-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold mb-3 text-gray-900">ยังไม่สามารถเข้าทดสอบได้</h1>

            <div className="bg-red-50/80 border border-red-100 text-red-800 p-5 rounded-lg mb-8 w-full text-left">
              <p className="font-semibold text-sm mb-3 text-center sm:text-left">
                คุณจำเป็นต้องผ่านด่านต่อไปนี้ก่อน จึงจะสามารถทำ {displayType} ได้:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                {result.missingLevels && result.missingLevels.map((level) => (
                  <li key={level.level_id} className="font-medium">
                    {level.level_name}
                  </li>
                ))}
              </ul>
            </div>

            <Button 
              onClick={() => window.location.href = '/user/mapselect'} 
              className="w-full inline-flex justify-center items-center px-6 py-3 bg-[#7048e8] text-white text-lg font-bold rounded-lg hover:bg-[#5b37cc] focus:outline-none focus:ring-4 focus:ring-[#7048e8]/30 transition-all shadow-md active:scale-[0.98] h-auto"
            >
              กลับไปที่หน้าเลือกแผนที่
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-100 transform transition-all">
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          
          <h1 className="text-2xl font-bold mb-4 text-gray-900 text-center">ทำ {displayType}<br />เสร็จสิ้น!</h1>

          {result.alreadyDone && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6 w-full text-center">
              <p className="font-bold text-sm mb-1">คุณทำแบบทดสอบนี้ไปแล้ว</p>
              <p className="text-xs">หากต้องการสอบใหม่ กรุณาติดต่อผู้ดูแลระบบ</p>
            </div>
          )}

          <div className="text-lg mb-8 text-gray-700 font-medium text-center">
            คะแนนของคุณ: <br />
            <span className="text-4xl font-black text-[#7048e8] mt-2 inline-block">
              {result.score}
            </span>
            {result.total ? <span className="text-xl text-gray-400 font-bold ml-1">/ {result.total}</span> : ''}
            
            {result.percentage !== undefined && (
              <div className="text-sm text-gray-500 mt-2 font-semibold">
                ({result.percentage.toFixed(1)}%)
              </div>
            )}
          </div>

          <Button 
            onClick={onContinue} 
            className="w-full inline-flex justify-center items-center px-6 py-3 bg-[#7048e8] text-white text-lg font-bold rounded-lg hover:bg-[#5b37cc] focus:outline-none focus:ring-4 focus:ring-[#7048e8]/30 transition-all shadow-md active:scale-[0.98] h-auto"
          >
            ดำเนินการต่อ
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TestResultCard;
