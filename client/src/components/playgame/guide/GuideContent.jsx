import React from 'react';

const GuideContent = ({ currentGuide }) => {
    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-xl font-semibold text-gray-600 mb-3">
                    {currentGuide.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">
                    {currentGuide.description}
                </p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <div className="text-white mt-1">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="font-medium text-white mb-1">เคล็ดลับ</h4>
                        <p className="text-white text-sm">
                            ทำตามขั้นตอนอย่างระมัดระวังและอ่านคำแนะนำให้ครบถ้วน
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuideContent;
