import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BIG_O_OPTIONS } from '../constants/bigOOptions';

const BigOQuizModal = ({ isOpen, onClose, onSelect, currentPatternName }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-stone-900 text-white border-stone-700">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-yellow-400">
                        Big O Complexity Quiz
                    </DialogTitle>
                    <DialogDescription className="text-gray-300">
                        Code ของคุณตรงกับรูปแบบ <strong>{currentPatternName || 'รูปแบบที่ไม่รู้จัก'}</strong>!
                        <br />
                        คุณคิดว่า Code นี้มีความซับซ้อน (Time Complexity) เท่าไหร่?
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-3 py-4">
                    {BIG_O_OPTIONS.map((option) => (
                        <Button
                            key={option.value}
                            variant="outline"
                            className="justify-start text-left h-auto py-3 px-4 bg-stone-800 border-stone-600 hover:bg-stone-700 hover:text-yellow-300 transition-colors"
                            onClick={() => onSelect(option.value)}
                        >
                            <div className="flex flex-col items-start">
                                <span className="font-mono text-lg font-bold">{option.label}</span>
                                <span className="text-xs text-gray-400 font-normal mt-1">{option.description || ''}</span>
                            </div>
                        </Button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BigOQuizModal;
